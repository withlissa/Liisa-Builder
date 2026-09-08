import { useEffect, useRef, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useBalance, useDisconnect, useReadContract, useSignMessage, useSwitchChain } from 'wagmi';
import { formatUnits, verifyMessage } from 'viem';
import { ACCESS_TOKEN_ADDRESS, accessTokenAbi, robinhoodChain } from '@/lib/web3';
import { useClaimCredits, useGetCreditStatus } from '@workspace/api-client-react';
import BuilderHome from '@/components/builder-home';
import StudioWorkspace from '@/components/studio-workspace';
import AccessGate from '@/components/access-gate';
import type { AgentEvent, GeneratedApp } from '@workspace/api-client-react';
import { webcontainerRuntime } from '@/lib/webcontainer-runtime';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
  isLoading?: boolean;
  attachments?: Array<{ name: string; type: string; size: number }>;
  agentEvents?: AgentEvent[];
};

type PendingBuild = {
  id: string;
  pollToken: string;
  loadingMessageId: string;
  kind: 'initial' | 'followup';
};

export type ProjectSession = {
  id: string;
  prompt: string;
  app: GeneratedApp | null;
  messages: Message[];
  pendingBuild?: PendingBuild;
  createdAt: number;
  updatedAt: number;
};

const PROJECT_STORAGE_KEY = 'lissa-projects-v1';
const PENDING_BUILD_STORAGE_KEY = 'lissa-pending-builds-v1';
const WALLET_SESSION_KEY = 'lissa-wallet-sessions-v1';
const ACTIVE_WALLET_SESSION_KEY = 'lissa-active-wallet-session-v1';

type WalletSessionProof = {
  address: `0x${string}`;
  message: string;
  signature: `0x${string}`;
};

type AgentBuildJob = {
  id: string;
  pollToken?: string;
  status: 'queued' | 'working' | 'completed' | 'failed' | 'cancelled';
  stage: string;
  result?: GeneratedApp;
  error?: string;
  cancelReason?: string | null;
  events: AgentEvent[];
  runtimeRevision?: number;
  runtimeState?: 'idle' | 'awaiting' | 'received';
};

class AgentJobFailedError extends Error {}
class AgentJobCancelledError extends AgentJobFailedError {}

function appendAgentEvent(message: Message, event: AgentEvent): Message {
  const currentEvents = message.agentEvents || [];
  if (currentEvents.some(current => current.id === event.id)) return message;
  return {
    ...message,
    agentEvents: [...currentEvents, event].sort((a, b) => a.id - b.id),
    isLoading: event.type !== 'complete' && event.type !== 'error',
    isError: event.type === 'error',
  };
}

async function runAgentBuild(
  data: { prompt: string; mode: string; walletAddress?: string; existingCode?: string },
  onEvent?: (event: AgentEvent) => void,
  onStarted?: (job: { id: string; pollToken: string }) => void,
  pendingJob?: { id: string; pollToken: string },
  onCandidate?: (app: GeneratedApp) => void,
) {
  let credentials = pendingJob;
  const deliveredEventIds = new Set<number>();
  let eventSource: EventSource | null = null;

  const deliverEvents = (events: AgentEvent[]) => {
    for (const event of events) {
      if (deliveredEventIds.has(event.id)) continue;
      deliveredEventIds.add(event.id);
      onEvent?.(event);
    }
  };

  if (!credentials) {
    const started = await fetch('/api/build/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!started.ok) {
      const payload = await started.json().catch(() => ({})) as { error?: string };
      throw new Error(payload.error || 'Could not start the agent.');
    }
    const initial = await started.json() as AgentBuildJob;
    if (!initial.pollToken) throw new Error('The agent did not return a polling token.');
    credentials = { id: initial.id, pollToken: initial.pollToken };
    onStarted?.(credentials);
  }

  const streamUrl = `/api/build/jobs/events?id=${encodeURIComponent(credentials.id)}&pollToken=${encodeURIComponent(credentials.pollToken)}`;
  eventSource = new EventSource(streamUrl);
  eventSource.addEventListener('agent', event => {
    try {
      deliverEvents([JSON.parse((event as MessageEvent<string>).data) as AgentEvent]);
    } catch {
      // Polling below remains the authoritative replay fallback.
    }
  });
  eventSource.addEventListener('done', () => eventSource?.close());

  let consecutivePollFailures = 0;
  const pollingStartedAt = Date.now();
  try {
    for (;;) {
      if (Date.now() - pollingStartedAt > 22 * 60 * 1000) {
        throw new AgentJobFailedError('The build is still running. Reopen this project to resume it safely.');
      }
      try {
        const response = await fetch(
          `/api/build/jobs/status?id=${encodeURIComponent(credentials.id)}&pollToken=${encodeURIComponent(credentials.pollToken)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) {
          if (response.status === 404) {
            consecutivePollFailures += 1;
            if (consecutivePollFailures >= 3) {
              throw new AgentJobFailedError('The saved agent job could not be found. Start a new build.');
            }
            throw new Error('Temporary polling response 404');
          }
          if (response.status >= 500) {
            throw new Error(`Temporary polling response ${response.status}`);
          }
          const payload = await response.json().catch(() => ({})) as { error?: string };
          throw new AgentJobFailedError(payload.error || 'The agent job could not be read.');
        }
        consecutivePollFailures = 0;
        const job = await response.json() as AgentBuildJob;
        deliverEvents(job.events || []);
        // Runtime verification is intentionally driven from every authoritative
        // status snapshot, not from a particular Studio tab.
        if (job.status === 'working' && job.result && job.runtimeState === 'awaiting' && typeof job.runtimeRevision === 'number') {
          onCandidate?.(job.result);
          void webcontainerRuntime.execute({
            files: job.result.files,
            htmlPreview: job.result.htmlPreview,
            credentials,
            revision: job.runtimeRevision,
          });
        }
        if (job.status === 'completed' && job.result) return job.result;
        if (job.status === 'failed') throw new AgentJobFailedError(job.error || 'Agent build failed.');
        if (job.status === 'cancelled') {
          throw new AgentJobCancelledError(job.cancelReason || job.error || 'Build stopped.');
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        if (error instanceof AgentJobFailedError) throw error;
        consecutivePollFailures += 1;
        await new Promise(resolve => setTimeout(resolve, Math.min(10_000, 1000 * consecutivePollFailures)));
      }
    }
  } finally {
    eventSource.close();
  }
}

async function persistAgentProject(projectId: string, walletAddress: string | undefined, app: GeneratedApp) {
  if (!walletAddress) return;
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      title: app.appName || app.title,
      files: {
        ...Object.fromEntries(app.files.map(file => [file.name, file.code])),
        '__lissa_preview.html': app.htmlPreview,
      },
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || 'The generated project could not be saved.');
  }
}

function loadProjects(): ProjectSession[] {
  try {
    const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
    const projects = stored ? JSON.parse(stored) as ProjectSession[] : [];
    const pending = JSON.parse(localStorage.getItem(PENDING_BUILD_STORAGE_KEY) || '{}') as Record<string, PendingBuild>;
    return projects.map(project => pending[project.id] ? { ...project, pendingBuild: pending[project.id] } : project);
  } catch {
    return [];
  }
}

function persistPendingBuild(projectId: string, pendingBuild: PendingBuild) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_BUILD_STORAGE_KEY) || '{}') as Record<string, PendingBuild>;
    localStorage.setItem(PENDING_BUILD_STORAGE_KEY, JSON.stringify({ ...pending, [projectId]: pendingBuild }));
    return true;
  } catch {
    return false;
  }
}

function clearPendingBuild(projectId: string) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_BUILD_STORAGE_KEY) || '{}') as Record<string, PendingBuild>;
    delete pending[projectId];
    localStorage.setItem(PENDING_BUILD_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // The in-memory session still clears the completed credential.
  }
}

function persistTerminalProject(
  projectId: string,
  loadingMessageId: string,
  messageUpdate: Partial<Message>,
  app?: GeneratedApp,
) {
  try {
    const stored = JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) || '[]') as ProjectSession[];
    const next = stored.map(project => project.id === projectId
      ? {
          ...project,
          app: app ?? project.app,
          pendingBuild: undefined,
          messages: project.messages.map(message => message.id === loadingMessageId
            ? { ...message, ...messageUpdate }
            : message),
          updatedAt: Date.now(),
        }
      : project);
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export default function LissaApp() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const rootPath = basePath || '/';
  const workspacePath = `${basePath}/workspace`;
  const isWorkspaceDocument = window.location.pathname === workspacePath;
  const [inStudio, setInStudio] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [projects, setProjects] = useState<ProjectSession[]>(loadProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [workspaceAddress, setWorkspaceAddress] = useState<`0x${string}` | null>(null);
  const [workspaceSessionChecked, setWorkspaceSessionChecked] = useState(!isWorkspaceDocument);
  const [accessEntered, setAccessEntered] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [isStoppingBuild, setIsStoppingBuild] = useState(false);
  const [stopBuildError, setStopBuildError] = useState<string | null>(null);
  const activeProjectIdRef = useRef<string | null>(null);
  const activeBuildCredentialsRef = useRef<({ id: string; pollToken: string; projectId: string }) | null>(null);
  const resumingJobsRef = useRef(new Set<string>());

  // Wallet and Web3 hooks
  const { open } = useAppKit();
  const {
    address: connectedAddress,
    isConnected: walletConnected,
    chainId: connectedChainId,
    status: accountStatus,
  } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { signMessageAsync, isPending: isSigningIn } = useSignMessage();
  const address = connectedAddress || workspaceAddress || undefined;
  const isConnected = walletConnected || Boolean(workspaceAddress);
  const chainId = connectedChainId || (workspaceAddress ? robinhoodChain.id : undefined);
  const { data: nativeBalance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: robinhoodChain.id,
    query: {
      enabled: Boolean(address && chainId === robinhoodChain.id),
    },
  });
  const tokenQueryEnabled = Boolean(address && chainId === robinhoodChain.id);
  const tokenContract = {
    address: ACCESS_TOKEN_ADDRESS,
    abi: accessTokenAbi,
    chainId: robinhoodChain.id,
  } as const;
  const { data: lissaBalance, isLoading: isLissaBalanceLoading, error: lissaBalanceError } = useReadContract({
    ...tokenContract,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: tokenQueryEnabled },
  });
  const { data: lissaTotalSupply, isLoading: isSupplyLoading, error: supplyError } = useReadContract({
    ...tokenContract,
    functionName: 'totalSupply',
    query: { enabled: tokenQueryEnabled },
  });
  const { data: lissaDecimals } = useReadContract({
    ...tokenContract,
    functionName: 'decimals',
    query: { enabled: tokenQueryEnabled },
  });
  const { data: lissaSymbol } = useReadContract({
    ...tokenContract,
    functionName: 'symbol',
    query: { enabled: tokenQueryEnabled },
  });
  const isTokenDataLoading = isLissaBalanceLoading || isSupplyLoading;
  const minimumLissaBalance = lissaTotalSupply === undefined
    ? undefined
    : (lissaTotalSupply + 999n) / 1000n;
  const hasLissaAccess = Boolean(
    tokenQueryEnabled &&
    lissaBalance !== undefined &&
    lissaTotalSupply !== undefined &&
    lissaBalance * 1000n >= lissaTotalSupply,
  );
  const tokenReadError = lissaBalanceError || supplyError;

  const creditStatusQuery = useGetCreditStatus(
    address ? { walletAddress: address } : undefined,
    { query: { queryKey: ['credit-status', address], refetchInterval: 30_000 } },
  );
  const claimCreditsMutation = useClaimCredits();

  const formatCompletion = (data: GeneratedApp, isUpdate: boolean) => {
    const featureSummary = data.features.slice(0, 4).map((feature) => `• ${feature}`).join('\n');
    const nextStep = data.suggestedNextSteps[0];
    return `${isUpdate ? 'I updated' : 'I built'} ${data.appName || data.title}.\n\n${data.description}\n\nWhat is included:\n${featureSummary}${nextStep ? `\n\nA useful next step would be: ${nextStep}` : ''}`;
  };

  useEffect(() => {
    try {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
    } catch {
      // Keep the current sessions available in memory if browser storage is full.
    }
  }, [projects]);

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  useEffect(() => {
    if (!isConnected || !hasLissaAccess) setAccessEntered(false);
  }, [isConnected, hasLissaAccess]);

  useEffect(() => {
    if (accessEntered && !isWorkspaceDocument) window.location.replace(workspacePath);
  }, [accessEntered, isWorkspaceDocument, workspacePath]);

  useEffect(() => {
    if (!isWorkspaceDocument) return;
    let active = true;
    void (async () => {
      try {
        const proof = JSON.parse(localStorage.getItem(ACTIVE_WALLET_SESSION_KEY) || 'null') as WalletSessionProof | null;
        if (
          !proof ||
          !/^0x[0-9a-fA-F]{40}$/.test(proof.address) ||
          !/^0x[0-9a-fA-F]+$/.test(proof.signature) ||
          !await verifyMessage(proof)
        ) {
          localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
          return;
        }
        if (active) setWorkspaceAddress(proof.address);
      } catch {
        localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
      } finally {
        if (active) setWorkspaceSessionChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [isWorkspaceDocument]);

  useEffect(() => {
    if (
      isWorkspaceDocument &&
      workspaceSessionChecked &&
      !connectedAddress &&
      !workspaceAddress &&
      accountStatus === 'disconnected'
    ) {
      window.location.replace(rootPath);
    }
  }, [accountStatus, connectedAddress, isWorkspaceDocument, rootPath, workspaceAddress, workspaceSessionChecked]);

  useEffect(() => {
    if (
      isWorkspaceDocument &&
      connectedAddress &&
      workspaceAddress &&
      connectedAddress.toLowerCase() !== workspaceAddress.toLowerCase()
    ) {
      void fetch('/api/github/disconnect', { method: 'POST', keepalive: true });
      localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
      window.location.replace(rootPath);
    }
  }, [connectedAddress, isWorkspaceDocument, rootPath, workspaceAddress]);

  useEffect(() => {
    if (!address || !hasLissaAccess) return;
    try {
      const sessions: string[] = JSON.parse(localStorage.getItem(WALLET_SESSION_KEY) || '[]');
      if (sessions.includes(address.toLowerCase())) setAccessEntered(true);
    } catch {
      localStorage.removeItem(WALLET_SESSION_KEY);
    }
  }, [address, hasLissaAccess]);

  const handleWalletSignIn = async () => {
    if (!address || !hasLissaAccess || chainId !== robinhoodChain.id) return;
    setSignInError(null);
    try {
      const message = `Sign in to Lissa\n\nWallet: ${address}\nNetwork: Robinhood Chain\nChain ID: ${robinhoodChain.id}\n\nThis request does not trigger a transaction or cost gas.`;
      const signature = await signMessageAsync({ message });
      const valid = await verifyMessage({ address, message, signature });
      if (!valid) throw new Error('Wallet signature could not be verified.');
      const sessions: string[] = JSON.parse(localStorage.getItem(WALLET_SESSION_KEY) || '[]');
      const next = Array.from(new Set([...sessions, address.toLowerCase()]));
      localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(next));
      const proof: WalletSessionProof = { address, message, signature };
      localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, JSON.stringify(proof));
      setAccessEntered(true);
    } catch {
      setSignInError('Sign-in was not completed. Approve the request in your wallet to continue.');
    }
  };

  const handleDisconnect = () => {
    void fetch('/api/github/disconnect', { method: 'POST', keepalive: true });
    localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
    setWorkspaceAddress(null);
    setAccessEntered(false);
    if (walletConnected) disconnect();
    if (isWorkspaceDocument) window.location.replace(rootPath);
  };

  const addFileContext = async (prompt: string, files: File[]) => {
    if (!files.length) return prompt;
    const details = await Promise.all(files.map(async (file) => {
      const isText = file.type.startsWith('text/') || /\.(md|txt|json|csv|html|css|js|jsx|ts|tsx)$/i.test(file.name);
      const content = isText && file.size <= 150_000 ? `\nContent:\n${(await file.text()).slice(0, 20_000)}` : '';
      return `\n\nAttachment: ${file.name} (${file.type || 'file'}, ${file.size} bytes)${content}`;
    }));
    return `${prompt}\n\nUse these uploaded files as reference:${details.join('')}`;
  };

  const handleInitialBuild = async (prompt: string, files: File[] = []) => {
    const projectId = crypto.randomUUID();
    const attachments = files.map(({ name, type, size }) => ({ name, type, size }));
    const newMsg: Message = { id: Date.now().toString(), role: 'user', text: prompt, attachments };
    const loadingMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: '', isLoading: true, agentEvents: [] };
    setMessages([newMsg, loadingMsg]);
    setGeneratedApp(null);
    setActiveProjectId(projectId);
    const projectSession: ProjectSession = {
      id: projectId,
      prompt,
      app: null,
      messages: [newMsg, loadingMsg],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const initialProjects = [projectSession, ...projects];
    try {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(initialProjects));
    } catch {
      const failed = { ...loadingMsg, text: 'Browser storage is unavailable. Free some site storage before starting a durable build.', isLoading: false, isError: true };
      setMessages([newMsg, failed]);
      setProjects([projectSession, ...projects]);
      setInStudio(true);
      return;
    }
    setProjects(initialProjects);
    setInStudio(true);
    const contextualPrompt = await addFileContext(prompt, files);
    setIsAgentRunning(true);
    setStopBuildError(null);
    let runningJobId: string | undefined;
    try {
      const data = await runAgentBuild(
        { prompt: contextualPrompt, mode: 'Build', walletAddress: address },
        event => {
          setMessages(current => current.map(message => message.id === loadingMsg.id ? appendAgentEvent(message, event) : message));
          setProjects(current => current.map(project => project.id === projectId
            ? { ...project, messages: project.messages.map(message => message.id === loadingMsg.id ? appendAgentEvent(message, event) : message), updatedAt: Date.now() }
            : project));
        },
         job => {
           runningJobId = job.id;
            activeBuildCredentialsRef.current = { ...job, projectId };
           resumingJobsRef.current.add(job.id);
           const pendingBuild: PendingBuild = { ...job, loadingMessageId: loadingMsg.id, kind: 'initial' };
           if (!persistPendingBuild(projectId, pendingBuild)) {
             setMessages(current => current.map(message => message.id === loadingMsg.id
               ? { ...message, text: 'Build is running, but its recovery key could not be saved. Keep this tab open until it finishes.' }
               : message));
           }
           setProjects(current => current.map(project => project.id === projectId
             ? { ...project, pendingBuild, updatedAt: Date.now() }
             : project));
         },
          undefined,
          candidate => setGeneratedApp(candidate),
      );
        void creditStatusQuery.refetch();
        void persistAgentProject(projectId, address, data);
        const completion = formatCompletion(data, false);
        const terminalSaved = persistTerminalProject(
          projectId,
          loadingMsg.id,
          { text: completion, isLoading: false, isError: false },
          data,
        );
        if (terminalSaved) clearPendingBuild(projectId);
        setGeneratedApp(data);
        setMessages(prev => {
          const completed = prev.map(m => m.id === loadingMsg.id ? {
            ...m,
            text: terminalSaved ? completion : `${completion}\n\nKeep this tab open: the completed project could not be saved to browser storage yet.`,
            isLoading: false,
          } : m);
          setProjects(current => current.map(project => project.id === projectId
            ? { ...project, app: data, messages: completed, pendingBuild: terminalSaved ? undefined : project.pendingBuild, updatedAt: Date.now() }
            : project));
          return completed;
        });
    } catch (error) {
        const wasCancelled = error instanceof AgentJobCancelledError;
        const detail = error instanceof Error && /abort|timeout/i.test(error.message)
          ? 'Build took too long. Please try again with a more focused prompt.'
          : error instanceof Error ? error.message : 'Build failed. Please try again.';
        const terminalSaved = persistTerminalProject(
          projectId,
          loadingMsg.id,
          { text: detail, isLoading: false, isError: true },
        );
        if (terminalSaved || wasCancelled) clearPendingBuild(projectId);
         setMessages(prev => {
            const failed = prev.map(m => m.id === loadingMsg.id ? { ...m, text: detail, isLoading: false, isError: true } : m);
           setProjects(current => current.map(project => project.id === projectId
              ? { ...project, messages: failed, pendingBuild: terminalSaved || wasCancelled ? undefined : project.pendingBuild, updatedAt: Date.now() }
             : project));
           return failed;
         });
    } finally {
      if (runningJobId) resumingJobsRef.current.delete(runningJobId);
       if (activeBuildCredentialsRef.current?.id === runningJobId) activeBuildCredentialsRef.current = null;
       setIsStoppingBuild(false);
      setIsAgentRunning(false);
    }
  };

  const handleFollowUp = async (prompt: string, files: File[] = []) => {
     const attachments = files.map(({ name, type, size }) => ({ name, type, size }));
     const newMsg: Message = { id: Date.now().toString(), role: 'user', text: prompt, attachments };
      const loadingMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: '', isLoading: true, agentEvents: [] };
     setMessages(prev => {
       const pending = [...prev, newMsg, loadingMsg];
       if (activeProjectId) {
         setProjects(current => current.map(project => project.id === activeProjectId
           ? { ...project, messages: pending, updatedAt: Date.now() }
           : project));
       }
       return pending;
     });
     const existingCode = generatedApp?.files
       .map((f) => `// File: ${f.name}\n${f.code}`)
       .join('\n\n')
       .slice(-50_000);

      const contextualPrompt = await addFileContext(prompt, files);
      setIsAgentRunning(true);
       setStopBuildError(null);
      let runningJobId: string | undefined;
      try {
        const data = await runAgentBuild(
          { prompt: contextualPrompt, mode: 'Build', existingCode, walletAddress: address },
           event => {
             setMessages(current => current.map(message => message.id === loadingMsg.id ? appendAgentEvent(message, event) : message));
             if (activeProjectId) {
               setProjects(current => current.map(project => project.id === activeProjectId
                 ? { ...project, messages: project.messages.map(message => message.id === loadingMsg.id ? appendAgentEvent(message, event) : message), updatedAt: Date.now() }
                 : project));
             }
           },
           job => {
             runningJobId = job.id;
              if (activeProjectId) activeBuildCredentialsRef.current = { ...job, projectId: activeProjectId };
             resumingJobsRef.current.add(job.id);
             if (activeProjectId) {
               const pendingBuild: PendingBuild = { ...job, loadingMessageId: loadingMsg.id, kind: 'followup' };
               if (!persistPendingBuild(activeProjectId, pendingBuild)) {
                 setMessages(current => current.map(message => message.id === loadingMsg.id
                   ? { ...message, text: 'Build is running, but its recovery key could not be saved. Keep this tab open until it finishes.' }
                   : message));
               }
               setProjects(current => current.map(project => project.id === activeProjectId
                 ? { ...project, pendingBuild, updatedAt: Date.now() }
                 : project));
             }
           },
          undefined,
          candidate => setGeneratedApp(candidate),
        );
         void creditStatusQuery.refetch();
        const completion = formatCompletion(data, true);
        const terminalSaved = activeProjectId
          ? persistTerminalProject(activeProjectId, loadingMsg.id, { text: completion, isLoading: false, isError: false }, data)
          : false;
        if (activeProjectId && terminalSaved) clearPendingBuild(activeProjectId);
        if (activeProjectId) void persistAgentProject(activeProjectId, address, data);
        setGeneratedApp(data);
        setMessages(prev => {
          const completed = prev.map(m => m.id === loadingMsg.id ? {
            ...m,
            text: terminalSaved ? completion : `${completion}\n\nKeep this tab open: the completed project could not be saved to browser storage yet.`,
            isLoading: false,
          } : m);
          if (activeProjectId) {
            setProjects(current => current.map(project => project.id === activeProjectId
              ? { ...project, app: data, messages: completed, pendingBuild: terminalSaved ? undefined : project.pendingBuild, updatedAt: Date.now() }
              : project));
          }
          return completed;
        });
      } catch (error) {
        const wasCancelled = error instanceof AgentJobCancelledError;
        const detail = error instanceof Error ? error.message : 'Failed to update app. Please try again.';
        const terminalSaved = activeProjectId
          ? persistTerminalProject(activeProjectId, loadingMsg.id, { text: detail, isLoading: false, isError: true })
          : false;
        if (activeProjectId && (terminalSaved || wasCancelled)) clearPendingBuild(activeProjectId);
         setMessages(prev => {
           const failed = prev.map(m => m.id === loadingMsg.id ? { ...m, text: detail, isLoading: false, isError: true } : m);
           if (activeProjectId) {
             setProjects(current => current.map(project => project.id === activeProjectId
                 ? { ...project, messages: failed, pendingBuild: terminalSaved || wasCancelled ? undefined : project.pendingBuild, updatedAt: Date.now() }
               : project));
           }
           return failed;
         });
      } finally {
         if (runningJobId) resumingJobsRef.current.delete(runningJobId);
         if (activeBuildCredentialsRef.current?.id === runningJobId) activeBuildCredentialsRef.current = null;
         setIsStoppingBuild(false);
        setIsAgentRunning(false);
      }
  };

  const resumePendingProject = async (project: ProjectSession) => {
    const pending = project.pendingBuild;
    if (!pending || resumingJobsRef.current.has(pending.id)) return;
    resumingJobsRef.current.add(pending.id);
    if (activeProjectIdRef.current === project.id) {
      activeBuildCredentialsRef.current = { id: pending.id, pollToken: pending.pollToken, projectId: project.id };
      setIsAgentRunning(true);
      setStopBuildError(null);
    }

    const updateLoadingMessage = (transform: (message: Message) => Message) => {
      setProjects(current => current.map(candidate => candidate.id === project.id
        ? {
            ...candidate,
            messages: candidate.messages.map(message => message.id === pending.loadingMessageId ? transform(message) : message),
            updatedAt: Date.now(),
          }
        : candidate));
      if (activeProjectIdRef.current === project.id) {
        setMessages(current => current.map(message => message.id === pending.loadingMessageId ? transform(message) : message));
      }
    };

    try {
      const data = await runAgentBuild(
        { prompt: project.prompt, mode: 'Build' },
         event => updateLoadingMessage(message => appendAgentEvent(message, event)),
        undefined,
        pending,
        candidate => {
          if (activeProjectIdRef.current === project.id) setGeneratedApp(candidate);
        },
      );
      const completion = formatCompletion(data, pending.kind === 'followup');
      const terminalSaved = persistTerminalProject(
        project.id,
        pending.loadingMessageId,
        { text: completion, isLoading: false, isError: false },
        data,
      );
      if (terminalSaved) clearPendingBuild(project.id);
      updateLoadingMessage(message => ({
        ...message,
        text: terminalSaved ? completion : `${completion}\n\nKeep this tab open: the completed project could not be saved to browser storage yet.`,
        isLoading: false,
        isError: false,
      }));
      setProjects(current => current.map(candidate => candidate.id === project.id
        ? { ...candidate, app: data, pendingBuild: terminalSaved ? undefined : candidate.pendingBuild, updatedAt: Date.now() }
        : candidate));
      if (activeProjectIdRef.current === project.id) {
        setGeneratedApp(data);
        setIsAgentRunning(false);
      }
      void persistAgentProject(project.id, address, data);
      void creditStatusQuery.refetch();
    } catch (error) {
      const wasCancelled = error instanceof AgentJobCancelledError;
      const detail = error instanceof Error ? error.message : 'Agent build failed.';
      const terminalSaved = persistTerminalProject(
        project.id,
        pending.loadingMessageId,
        { text: detail, isLoading: false, isError: true },
      );
      if (terminalSaved || wasCancelled) clearPendingBuild(project.id);
      updateLoadingMessage(message => ({
        ...message,
        text: terminalSaved ? detail : `${detail}\n\nKeep this tab open: this terminal status could not be saved to browser storage yet.`,
        isLoading: false,
        isError: true,
      }));
      setProjects(current => current.map(candidate => candidate.id === project.id
        ? { ...candidate, pendingBuild: terminalSaved || wasCancelled ? undefined : candidate.pendingBuild, updatedAt: Date.now() }
        : candidate));
      if (activeProjectIdRef.current === project.id) setIsAgentRunning(false);
    } finally {
      resumingJobsRef.current.delete(pending.id);
      if (activeBuildCredentialsRef.current?.id === pending.id) activeBuildCredentialsRef.current = null;
      setIsStoppingBuild(false);
    }
  };

  useEffect(() => {
    for (const project of projects) {
      if (project.pendingBuild) void resumePendingProject(project);
    }
  }, [projects, address]);

  const handleClaimCredits = () => {
    if (!address) return;
    claimCreditsMutation.mutate({ data: { walletAddress: address } }, {
      onSuccess: () => void creditStatusQuery.refetch(),
    });
  };

  const handleStopBuild = async () => {
    const credentials = activeBuildCredentialsRef.current;
    if (isStoppingBuild) return;
    if (!credentials || credentials.projectId !== activeProjectIdRef.current) {
      setStopBuildError('The build is still starting. Try stopping it again in a moment.');
      return;
    }
    setIsStoppingBuild(true);
    setStopBuildError(null);
    // Stop browser execution before waiting for the network cancellation path.
    void webcontainerRuntime.stop();
    try {
      const response = await fetch('/api/build/jobs/cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: credentials.id, pollToken: credentials.pollToken }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error || 'The build could not be stopped.');
      }
      void creditStatusQuery.refetch();
    } catch (error) {
      setStopBuildError(error instanceof Error ? error.message : 'The build could not be stopped.');
      setIsStoppingBuild(false);
    }
  };
  
  const handleExitStudio = () => {
    setInStudio(false);
  };

  const handleResumeProject = async (projectId: string) => {
    const project = projects.find((candidate) => candidate.id === projectId);
    if (project) {
      activeBuildCredentialsRef.current = project.pendingBuild
        ? { id: project.pendingBuild.id, pollToken: project.pendingBuild.pollToken, projectId: project.id }
        : null;
      setActiveProjectId(project.id);
      setGeneratedApp(project.app);
      setMessages(project.messages);
      setIsAgentRunning(Boolean(project.pendingBuild));
      setInStudio(true);
      return;
    }
    if (!address) return;
    const response = await fetch(`/api/projects/${projectId}?walletAddress=${encodeURIComponent(address)}`);
    if (!response.ok) return;
    const saved = await response.json() as { id: string; title: string; files: Record<string, string>; createdAt: string; updatedAt: string };
    const preview = saved.files['__lissa_preview.html'] || saved.files['index.html'] || '';
    const sourceFiles = Object.entries(saved.files)
      .filter(([name]) => name !== '__lissa_preview.html')
      .map(([name, code]) => ({
        name,
        code,
        language: name.endsWith('.tsx') || name.endsWith('.ts') ? 'typescript'
          : name.endsWith('.css') ? 'css'
          : name.endsWith('.html') ? 'html'
          : name.endsWith('.json') ? 'json'
          : 'text',
      }));
    const restoredApp: GeneratedApp = {
      title: saved.title,
      appName: saved.title,
      description: 'Restored from your synced Lissa workspace.',
      category: 'Project',
      plan: ['Restore project files', 'Start the browser runtime', 'Continue building with Lissa'],
      features: ['Server-synced source', 'Browser runtime', 'Agent-assisted editing'],
      suggestedNextSteps: ['Ask Lissa to review or extend the restored project.'],
      htmlPreview: preview,
      files: sourceFiles,
      usage: { source: 'free', freeBuildsRemaining: creditStatusQuery.data?.freeBuildsRemaining ?? 0, creditBalance: creditStatusQuery.data?.creditBalance ?? 0 },
    };
    const restoredSession: ProjectSession = {
      id: saved.id,
      prompt: `Continue building ${saved.title}`,
      app: restoredApp,
      messages: [{ id: `${Date.now()}`, role: 'assistant', text: `${saved.title} was restored from your synced workspace.` }],
      createdAt: new Date(saved.createdAt).getTime(),
      updatedAt: new Date(saved.updatedAt).getTime(),
    };
    setProjects(current => [restoredSession, ...current.filter(candidate => candidate.id !== saved.id)]);
    setActiveProjectId(saved.id);
    setGeneratedApp(restoredApp);
    setMessages(restoredSession.messages);
    setInStudio(true);
  };

  const handleImportProject = (title: string, importedFiles: Record<string, string>) => {
    const projectId = crypto.randomUUID();
    const sourceFiles = Object.entries(importedFiles).map(([name, code]) => ({
      name,
      code,
      language: name.endsWith('.tsx') || name.endsWith('.ts') ? 'typescript'
        : name.endsWith('.jsx') || name.endsWith('.js') ? 'javascript'
        : name.endsWith('.css') ? 'css'
        : name.endsWith('.html') ? 'html'
        : name.endsWith('.json') ? 'json'
        : 'text',
    }));
    const app: GeneratedApp = {
      title,
      appName: title.split('/').pop() || title,
      description: `Imported from GitHub: ${title}`,
      category: 'Imported project',
      plan: ['Inspect the imported source', 'Start the browser runtime', 'Continue with Lissa'],
      features: ['GitHub source import', 'Editable files', 'Browser runtime'],
      suggestedNextSteps: ['Ask Lissa to review, run, or modify this repository.'],
      htmlPreview: importedFiles['index.html'] || '',
      files: sourceFiles,
      usage: { source: 'free', freeBuildsRemaining: creditStatusQuery.data?.freeBuildsRemaining ?? 0, creditBalance: creditStatusQuery.data?.creditBalance ?? 0 },
    };
    const importedMessage: Message = {
      id: `${Date.now()}`,
      role: 'assistant',
      text: `${title} was imported from GitHub. I’ve loaded the source into your workspace and will start its runtime when you open Code.`,
    };
    const session: ProjectSession = {
      id: projectId,
      prompt: `Import ${title} from GitHub`,
      app,
      messages: [importedMessage],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects(current => [session, ...current]);
    setActiveProjectId(projectId);
    setGeneratedApp(app);
    setMessages(session.messages);
    setInStudio(true);
    if (address) void persistAgentProject(projectId, address, app);
  };

  const walletProps = {
    address, isConnected, chainId, disconnect: handleDisconnect, switchChain, isSwitching,
    nativeBalance, isBalanceLoading, open
    , lissaBalance, minimumLissaBalance, lissaDecimals, lissaSymbol,
    hasLissaAccess, isTokenDataLoading, tokenReadError
  };

  if (!accessEntered) {
    return <AccessGate walletProps={walletProps} onSignIn={handleWalletSignIn} isSigningIn={isSigningIn} signInError={signInError} />;
  }

  return inStudio ? (
    <StudioWorkspace 
       messages={messages}
       onSendMessage={handleFollowUp}
       generatedApp={generatedApp}
         isGenerating={isAgentRunning}
       isStopping={isStoppingBuild}
       stopError={stopBuildError}
       onStop={handleStopBuild}
       walletProps={walletProps}
       onExit={handleExitStudio}
       projectId={activeProjectId}
    />
  ) : (
    <BuilderHome 
        onGenerate={handleInitialBuild}
       onResume={handleResumeProject}
        onImportProject={handleImportProject}
       projects={projects}
       walletProps={walletProps}
        creditStatus={creditStatusQuery.data}
        isCreditStatusLoading={creditStatusQuery.isLoading}
        onClaimCredits={handleClaimCredits}
        isClaimingCredits={claimCreditsMutation.isPending}
    />
  );
}
