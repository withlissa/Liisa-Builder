import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Code2, Eye, FileCode2, Github, KeyRound, Play, Rocket, Save, Square, TerminalSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeneratedApp } from '@workspace/api-client-react';
import '@xterm/xterm/css/xterm.css';
import { useWebcontainerRuntime, webcontainerRuntime } from '@/lib/webcontainer-runtime';
import { requireGitHubConnection } from '@/lib/github-oauth';

function languageFor(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  return ({ ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', css: 'css', html: 'html', json: 'json', md: 'markdown' } as Record<string, string>)[ext || ''] || 'plaintext';
}

export default function BrowserIde({ app, projectId, walletAddress }: { app: GeneratedApp | null; projectId: string | null; walletAddress?: string }) {
  const initialFiles = useMemo(() => {
    const files = Object.fromEntries((app?.files || []).map(file => [file.name, file.code]));
    if (app?.htmlPreview && !Object.keys(files).some(name => /(^|\/)index\.html$/i.test(name))) files['index.html'] = app.htmlPreview;
    return files;
  }, [app]);
  const previewDocument = useMemo(() => {
    if (!app?.htmlPreview) {
      return '<!doctype html><html><head><style>html,body{margin:0;min-height:100%;background:#030408;color:#fff}</style></head><body></body></html>';
    }
    return app.htmlPreview.replace(/<head(\s[^>]*)?>/i, match => `${match}<style>html,body{min-height:100%;background:#030408}</style>`);
  }, [app?.htmlPreview]);
  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const [activeFile, setActiveFile] = useState(Object.keys(initialFiles)[0] || 'index.html');
  const [mode, setMode] = useState<'preview' | 'code'>('preview');
  const runtime = useWebcontainerRuntime();
  const [repos, setRepos] = useState<Array<{ name: string; fullName: string; description?: string }>>([]);
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const terminalHost = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);

  useEffect(() => {
    setFiles(initialFiles);
    setActiveFile(Object.keys(initialFiles)[0] || 'index.html');
  }, [initialFiles]);

  useEffect(() => {
    if (!terminalHost.current || terminal.current) return;
    const instance = new Terminal({ convertEol: true, theme: { background: '#05070e', foreground: '#d4d4d8', cursor: '#050BE0' }, fontSize: 12 });
    const fit = new FitAddon();
    instance.loadAddon(fit);
    instance.open(terminalHost.current);
    fit.fit();
    instance.writeln('Lissa browser terminal ready.');
    instance.onData(() => { instance.writeln('\r\nInteractive shell is not available in the managed runtime.'); });
    terminal.current = instance;
    const observer = new ResizeObserver(() => fit.fit());
    observer.observe(terminalHost.current);
    return () => { observer.disconnect(); instance.dispose(); terminal.current = null; };
  }, []);

  useEffect(() => {
    if (!terminal.current) return;
    terminal.current.clear();
    terminal.current.write(runtime.output);
  }, [runtime.output]);

  const run = async () => {
    if (!Object.keys(files).length) return;
    await webcontainerRuntime.execute({ files, htmlPreview: app?.htmlPreview, revision: Date.now() });
    setMode('preview');
  };
  const runtimeActive = ['booting', 'installing', 'starting', 'qa'].includes(runtime.phase);

  const openGithub = async () => {
    setGithubOpen(true);
    setGithubLoading(true);
    try {
      const response = await fetch('/api/github/repos');
      if (await requireGitHubConnection(response)) return;
      if (!response.ok) throw new Error();
      setRepos(await response.json());
    } finally {
      setGithubLoading(false);
    }
  };

  const importRepo = async (fullName: string) => {
    setGithubLoading(true);
    try {
      const response = await fetch(`/api/github/import/${fullName}`);
      if (await requireGitHubConnection(response)) return;
      if (!response.ok) throw new Error();
      const data = await response.json() as { files: Record<string, string> };
      setFiles(data.files);
      setActiveFile(Object.keys(data.files)[0] || 'index.html');
      setGithubOpen(false);
      setMode('code');
      terminal.current?.writeln(`\r\nImported ${Object.keys(data.files).length} files from ${fullName}`);
    } finally {
      setGithubLoading(false);
    }
  };

  const saveProject = async () => {
    if (!projectId || !walletAddress) return;
    const persistedFiles = app?.htmlPreview ? { ...files, '__lissa_preview.html': app.htmlPreview } : files;
    const response = await fetch(`/api/projects/${projectId}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ walletAddress, title: app?.appName || app?.title || 'Lissa project', files: persistedFiles }) });
  };

  const saveSecret = async () => {
    if (!projectId || !walletAddress || !secretKey.trim() || !secretValue) return;
    await saveProject();
    const response = await fetch(`/api/projects/${projectId}/secrets`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ walletAddress, secrets: { [secretKey.trim()]: secretValue } }) });
    setSecretKey(''); setSecretValue(''); setSecretOpen(false);
  };

  const publishProject = async () => {
    if (!projectId || !walletAddress) return;
    await saveProject();
    const response = await fetch(`/api/projects/${projectId}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ walletAddress, files }) });
    if (!response.ok) return;
    const data = await response.json() as { url: string };
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };

  const isCanvasLoading = !app;

  const TooltipButton = ({ icon: Icon, label, onClick, disabled, primary }: any) => (
    <div className="group relative flex items-center justify-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          primary
            ? "bg-[#050BE0] text-white hover:bg-[#151BEF]"
            : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
        )}
        aria-label={label}
      >
        <Icon className="h-4 w-4" />
      </button>
      <div className="absolute top-full mt-2 right-0 hidden group-hover:block bg-[#1a1d27] border border-white/10 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#030408]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-[#05070e] px-4 shadow-sm z-20">
        <div className="flex h-full gap-2 items-center">
          <div className="group relative flex items-center justify-center">
            <button onClick={() => setMode('preview')} className={cn('p-1.5 rounded-md transition-all', mode === 'preview' ? 'bg-[#050BE0]/15 text-[#050BE0]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5')} aria-label="Preview">
              <Eye className="h-4 w-4" />
            </button>
            <div className="absolute top-full mt-2 left-0 hidden group-hover:block bg-[#1a1d27] border border-white/10 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">Preview</div>
          </div>
          <div className="group relative flex items-center justify-center">
            <button onClick={() => setMode('code')} className={cn('p-1.5 rounded-md transition-all', mode === 'code' ? 'bg-[#050BE0]/15 text-[#050BE0]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5')} aria-label="Code">
              <Code2 className="h-4 w-4" />
            </button>
            <div className="absolute top-full mt-2 left-0 hidden group-hover:block bg-[#1a1d27] border border-white/10 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">Code</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TooltipButton icon={Github} label="Import from GitHub" onClick={openGithub} />
          <TooltipButton icon={Save} label="Save Project" onClick={saveProject} disabled={!projectId || !walletAddress} />
          <TooltipButton icon={KeyRound} label="Project Secrets" onClick={() => setSecretOpen(true)} disabled={!projectId || !walletAddress} />
          <div className="w-px h-4 bg-white/10 mx-1" />
          <TooltipButton icon={Rocket} label="Publish" onClick={publishProject} disabled={!projectId || !walletAddress || !app} primary />
          <TooltipButton icon={Play} label="Run WebContainer" onClick={run} disabled={!app || runtimeActive} primary />
          {runtimeActive && <TooltipButton icon={Square} label="Stop Runtime" onClick={() => void webcontainerRuntime.stop()} />}
        </div>
      </div>
      {githubOpen && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
        <div className="max-h-[70vh] w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#080a11] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 p-4"><div><h3 className="font-semibold text-white">Import from GitHub</h3><p className="mt-1 text-xs text-neutral-500">Choose a repository from your connected account.</p></div><button onClick={() => setGithubOpen(false)}><X className="h-4 w-4 text-neutral-400" /></button></div>
          <div className="max-h-[55vh] overflow-y-auto p-3">{githubLoading ? <div className="p-8 text-center text-sm text-neutral-500">Loading repositories…</div> : repos.map(repo => <button key={repo.fullName} onClick={() => importRepo(repo.fullName)} className="block w-full rounded-xl p-3 text-left hover:bg-white/5"><div className="text-sm font-medium text-white">{repo.fullName}</div><div className="mt-1 truncate text-xs text-neutral-500">{repo.description || 'No description'}</div></button>)}</div>
        </div>
      </div>}
      {secretOpen && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#080a11] p-5 shadow-2xl">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-white">Project secrets</h3><p className="mt-1 text-xs text-neutral-500">Encrypted server-side and never written into source files.</p></div><button onClick={() => setSecretOpen(false)}><X className="h-4 w-4 text-neutral-400" /></button></div>
          <label className="mb-2 block text-xs text-neutral-400">Key</label><input value={secretKey} onChange={event => setSecretKey(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} placeholder="API_KEY" className="mb-4 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#050BE0]" />
          <label className="mb-2 block text-xs text-neutral-400">Secret value</label><input type="password" value={secretValue} onChange={event => setSecretValue(event.target.value)} className="mb-5 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#050BE0]" />
          <button onClick={saveSecret} disabled={!secretKey || !secretValue} className="h-10 w-full rounded-lg bg-[#050BE0] text-sm font-semibold text-white disabled:opacity-40">Save secret</button>
        </div>
      </div>}
      <div className="min-h-0 flex-1">
        {mode === 'preview' ? (
          <div className="relative h-full w-full overflow-hidden bg-[#030408] p-3">
            <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:28px_28px]" />
            {isCanvasLoading ? (
              <div className="relative z-10 flex h-full w-full items-center justify-center rounded-lg border border-white/10 bg-[#030408]">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 animate-spin rounded-[18px] border border-[#050BE0]/20 border-r-[#050BE0] border-t-[#050BE0]" style={{ animationDuration: '1.8s' }} />
                  <div className="absolute inset-2 animate-spin rounded-[14px] border border-white/10 border-b-white/50" style={{ animationDirection: 'reverse', animationDuration: '2.8s' }} />
                  <img src="/brand/lissa-logo.jpg" alt="" className="relative h-10 w-10 rounded-[10px] border border-white/10 object-cover shadow-[0_0_24px_rgba(5,11,224,0.35)]" />
                </div>
                <span className="sr-only">Lissa is building the preview</span>
              </div>
            ) : (
              <iframe title="Lissa dev preview" src={runtime.previewUrl || undefined} srcDoc={runtime.previewUrl ? undefined : previewDocument} sandbox={runtime.previewUrl ? "allow-scripts allow-forms allow-modals allow-popups allow-same-origin" : "allow-scripts allow-forms allow-modals allow-popups"} className="relative z-10 h-full w-full rounded-lg border border-white/10 bg-[#030408]" style={{ colorScheme: 'dark' }} />
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-0">
            <aside className="w-56 shrink-0 flex flex-col border-r border-white/5 bg-[#05070e]">
              <div className="px-3 flex items-center h-9 border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Explorer</div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {Object.keys(files).sort().map(name => {
                  const parts = name.split('/');
                  const depth = parts.length - 1;
                  const baseName = parts.pop();
                  return (
                    <button
                      key={name}
                      onClick={() => setActiveFile(name)}
                      style={{ paddingLeft: `${depth * 12 + 8}px` }}
                      className={cn('flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors', activeFile === name ? 'bg-[#050BE0]/15 text-white' : 'text-neutral-400 hover:bg-white/5')}
                    >
                      <FileCode2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{baseName}</span>
                    </button>
                  );
                })}
              </div>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="min-h-0 flex-[3]">
                <Editor theme="vs-dark" path={activeFile} language={languageFor(activeFile)} value={files[activeFile] || ''} onChange={value => setFiles(current => ({ ...current, [activeFile]: value || '' }))} options={{ minimap: { enabled: true }, fontSize: 13, automaticLayout: true, padding: { top: 14 } }} />
              </div>
              <div className="flex min-h-[160px] flex-col border-t border-white/10 bg-[#05070e]">
                <div className="flex h-9 items-center justify-between border-b border-white/5 px-3">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    <TerminalSquare className="h-3.5 w-3.5" />
                    Terminal
                  </div>
                </div>
                <div ref={terminalHost} className="min-h-0 flex-1 p-2 bg-[#02040a]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="h-7 shrink-0 border-t border-white/10 bg-[#05070e] flex items-center px-3 text-[10px] text-neutral-500 font-mono tracking-wide z-10 relative">
        <div className="flex items-center gap-2">
           <div className={cn("w-1.5 h-1.5 rounded-full", runtime.phase === 'idle' ? 'bg-neutral-600' : runtime.phase === 'failed' ? 'bg-red-500' : 'bg-green-500 animate-pulse')} />
           Runtime {runtime.phase}{runtime.qa ? ` · ${runtime.qa}` : ''}
        </div>
      </div>
    </div>
  );
}