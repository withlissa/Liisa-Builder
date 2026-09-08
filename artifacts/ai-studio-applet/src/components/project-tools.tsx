import { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Rocket, 
  Github, 
  RefreshCw, 
  Download, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Server,
  Code2,
  FileCode2,
  Loader2,
  Plus,
  Activity,
  Database,
  Sparkles,
  Trash2
} from 'lucide-react';
import { startGitHubOAuth } from '@/lib/github-oauth';
import type { GeneratedApp } from '@workspace/api-client-react';

export default function ProjectTools({
  app,
  projectId,
  walletAddress,
  onSendMessage,
  onNavigateToCode,
  onNavigateToAgent
}: {
  app: GeneratedApp | null;
  projectId: string | null;
  walletAddress?: string;
  onSendMessage: (prompt: string, files?: File[]) => void;
  onNavigateToCode: () => void;
  onNavigateToAgent?: () => void;
}) {
  const [activeTool, setActiveTool] = useState('publishing');

  // Persistence
  const [projectStatus, setProjectStatus] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle');
  
  // GitHub
  const [githubStatus, setGithubStatus] = useState<'idle' | 'loading' | 'connected' | 'disconnected'>('idle');
  const [repoCount, setRepoCount] = useState<number>(0);

  // Secrets
  const [secretsKeys, setSecretsKeys] = useState<string[]>([]);
  const [secretsLoading, setSecretsLoading] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [addingSecret, setAddingSecret] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);

  // Publishing
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const files = useMemo(() => {
    const f = Object.fromEntries((app?.files || []).map(file => [file.name, file.code]));
    if (app?.htmlPreview && !Object.keys(f).some(name => /(^|\/)index\.html$/i.test(name))) {
      f['index.html'] = app.htmlPreview;
    }
    return f;
  }, [app]);

  const filesList = Object.entries(files).map(([name, code]) => ({
    name,
    size: new Blob([code]).size
  })).sort((a, b) => b.size - a.size);

  const totalSize = filesList.reduce((acc, f) => acc + f.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  useEffect(() => {
    if (!projectId || !walletAddress) return;
    
    // Check Persistence
    const checkPersistence = async () => {
      setProjectStatus('loading');
      try {
        const res = await fetch(`/api/projects/${projectId}?walletAddress=${walletAddress}`);
        if (res.ok) {
          const data = await res.json() as { publishedUrl?: string | null };
          setPublishedUrl(data.publishedUrl || null);
          setProjectStatus('saved');
        } else {
          setProjectStatus('error');
        }
      } catch {
        setProjectStatus('error');
      }
    };
    checkPersistence();
    const statusTimer = window.setInterval(checkPersistence, 15_000);

    // Check GitHub
    const checkGithub = async () => {
      setGithubStatus('loading');
      try {
        const statusResponse = await fetch('/api/github/status');
        const status = await statusResponse.json() as { connected?: boolean };
        if (status.connected) {
          const reposResponse = await fetch('/api/github/repos');
          const repos = reposResponse.ok ? await reposResponse.json() as unknown[] : [];
          setRepoCount(repos.length);
          setGithubStatus('connected');
        } else {
          setGithubStatus('disconnected');
        }
      } catch {
        setGithubStatus('disconnected');
      }
    };
    checkGithub();

    // Load Secrets
    const loadSecrets = async () => {
      setSecretsLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/secrets?walletAddress=${walletAddress}`);
        if (res.ok) {
          const data = await res.json();
          setSecretsKeys(data.keys || []);
        }
      } catch {
        // ignore errors
      } finally {
        setSecretsLoading(false);
      }
    };
    loadSecrets();

    return () => window.clearInterval(statusTimer);
  }, [projectId, walletAddress]);

  const handleRefreshStatus = async () => {
    if (!projectId || !walletAddress) return;
    setProjectStatus('loading');
    try {
      const res = await fetch(`/api/projects/${projectId}?walletAddress=${walletAddress}`);
      if (res.ok) {
        const data = await res.json() as { publishedUrl?: string | null };
        setPublishedUrl(data.publishedUrl || null);
      }
      setProjectStatus(res.ok ? 'saved' : 'error');
    } catch {
      setProjectStatus('error');
    }
  };

  const addSecret = async () => {
    if (!projectId || !walletAddress || !newSecretKey.trim() || !newSecretValue) return;
    setAddingSecret(true);
    setSecretError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/secrets`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress, secrets: { [newSecretKey.trim()]: newSecretValue } })
      });
      if (res.ok) {
        setNewSecretKey('');
        setNewSecretValue('');
        // refresh keys
        const keysRes = await fetch(`/api/projects/${projectId}/secrets?walletAddress=${walletAddress}`);
        if (keysRes.ok) {
          const data = await keysRes.json();
          setSecretsKeys(data.keys || []);
        }
      } else {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        setSecretError(data?.error || 'Secret could not be saved.');
      }
    } catch {
      setSecretError('Secret service is unavailable.');
    } finally {
      setAddingSecret(false);
    }
  };

  const deleteSecret = async (key: string) => {
    if (!projectId || !walletAddress) return;
    setSecretError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/secrets/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      const data = await res.json().catch(() => null) as { error?: string; keys?: string[] } | null;
      if (!res.ok) {
        setSecretError(data?.error || 'Secret could not be deleted.');
        return;
      }
      setSecretsKeys(data?.keys || []);
    } catch {
      setSecretError('Secret service is unavailable.');
    }
  };

  const handlePublish = async () => {
    if (!projectId || !walletAddress || Object.keys(files).length === 0) return;
    const publishFiles = app?.htmlPreview
      ? { ...files, 'index.html': app.htmlPreview }
      : files;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress, files: publishFiles })
      });
      if (res.ok) {
        const data = await res.json();
        setPublishedUrl(data.url);
      } else {
        setPublishError('Deployment rejected by server.');
      }
    } catch {
      setPublishError('Network error during deployment.');
    } finally {
      setPublishing(false);
    }
  };

  const downloadProject = () => {
    const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app?.appName || 'project'}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const agentSkills = [
    { title: 'Accessibility Audit', desc: 'Fix semantics, contrast, and keyboard access', prompt: 'Audit this project for accessibility and implement the fixes directly in the source. Cover semantic HTML, labels, focus states, keyboard navigation, and color contrast.' },
    { title: 'Responsive Polish', desc: 'Improve mobile and tablet behavior', prompt: 'Improve this project’s responsive implementation directly in the source, including mobile layout, touch targets, overflow handling, and tablet breakpoints.' },
    { title: 'Performance Pass', desc: 'Reduce unnecessary work and payload', prompt: 'Audit this project for frontend performance and implement safe improvements directly in the source without changing its intended design.' },
    { title: 'Security Review', desc: 'Harden client-side behavior', prompt: 'Review this project for client-side security risks and implement safe fixes directly in the source. Do not add fake security claims or placeholder controls.' }
  ];

  const handleSkill = (prompt: string) => {
    onSendMessage(prompt);
    if (onNavigateToAgent) onNavigateToAgent();
  };

  const tools = [
    { id: 'publishing', label: 'Publishing', icon: Globe },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'storage', label: 'App Storage', icon: Database },
    { id: 'git', label: 'Git & Integrations', icon: Github },
    { id: 'secrets', label: 'Secrets', icon: KeyRound },
    { id: 'skills', label: 'Agent Skills', icon: Sparkles }
  ];

  const getToolDescription = (id: string) => {
    switch (id) {
      case 'publishing': return 'Manage edge deployments and public accessibility.';
      case 'monitoring': return 'View system health and persistence connectivity.';
      case 'storage': return 'Browse and export generated project filesystem.';
      case 'git': return 'Connect to version control and import existing code.';
      case 'secrets': return 'Manage environment variables and secure API keys.';
      case 'skills': return 'Trigger advanced agent capabilities and workflows.';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-full w-full bg-[#030408]">
      {/* Navigation Sidebar */}
      <aside className="w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-[#05070e] flex flex-row md:flex-col overflow-x-auto shrink-0 z-10">
        <div className="p-4 hidden md:block border-b border-white/5 shrink-0">
          <h2 className="text-sm font-semibold text-white">Project Tools</h2>
          <p className="text-[11px] text-neutral-500 mt-1">Workspace Control Surface</p>
        </div>
        <div className="flex md:flex-col p-2 gap-1 min-w-max md:min-w-0">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-left ${
                activeTool === t.id 
                  ? 'bg-[#050BE0]/15 text-white' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <t.icon className={`w-4 h-4 shrink-0 ${activeTool === t.id ? 'text-[#050BE0]' : 'text-neutral-500'}`} />
              <span className="font-medium whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Detail Surface */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#030408]">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Active Tool Header */}
          <div className="pb-4 border-b border-white/10">
            <h3 className="text-xl font-semibold text-white">
              {tools.find(t => t.id === activeTool)?.label}
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5">
              {getToolDescription(activeTool)}
            </p>
          </div>

          {/* Active Tool Content */}
          {activeTool === 'publishing' && (
            <div className="space-y-6">
              <div className="p-5 bg-[#05070e] border border-white/5 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#050BE0]/10 border border-[#050BE0]/20 flex items-center justify-center shrink-0">
                    <Rocket className="w-5 h-5 text-[#050BE0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white mb-1">Production Edge Release</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-5">
                      Publishing creates a secure, global edge deployment of your current project state. The generated index.html bundle and all source assets will be made publicly accessible.
                    </p>
                    
                    {publishedUrl && (
                      <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="text-[11px] text-green-400 font-medium mb-1 uppercase tracking-wider">Successfully Published</div>
                        <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:text-green-300 underline break-all">
                          {publishedUrl}
                        </a>
                      </div>
                    )}

                    {publishError && (
                      <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                        {publishError}
                      </div>
                    )}

                    <button 
                      onClick={handlePublish}
                      disabled={publishing || Object.keys(files).length === 0 || !projectId}
                      className="flex items-center justify-center gap-2 h-9 px-5 bg-[#050BE0] hover:bg-[#151BEF] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                      {publishing ? 'Publishing...' : 'Publish to Edge'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'monitoring' && (
            <div className="space-y-4">
              <div className="p-5 bg-[#05070e] border border-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Server className="w-4 h-4 text-neutral-400" />
                    Persistence API Status
                  </div>
                  <button onClick={handleRefreshStatus} className="p-1.5 rounded-md hover:bg-white/5 text-neutral-500 hover:text-white transition-colors" title="Refresh status">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-black/30 border border-white/5 rounded-lg">
                  <div className="shrink-0">
                    {projectStatus === 'loading' && <Loader2 className="w-6 h-6 animate-spin text-[#050BE0]" />}
                    {projectStatus === 'saved' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                    {projectStatus === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
                    {projectStatus === 'idle' && <Activity className="w-6 h-6 text-neutral-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {projectStatus === 'loading' ? 'Checking persistence...' :
                       projectStatus === 'saved' ? 'Project Synced' :
                       projectStatus === 'error' ? 'Sync Error' : 'Idle'}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {projectStatus === 'saved' ? 'All project data is safely persisted to the backend.' :
                       projectStatus === 'error' ? 'Could not reach the persistence server.' :
                       'Polling project persistence status.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'storage' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#05070e] border border-white/5 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-white">Filesystem Overview</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {filesList.length} tracked files • {formatSize(totalSize)} total size
                  </div>
                </div>
                <button 
                  onClick={downloadProject}
                  disabled={Object.keys(files).length === 0}
                  className="flex items-center justify-center gap-2 h-9 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
              </div>

              <div className="bg-[#05070e] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                <div className="p-3 border-b border-white/5 bg-black/20 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  Generated Source Files
                </div>
                <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-white/5">
                  {filesList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500">
                      No files generated
                    </div>
                  ) : (
                    filesList.map(f => (
                      <div key={f.name} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3 text-neutral-300 min-w-0 pr-4">
                          <FileCode2 className="w-4 h-4 text-neutral-500 shrink-0" />
                          <span className="text-sm truncate">{f.name}</span>
                        </div>
                        <span className="text-xs text-neutral-500 tabular-nums shrink-0">{formatSize(f.size)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'git' && (
            <div className="space-y-4">
              <div className="p-5 bg-[#05070e] border border-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-sm font-medium text-white">GitHub Connection</h4>
                  <div className="px-2.5 py-1 rounded-full bg-black/30 border border-white/10 text-[10px] font-medium uppercase tracking-wider">
                    {githubStatus === 'loading' ? <span className="text-neutral-500">Checking...</span> : 
                     githubStatus === 'connected' ? <span className="text-green-400">Connected</span> : 
                     <span className="text-neutral-500">Disconnected</span>}
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-black/20 border border-white/5 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white mb-1">
                      GitHub API
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-5">
                      Import source code directly from your connected GitHub account into the Lissa browser IDE. 
                      {githubStatus === 'connected' && ` You have access to ${repoCount} repositories.`}
                    </p>
                    
                    <button 
                      onClick={githubStatus === 'connected' ? onNavigateToCode : () => void startGitHubOAuth()}
                      className="flex items-center justify-center gap-2 h-9 px-4 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors inline-flex"
                    >
                      {githubStatus === 'connected' ? <Code2 className="w-4 h-4" /> : <Github className="w-4 h-4" />}
                      {githubStatus === 'connected' ? 'Open Code Surface' : 'Connect GitHub'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'secrets' && (
            <div className="space-y-6">
              <div className="p-5 bg-[#05070e] border border-white/5 rounded-xl">
                <h4 className="text-sm font-medium text-white mb-1">Project Secrets</h4>
                <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                  Store API keys and environment variables securely. These values are encrypted and never exposed to the frontend or generated files.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    value={newSecretKey}
                    onChange={e => setNewSecretKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                    placeholder="KEY_NAME"
                    className="flex-1 sm:max-w-[200px] h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#050BE0]"
                  />
                  <input 
                    type="password"
                    value={newSecretValue}
                    onChange={e => setNewSecretValue(e.target.value)}
                    placeholder="Secret Value"
                    className="flex-1 h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#050BE0]"
                  />
                  <button 
                    onClick={addSecret}
                    disabled={addingSecret || !newSecretKey || !newSecretValue || !projectId}
                    className="h-10 px-5 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                  >
                    {addingSecret ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </button>
                </div>
                {secretError && <p className="mt-3 text-xs text-red-400">{secretError}</p>}
              </div>

              <div className="bg-[#05070e] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    Active Secrets
                  </span>
                  {secretsLoading && <Loader2 className="w-3.5 h-3.5 text-neutral-500 animate-spin" />}
                </div>
                
                <div className="p-4 max-h-[300px] overflow-y-auto">
                  {secretsKeys.length === 0 ? (
                    <div className="text-center text-xs text-neutral-500 py-4">
                      {secretsLoading ? 'Loading secrets...' : 'No secrets configured for this project.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {secretsKeys.map(k => (
                        <div key={k} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/30 border border-white/5">
                          <div className="w-8 h-8 rounded-md bg-[#050BE0]/10 flex items-center justify-center shrink-0">
                            <KeyRound className="w-4 h-4 text-[#050BE0]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{k}</div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">Encrypted</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void deleteSecret(k)}
                            className="rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                            title={`Delete ${k}`}
                            aria-label={`Delete ${k}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'skills' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {agentSkills.map(skill => (
                <button
                  key={skill.title}
                  onClick={() => handleSkill(skill.prompt)}
                  className="flex flex-col items-start p-5 bg-[#05070e] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#050BE0]/20 group-hover:text-[#050BE0] text-neutral-400 transition-colors">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white mb-2">
                    {skill.title}
                  </div>
                  <div className="text-xs text-neutral-400 leading-relaxed">
                    {skill.desc}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}