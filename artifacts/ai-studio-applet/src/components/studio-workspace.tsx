import { useState, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  ArrowLeft,
  Send,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Wallet,
  Network,
  Plus,
  X,
  Paperclip,
  Database,
  Bot,
  Layout,
  Code2,
  Rocket,
  Wrench,
  Cpu,
  FileText,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Play,
  Terminal,
  ChevronDown,
  ChevronRight,
   Check,
   Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { robinhoodChain } from '@/lib/web3';
import type { Message } from '@/pages/lissa-app';
import type { GeneratedApp, AgentEvent } from '@workspace/api-client-react';
import BrowserIde from './browser-ide';
import ProjectTools from './project-tools';
import ProjectData from './project-data';
import ProjectDeployments from './project-deployments';
import { useWebcontainerRuntime } from '@/lib/webcontainer-runtime';

const TABS = [
  { id: 'agent', icon: Bot, label: 'Agent' },
  { id: 'preview', icon: Layout, label: 'Preview' },
  { id: 'code', icon: Code2, label: 'Code' },
  { id: 'data', icon: Database, label: 'Data' },
  { id: 'deployments', icon: Rocket, label: 'Deployments' },
  { id: 'tools', icon: Wrench, label: 'Tools' }
] as const;

function AgentPlan({
  steps,
  events,
  isSuccessful,
  isFailed,
}: {
  steps: { id: string, title: string }[];
  events: AgentEvent[];
  isSuccessful: boolean;
  isFailed: boolean;
}) {
  const activities = events.filter(e => e.type === 'activity');
  const latestActivityWithStep = [...activities].reverse().find(e => e.metadata?.stepId);
  const currentStepId = latestActivityWithStep?.metadata?.stepId as string | undefined;

  const currentStepIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="flex flex-col gap-2 mb-1">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-1 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" /> Working Plan
      </div>
      <div className="flex flex-col gap-3 relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10 z-0" />
        {steps.map((step, idx) => {
          let status: 'waiting' | 'active' | 'completed' | 'failed' = 'waiting';
          if (isSuccessful) status = 'completed';
          else if (currentStepIndex > idx) status = 'completed';
          else if (isFailed && currentStepIndex === idx) status = 'failed';
          else if (currentStepIndex === idx) status = 'active';

          return (
            <div key={step.id} className="flex items-start gap-3 relative z-10">
              <div className={cn(
                "w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                status === 'completed' ? "bg-[#050BE0] text-white" :
                status === 'failed' ? "bg-red-500/10 border-[1.5px] border-red-400 text-red-300" :
                status === 'active' ? "bg-[#0a0d16] border-[1.5px] border-[#050BE0]" :
                "bg-[#0a0d16] border border-white/20"
              )}>
                {status === 'completed' ? <Check className="w-2.5 h-2.5" /> :
                 status === 'failed' ? <X className="w-2.5 h-2.5" /> :
                 status === 'active' ? <div className="w-1.5 h-1.5 bg-[#050BE0] rounded-full" /> : null}
              </div>
              <span className={cn(
                "text-[13px] leading-tight",
                status === 'completed' ? "text-neutral-400" :
                status === 'failed' ? "text-red-300 font-medium" :
                status === 'active' ? "text-white font-medium" :
                "text-neutral-500"
              )}>{step.title}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActivityLog({ events, isLoading }: { events: AgentEvent[], isLoading: boolean }) {
  const [expanded, setExpanded] = useState(isLoading);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [events.length, expanded]);

  return (
    <div className="flex flex-col bg-[#05070e]/80 border border-white/5 rounded-lg overflow-hidden mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3 py-2.5 w-full hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">Activity History</span>
          <span className="text-[10px] text-neutral-600 bg-white/5 px-1.5 py-0.5 rounded-full ml-1 tabular-nums">{events.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-[9px] uppercase tracking-wider text-[#050BE0] font-bold bg-[#050BE0]/10 px-1.5 py-0.5 rounded border border-[#050BE0]/20 animate-pulse">Running</span>
          ) : (
            <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Done</span>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
        </div>
      </button>

      {expanded && (
        <div className="max-h-[240px] overflow-y-auto px-3 pb-3 pt-1 space-y-2.5 font-mono scrollbar-thin scrollbar-thumb-white/10">
          {events.map((e) => {
            const time = new Date(e.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            let icon = null;
            let color = "text-neutral-400";

            if (e.type === 'error') { color = "text-red-400"; icon = <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />; }
            else if (e.type === 'complete') { color = "text-green-400"; icon = <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />; }
            else if (e.type === 'plan') { color = "text-[#050BE0]"; icon = <Circle className="w-3 h-3 text-[#050BE0] shrink-0 mt-[3px]" />; }
            else if (e.type === 'message') { color = "text-neutral-200"; icon = <Play className="w-3 h-3 text-neutral-500 shrink-0 mt-[3px]" />; }
            else { icon = <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0 mt-1.5 mx-1" />; }

            return (
              <div key={e.id} className="flex gap-2.5 items-start text-[11px] leading-relaxed">
                <span className="text-neutral-600 shrink-0 tabular-nums">[{time}]</span>
                {icon}
                <div className={cn("flex flex-col gap-0.5", color)}>
                  <span className={cn(e.type === 'activity' ? "text-neutral-300" : "font-semibold")}>{e.title}</span>
                  {e.detail && <span className="text-neutral-500 break-words">{e.detail}</span>}
                </div>
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  )
}

export default function StudioWorkspace({
  messages,
  onSendMessage,
  generatedApp,
  isGenerating,
  isStopping,
  stopError,
  onStop,
  walletProps,
  onExit,
  projectId,
}: {
  messages: Message[];
  onSendMessage: (prompt: string, files?: File[]) => void;
  generatedApp: GeneratedApp | null;
  isGenerating: boolean;
  isStopping: boolean;
  stopError: string | null;
  onStop: () => void;
  walletProps: any;
  onExit: () => void;
  projectId: string | null;
}) {
  const runtime = useWebcontainerRuntime();
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'agent' | 'preview' | 'code' | 'data' | 'deployments' | 'tools'>('agent');
  const [viewportSize, setViewportSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { address, isConnected, chainId, switchChain, isSwitching, open } = walletProps;
  const isCorrectChain = chainId === robinhoodChain.id;
  const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  const refreshPreview = () => setIframeKey(k => k + 1);

  const renderPreviewSurface = () => (
    <div className="flex flex-col h-full w-full bg-[#030408]">
       <div className="h-10 shrink-0 border-b border-white/5 bg-[#05070e] flex items-center justify-between px-3 relative z-20 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded p-0.5">
               {[
                 { id: 'desktop', icon: Monitor, label: 'Desktop' },
                 { id: 'tablet', icon: Tablet, label: 'Tablet' },
                 { id: 'mobile', icon: Smartphone, label: 'Mobile' }
               ].map(size => (
                  <button
                    key={size.id}
                    onClick={() => setViewportSize(size.id as any)}
                    className={cn("p-1.5 rounded transition-all group relative", viewportSize === size.id ? "bg-white/15 text-white" : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5")}
                    aria-label={size.label}
                  >
                    <size.icon className="w-3.5 h-3.5" />
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-[#1a1d27] border border-white/10 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                      {size.label}
                    </div>
                  </button>
               ))}
             </div>
             <div className="w-px h-3 bg-white/10" />
             <button
               onClick={refreshPreview}
               className="p-1.5 rounded text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all group relative"
               aria-label="Refresh Preview"
             >
               <RefreshCw className="w-3.5 h-3.5" />
               <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-[#1a1d27] border border-white/10 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                 Refresh
               </div>
             </button>
             <button
               onClick={() => {
                  if (runtime.previewUrl) window.open(runtime.previewUrl, '_blank', 'noopener,noreferrer');
               }}
                className="p-1.5 rounded text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all group relative disabled:cursor-not-allowed disabled:opacity-35"
               aria-label="Open in new tab"
                disabled={!runtime.previewUrl}
             >
               <ExternalLink className="w-3.5 h-3.5" />
               <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-[#1a1d27] border border-white/10 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                  {runtime.previewUrl ? 'Open Tab' : 'Start runtime to open'}
               </div>
             </button>
          </div>

          {generatedApp && (
            <div className="flex items-center gap-3 text-[11px]">
               <span className="text-neutral-500 flex items-center gap-1.5"><FileText className="w-3 h-3"/> {generatedApp.appName || generatedApp.title}</span>
               <span className="text-neutral-600">•</span>
               <span className="text-neutral-500">{generatedApp.category || 'App'}</span>
                <span className={cn('rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wide', runtime.phase === 'ready' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-neutral-500')} data-testid="status-runtime">{runtime.phase}{runtime.qa ? ` · ${runtime.qa}` : ''}</span>
            </div>
          )}
       </div>

       <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden z-0">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          {generatedApp ? (
            <div className={cn(
              "bg-white transition-all duration-300 ease-in-out relative z-10 flex flex-col",
              viewportSize === 'desktop' ? "w-full h-full rounded-md shadow-2xl border border-white/10" : "",
              viewportSize === 'tablet' ? "w-[768px] h-[1024px] max-w-full max-h-full rounded-xl shadow-2xl border-4 border-[#1a1d27]" : "",
              viewportSize === 'mobile' ? "w-[375px] h-[812px] max-w-full max-h-full rounded-[2rem] shadow-2xl border-[8px] border-[#1a1d27]" : ""
            )}>
              <iframe
                key={iframeKey}
                title="App Preview"
                src={runtime.previewUrl || undefined}
                srcDoc={runtime.previewUrl ? undefined : generatedApp.htmlPreview}
                sandbox={runtime.previewUrl
                  ? "allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                  : "allow-scripts allow-forms allow-modals allow-popups"}
                className={cn("w-full flex-1 bg-white", viewportSize === 'mobile' ? "rounded-[1.5rem]" : viewportSize === 'tablet' ? "rounded-lg" : "rounded-sm")}
              />
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center text-center gap-4 z-10">
               <div className="w-14 h-14 rounded-2xl bg-[#0a0c14] border border-white/10 flex items-center justify-center p-1 shadow-2xl">
                 <img src="/brand/lissa-logo.jpg" alt="" className="w-full h-full object-cover rounded-[10px] opacity-40 grayscale" />
               </div>
               <div className="flex flex-col gap-1.5 text-neutral-500 text-[13px]">
                 <span className="font-medium text-white/80">No preview available</span>
                 <span className="text-[11px] text-neutral-600">The application will appear here once built.</span>
               </div>
            </div>
          )}
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#02040a] text-neutral-100 overflow-hidden font-sans selection:bg-[#050BE0]/30">
      {/* Studio Header */}
      <header className="h-12 flex items-center justify-between px-3 border-b border-white/5 bg-[#05070e] shrink-0 relative z-20 shadow-sm">
        <div className="flex items-center gap-3 w-1/3">
          <button
            onClick={onExit}
            className="p-1.5 rounded-md hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
            title="Return to Home"
            data-testid="button-exit-studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-[13px] font-medium text-white/90 truncate" data-testid="text-project-title">
             {generatedApp ? (generatedApp.appName || generatedApp.title) : 'Building Project...'}
          </span>
        </div>

        <div className="flex items-center h-full justify-center flex-1 gap-2">
          {TABS.map(tab => (
            <div key={tab.id} className="group relative flex items-center justify-center h-full">
              <button
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "h-full px-3.5 flex items-center justify-center border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[#050BE0] text-[#050BE0]"
                    : "border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]"
                )}
                aria-label={tab.label}
              >
                <tab.icon className="w-[18px] h-[18px]" />
              </button>
              <div className="absolute top-full mt-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-[#1a1d27] border border-white/10 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                {tab.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 w-1/3 justify-end">
          {isConnected ? (
            <div className="flex items-center gap-2">
              {!isCorrectChain && (
                <button
                  onClick={() => switchChain({ chainId: robinhoodChain.id })}
                  disabled={isSwitching}
                  className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border border-amber-400/30 bg-amber-500/10 text-amber-300 text-[11px] font-medium disabled:opacity-60"
                >
                  <Network className="w-3 h-3" />
                  Switch
                </button>
              )}
              <button
                onClick={() => open({ view: 'Account' })}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-white/5 text-white text-[11px] font-medium hover:bg-white/10 transition-colors"
              >
                <Wallet className="w-3 h-3 text-[#050BE0]" />
                {shortAddress}
              </button>
            </div>
          ) : (
            <button
              onClick={() => open({ view: 'Connect' })}
              className="px-3 py-1 bg-[#050BE0] text-white text-[11px] font-medium rounded hover:bg-[#151BEF] transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden relative bg-[#02040a]">
        {activeTab === 'agent' && (
          <PanelGroup direction="horizontal">
            {/* Left Chat Panel */}
            <Panel defaultSize={25} minSize={20} maxSize={40} className="flex flex-col bg-[#05070e] border-r border-white/5 relative z-10">
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {generatedApp && (
                  <div className="px-4 py-3 bg-[#080a11] border border-white/10 rounded-xl flex flex-col gap-2 shrink-0 shadow-sm mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#050BE0]/5 blur-3xl pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                       <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-[#050BE0]"/> Active Context</span>
                       <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{generatedApp.files.length} Files</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed relative z-10">
                       {generatedApp.description}
                    </div>
                    {isGenerating && (
                       <div className="flex items-center gap-1.5 mt-1 relative z-10">
                         <span className="flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[#050BE0]/20 border border-[#050BE0]/40 text-[#050BE0]">
                           <div className="w-1 h-1 bg-[#050BE0] rounded-full" />
                         </span>
                         <span className="text-[10px] text-[#050BE0] font-bold uppercase tracking-wider animate-pulse">Agent Active</span>
                       </div>
                    )}
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>

                    {m.role === 'user' ? (
                      <div className="flex flex-col items-end max-w-[92%]">
                        <div className="px-4 py-3 text-[13px] leading-relaxed max-w-full break-words whitespace-pre-wrap shadow-sm bg-[#050BE0] text-white rounded-2xl rounded-tr-sm">
                          {m.attachments?.length ? (
                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {m.attachments.map((file, index) => (
                                <span key={`${file.name}-${index}`} className="flex items-center gap-1 rounded-md bg-black/20 px-2 py-1 text-[10px]">
                                  <Paperclip className="h-3 w-3" />{file.name}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start max-w-[92%] w-full">
                        <div className="flex items-center gap-2 mb-1.5 ml-1">
                          <div className="w-5 h-5 rounded bg-[#0a0c14] overflow-hidden border border-white/10 p-[1px]">
                            <img src="/brand/lissa-logo.jpg" alt="Lissa" className="w-full h-full object-cover rounded-[2px]" />
                          </div>
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Lissa</span>
                        </div>

                        <div className={cn(
                          "w-full px-4 py-3 shadow-sm bg-[#0a0d16] text-neutral-200 rounded-2xl rounded-tl-sm border border-white/5",
                          m.isError ? "border-red-500/30 bg-red-500/10 text-red-200" : ""
                        )}>
                          {(() => {
                            const planEvent = m.agentEvents?.find(e => e.type === 'plan');
                            const steps = (planEvent?.metadata?.steps as {id: string, title: string}[]) || [];
                             const responseEvents = m.agentEvents?.filter(e => e.type === 'message') || [];
                             const isSuccessful = m.agentEvents?.some(e => e.type === 'complete') || false;
                             const isFailed = m.agentEvents?.some(e => e.type === 'error') || false;
                             const isTerminal = isSuccessful || isFailed || (!m.isLoading && m.agentEvents && m.agentEvents.length > 0);
                            const hasEvents = m.agentEvents && m.agentEvents.length > 0;

                            return (
                              <div className="flex flex-col gap-3 w-full">
                                 {responseEvents.map(event => (
                                   <div key={event.id} className="space-y-1.5 text-[13px] leading-relaxed text-neutral-200">
                                     <p>{event.title}</p>
                                     {event.detail && (
                                       <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-neutral-400">{event.detail}</p>
                                     )}
                                   </div>
                                 ))}

                                {steps.length > 0 && (
                                   <AgentPlan
                                     steps={steps}
                                     events={m.agentEvents || []}
                                     isSuccessful={isSuccessful}
                                     isFailed={isFailed}
                                   />
                                )}

                                {m.text && (
                                  <div className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                                    {m.text}
                                  </div>
                                )}

                                {hasEvents && (
                                   <ActivityLog events={m.agentEvents!} isLoading={!!m.isLoading && !isTerminal} />
                                )}

                                {m.isLoading && !hasEvents && !m.text && (
                                  <span className="text-[13px] text-neutral-500 animate-pulse">Connecting to agent stream...</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-[#05070e] border-t border-white/5 shrink-0 z-20">
                <form
                  onSubmit={(e) => { e.preventDefault(); if ((input.trim() || files.length) && !isGenerating) { onSendMessage(input.trim() || 'Use the attached files as reference.', files); setInput(''); setFiles([]); } }}
                  className="relative flex items-end bg-[#080a11] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#050BE0]/40 transition-colors shadow-inner"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={2000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if ((input.trim() || files.length) && !isGenerating) {
                          onSendMessage(input.trim() || 'Use the attached files as reference.', files);
                          setInput('');
                          setFiles([]);
                        }
                      }
                    }}
                    placeholder={isGenerating ? "Lissa is building..." : "Instruct Lissa to modify the app..."}
                    disabled={isGenerating}
                    className="w-full max-h-40 min-h-[52px] bg-transparent resize-none py-3.5 pl-4 pr-12 outline-none text-[13px] text-neutral-200 placeholder:text-neutral-600 disabled:opacity-50"
                    rows={1}
                    data-testid="input-chat"
                  />
                  <button
                    type="submit"
                    disabled={(!input.trim() && !files.length) || isGenerating}
                    className="absolute right-2 bottom-2 p-2 rounded-lg bg-[#050BE0] text-white disabled:bg-white/5 disabled:text-neutral-600 transition-colors flex items-center justify-center h-9 w-9 shadow-sm"
                    data-testid="button-send-chat"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                {files.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{files.map((file, index) => <span key={`${file.name}-${index}`} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-300"><span className="max-w-32 truncate">{file.name}</span><button type="button" onClick={() => setFiles(current => current.filter((_, i) => i !== index))}><X className="h-3 w-3" /></button></span>)}</div>}
                 {stopError && (
                   <p className="mt-2 text-[11px] text-red-300" role="alert">{stopError}</p>
                 )}
                 <div className="mt-2.5 flex items-center justify-between px-1">
                  <div><input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.txt,.md,.json,.csv,.html,.css,.js,.jsx,.ts,.tsx" className="hidden" onChange={(event) => { const next = Array.from(event.target.files || []).filter(file => file.size <= 10_000_000); setFiles(current => [...current, ...next].slice(0, 5)); event.target.value = ''; }} /><button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-neutral-400 hover:border-[#050BE0]/40 hover:text-white transition-colors" title="Upload files"><Plus className="h-4 w-4" /></button></div>
                   {isGenerating ? (
                     <button
                       type="button"
                       onClick={onStop}
                       disabled={isStopping}
                       className="flex h-7 items-center gap-1.5 rounded-md border border-red-400/30 bg-red-500/10 px-2.5 text-[11px] font-medium text-red-200 transition-colors hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
                       data-testid="button-stop-build"
                     >
                       <Square className="h-3 w-3 fill-current" />
                       {isStopping ? 'Stopping…' : 'Stop'}
                     </button>
                   ) : (
                     <span className="text-[10px] text-neutral-600 font-medium">Lissa Engine v1</span>
                   )}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-[1px] bg-white/5 hover:bg-[#050BE0]/50 active:bg-[#050BE0] transition-colors cursor-col-resize relative z-20 group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-white/20 group-hover:bg-[#050BE0] group-active:bg-[#050BE0] transition-colors" />
            </PanelResizeHandle>

            {/* Right Preview Panel */}
            <Panel className="flex flex-col bg-[#030408] relative z-0">
               {renderPreviewSurface()}
            </Panel>
          </PanelGroup>
        )}

        {activeTab === 'preview' && (
          <div className="w-full h-full relative">
              {renderPreviewSurface()}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="w-full h-full flex flex-col bg-[#030408]">
             <BrowserIde app={generatedApp} projectId={projectId} walletAddress={address} />
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="w-full h-full flex flex-col bg-[#030408] overflow-y-auto">
            <ProjectTools
              app={generatedApp}
              projectId={projectId}
              walletAddress={address}
              onSendMessage={onSendMessage}
              onNavigateToCode={() => setActiveTab('code')}
              onNavigateToAgent={() => setActiveTab('agent')}
            />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="w-full h-full flex flex-col bg-[#030408]">
             <ProjectData projectId={projectId} walletAddress={address} />
          </div>
        )}

        {activeTab === 'deployments' && (
          <div className="w-full h-full flex flex-col bg-[#030408]">
             <ProjectDeployments projectId={projectId} walletAddress={address} app={generatedApp} />
          </div>
        )}
      </div>
    </div>
  );
}
