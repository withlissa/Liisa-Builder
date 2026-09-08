import { useSyncExternalStore } from 'react';
import { WebContainer } from '@webcontainer/api';

export type RuntimePhase = 'idle' | 'booting' | 'installing' | 'starting' | 'qa' | 'ready' | 'failed' | 'cancelled';
export type RuntimeFile = { name: string; code: string };
type Credentials = { id: string; pollToken: string };
export type RuntimeSnapshot = { phase: RuntimePhase; revision: number | null; previewUrl: string; output: string; browserErrors: string[]; qa: string };
export type RuntimeExecute = { files: RuntimeFile[] | Record<string, string>; htmlPreview?: string; credentials?: Credentials; revision: number };

const blank: RuntimeSnapshot = { phase: 'idle', revision: null, previewUrl: '', output: '', browserErrors: [], qa: '' };
const bridge = `<script type="module">
import html2canvas from 'html2canvas';
(()=>{const send=(type,payload={})=>parent.postMessage({source:'lissa-qa',type,...payload},'*');
window.addEventListener('error',e=>send('browser-error',{detail:e.message||String(e.error||'Unknown error')}));
window.addEventListener('unhandledrejection',e=>send('browser-error',{detail:String(e.reason||'Unhandled rejection')}));
const error=console.error.bind(console);console.error=(...args)=>{send('browser-error',{detail:args.map(String).join(' ')});error(...args)};
window.addEventListener('message',async e=>{if(!e.data||e.data.source!=='lissa-qa-capture')return;try{
const scale=Math.min(1,1600/Math.max(innerWidth,innerHeight));
send('capture-progress',{requestId:e.data.requestId,detail:'painting'});
const canvas=await html2canvas(document.documentElement,{allowTaint:false,useCORS:true,logging:false,imageTimeout:3000,removeContainer:true,backgroundColor:getComputedStyle(document.body).backgroundColor||'#ffffff',width:innerWidth,height:innerHeight,windowWidth:innerWidth,windowHeight:innerHeight,scale});
send('capture-progress',{requestId:e.data.requestId,detail:'encoding'});
send('capture',{requestId:e.data.requestId,dataUrl:canvas.toDataURL('image/jpeg',.72)});
}catch(err){send('capture-error',{requestId:e.data.requestId,detail:err instanceof Error?err.message:String(err)})}});send('ready')})()</script>`;

function tree(files: Record<string, string>) {
  const root: Record<string, any> = {};
  for (const [path, contents] of Object.entries(files)) {
    const parts = path.replace(/^\/+/, '').split('/'); let cursor = root;
    parts.forEach((part, i) => { if (i === parts.length - 1) cursor[part] = { file: { contents } }; else cursor = (cursor[part] ||= { directory: {} }).directory; });
  }
  return root;
}
function withBridge(html: string) {
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${bridge}</head>`) : `<!doctype html><html><head>${bridge}</head><body>${html}</body></html>`;
}

class Runtime {
  private boot: Promise<WebContainer> | null = null;
  private container: WebContainer | null = null;
  private install: any = null; private dev: any = null; private shell: any = null;
  private serverDispose: (() => void) | null = null; private generation = 0; private eventNumber = 0;
  private installExitCode: number | undefined;
  private readyTimeout: number | null = null; private qaGeneration: number | null = null;
  private terminalTimer: number | null = null; private pendingTerminal = ''; private terminalGeneration: number | null = null;
  private listeners = new Set<() => void>(); private snapshot = blank; private current?: RuntimeExecute;
  private frames = new Set<HTMLIFrameElement>();
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  getSnapshot = () => this.snapshot;
  private update(patch: Partial<RuntimeSnapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(listener => listener()); }
  private append(data: string) { const output = (this.snapshot.output + data).slice(-20_000); this.update({ output }); }
  private isCurrent(generation: number) { return generation === this.generation; }
  private async post(type: 'status' | 'terminal' | 'browser-error' | 'preview', title: string, detail?: string, metadata?: Record<string, unknown>, generation?: number) {
    if (generation !== undefined && !this.isCurrent(generation)) return;
    const current = this.current; if (!current?.credentials) return;
    const eventId = `${current.revision}:${++this.eventNumber}:${type}`;
    const response = await fetch('/api/build/jobs/runtime/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...current.credentials, runtimeRevision: current.revision, eventId, type, title, detail, metadata }) });
    if (!response.ok && (generation === undefined || this.isCurrent(generation))) throw new Error(`Runtime event was rejected (${response.status})`);
  }
  private queueTerminal(data: string, generation: number) {
    this.pendingTerminal = (this.pendingTerminal + data).slice(-4_000); this.terminalGeneration = generation;
    if (this.terminalTimer !== null) return;
    this.terminalTimer = window.setTimeout(() => { this.terminalTimer = null; void this.flushTerminal(generation); }, 750);
  }
  private async flushTerminal(generation = this.terminalGeneration) {
    if (this.terminalTimer !== null) { window.clearTimeout(this.terminalTimer); this.terminalTimer = null; }
    const detail = this.pendingTerminal; this.pendingTerminal = ''; this.terminalGeneration = null;
    if (!detail || generation === null || !this.isCurrent(generation)) return;
    try { await this.post('terminal', 'Runtime output', detail, undefined, generation); } catch (error) { if (this.isCurrent(generation)) this.append(`\r\nTerminal event delivery failed: ${error instanceof Error ? error.message : 'unknown error'}\r\n`); }
  }
  private outputPipe(process: any, generation: number) {
    void process.output.pipeTo(new WritableStream({ write: data => { if (this.isCurrent(generation)) { this.append(data); this.queueTerminal(data, generation); } } })).catch(() => undefined);
  }
  async execute(request: RuntimeExecute) {
    if (this.current?.revision === request.revision && this.snapshot.phase !== 'cancelled' && this.snapshot.phase !== 'failed') return;
    await this.stop(false);
    const generation = ++this.generation; this.current = request; this.eventNumber = 0;
    const files = Array.isArray(request.files) ? Object.fromEntries(request.files.map(file => [file.name, file.code])) : { ...request.files };
    if (request.htmlPreview && !Object.keys(files).some(name => /(^|\/)index\.html$/i.test(name))) files['index.html'] = request.htmlPreview;
    this.installExitCode = undefined;
    this.update({ phase: 'booting', revision: request.revision, previewUrl: '', output: '', browserErrors: [], qa: '' }); await this.post('status', 'Booting browser runtime');
    try {
      const manifest = JSON.parse(files['package.json'] || '{"name":"lissa-runtime-preview","version":"1.0.0","private":true,"scripts":{"dev":"vite"},"devDependencies":{"vite":"^5.4.21"}}') as {
        dependencies?: Record<string, string>;
      };
      manifest.dependencies = { ...(manifest.dependencies || {}), html2canvas: "^1.4.1" };
      files['package.json'] = JSON.stringify(manifest, null, 2);
      if (files['index.html']) files['index.html'] = withBridge(files['index.html']);
      if (!self.crossOriginIsolated) throw new Error('Browser runtime requires the isolated Studio workspace. Reload the Studio and retry.');
      this.boot ||= WebContainer.boot({ coep: 'credentialless' }); this.container = await this.boot;
      if (generation !== this.generation) return;
      await this.container.mount(tree(files));
      this.serverDispose = this.container.on('server-ready', (_port, url) => {
        if (!this.isCurrent(generation) || this.qaGeneration === generation) return;
        if (this.readyTimeout !== null) { window.clearTimeout(this.readyTimeout); this.readyTimeout = null; }
        this.qaGeneration = generation; this.update({ previewUrl: url, phase: 'qa', qa: 'Capturing desktop and mobile QA previews' }); void this.qa(generation);
      });
      if (files['package.json']) {
        this.update({ phase: 'installing' }); await this.post('status', 'Installing dependencies');
        this.install = await this.container.spawn('npm', ['install']); this.outputPipe(this.install, generation);
        const exit = await this.install.exit; this.installExitCode = exit; if (generation !== this.generation) return;
        if (exit !== 0) throw new Error(`Dependency installation exited with code ${exit}`);
      }
      this.update({ phase: 'starting' }); await this.post('status', 'Starting development server');
      const next = (() => { try { const pkg = JSON.parse(files['package.json'] || '{}'); return !!(pkg.dependencies?.next || pkg.devDependencies?.next); } catch { return false; } })();
      if (files['package.json']) this.dev = await this.container.spawn('npm', next ? ['run', 'dev', '--', '--hostname', '0.0.0.0'] : ['run', 'dev', '--', '--host', '0.0.0.0']);
      else { const fallback = `import{createServer}from'node:http';import{readFile,stat}from'node:fs/promises';import{extname,join,normalize}from'node:path';const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon'};createServer(async(q,s)=>{try{let p=decodeURIComponent((q.url||'/').split('?')[0]);if(p==='/')p='/index.html';const safe=normalize(p).replace(/^(\\.\\.([/\\\\]|$))+/,'');let f=join(process.cwd(),safe);if((await stat(f)).isDirectory())f=join(f,'index.html');s.setHeader('content-type',mime[extname(f)]||'application/octet-stream');s.end(await readFile(f))}catch{s.statusCode=404;s.end('Not found')}}).listen(3000,'0.0.0.0')`; await this.container.mount(tree({ '__lissa_server.mjs': fallback })); this.dev = await this.container.spawn('node', ['__lissa_server.mjs']); }
      this.outputPipe(this.dev, generation);
      this.readyTimeout = window.setTimeout(() => { if (this.isCurrent(generation) && this.qaGeneration !== generation) void this.fail('Development server did not become ready within 60 seconds', generation); }, 60_000);
      void this.dev.exit.then((code: number) => { if (this.isCurrent(generation) && this.qaGeneration !== generation) void this.fail(`Development server exited before ready with code ${code}`, generation); else if (this.isCurrent(generation) && code !== 0 && this.snapshot.phase !== 'cancelled') void this.fail(`Development server exited with code ${code}`, generation); });
    } catch (error) { if (generation === this.generation) await this.fail(error instanceof Error ? error.message : 'Runtime unavailable'); }
  }
  private async qa(generation: number) {
    const current = this.current; if (!current || generation !== this.generation || !this.snapshot.previewUrl) return;
    const screenshots: Array<{ viewport: 'desktop' | 'mobile'; width: number; height: number; dataUrl: string }> = [];
    try {
      for (const [viewport, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) screenshots.push({ viewport, width, height, dataUrl: await this.capture(viewport, width, height, generation) });
      if (generation !== this.generation) return;
      const passed = this.snapshot.browserErrors.length === 0;
      this.update({ phase: passed ? 'ready' : 'failed', qa: passed ? 'QA passed' : 'QA found browser errors' });
      await this.post('preview', 'QA screenshots captured', undefined, { screenshots: screenshots.length }, generation);
      await this.flushTerminal(generation);
      if (current.credentials) await this.report({ ...current.credentials, runtimeRevision: current.revision, status: passed ? 'passed' : 'failed', installExitCode: this.installExitCode ?? 0, serverExitCode: 0, terminalOutput: this.snapshot.output, browserErrors: this.snapshot.browserErrors, screenshots }, generation);
    } catch (error) { if (generation === this.generation) await this.fail(error instanceof Error ? error.message : 'QA capture failed'); }
  }
  private capture(viewport: string, width: number, height: number, generation: number) {
    return new Promise<string>((resolve, reject) => {
      const frame = document.createElement('iframe'); const requestId = `${generation}-${viewport}`;
      frame.src = this.snapshot.previewUrl; frame.width = String(width); frame.height = String(height); frame.loading = 'eager'; frame.style.cssText = 'position:fixed;left:-20000px;top:0;border:0;opacity:0;pointer-events:none'; frame.sandbox.add('allow-scripts', 'allow-same-origin'); document.body.append(frame); this.frames.add(frame);
      const cleanup = () => { window.removeEventListener('message', receive); frame.remove(); this.frames.delete(frame); };
      const timer = window.setTimeout(() => { cleanup(); reject(new Error(`${viewport} screenshot timed out`)); }, 30_000);
      const receive = (event: MessageEvent) => { const data = event.data; if (event.source !== frame.contentWindow || data?.source !== 'lissa-qa') return;
        if (data.type === 'browser-error') { const detail = String(data.detail); this.update({ browserErrors: [...this.snapshot.browserErrors, detail].slice(-20) }); void this.post('browser-error', 'Browser error', detail, undefined, generation).catch(error => { if (this.isCurrent(generation)) this.append(`\r\nBrowser-error event delivery failed: ${error instanceof Error ? error.message : 'unknown error'}\r\n`); }); }
        if (data.requestId === requestId && data.type === 'capture-progress') this.update({ qa: `Capturing ${viewport} preview · ${String(data.detail)}` });
        if (data.type === 'ready') window.setTimeout(() => frame.contentWindow?.postMessage({ source: 'lissa-qa-capture', requestId }, '*'), 600);
        if (data.requestId === requestId && data.type === 'capture') {
          const image = String(data.dataUrl || '');
          if (!/^data:image\/(?:jpeg|png);base64,/i.test(image) || image.length < 5_000) { clearTimeout(timer); cleanup(); reject(new Error(`${viewport} screenshot was empty or invalid`)); return; }
          if (image.length > 3_000_000) { clearTimeout(timer); cleanup(); reject(new Error(`${viewport} screenshot exceeded the 3 MB capture limit`)); return; }
          clearTimeout(timer); cleanup(); resolve(image);
        }
        if (data.requestId === requestId && data.type === 'capture-error') { clearTimeout(timer); cleanup(); reject(new Error(String(data.detail))); }
      }; window.addEventListener('message', receive);
    });
  }
  private async report(payload: Record<string, unknown>, generation: number) {
    if (!this.isCurrent(generation)) return;
    const response = await fetch('/api/build/jobs/runtime/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok && this.isCurrent(generation) && this.snapshot.phase !== 'cancelled') {
      const message = `Runtime report was rejected (${response.status})`;
      this.append(`\r\n${message}\r\n`); this.update({ phase: 'failed', qa: message });
      throw new Error(message);
    }
  }
  private async fail(message: string, generation = this.generation) {
    if (!this.isCurrent(generation)) return;
    const current = this.current;
    this.append(`\r\nRuntime error: ${message}\r\n`); this.update({ phase: 'failed', qa: message });
    if (this.readyTimeout !== null) { window.clearTimeout(this.readyTimeout); this.readyTimeout = null; }
    await this.flushTerminal(generation);
    try { await this.post('status', 'Runtime failed', message, undefined, generation); } catch (error) { this.append(`\r\nStatus event delivery failed: ${error instanceof Error ? error.message : 'unknown error'}\r\n`); }
    if (current?.credentials) {
      try { await this.report({ ...current.credentials, runtimeRevision: current.revision, status: 'failed', installExitCode: this.installExitCode, terminalOutput: this.snapshot.output, browserErrors: [...this.snapshot.browserErrors, message].slice(-20), screenshots: [] }, generation); } catch { /* rejection is already surfaced locally */ }
    }
  }
  async stop(report = true) {
    const current = this.current; const wasActive = this.snapshot.phase !== 'idle' && this.snapshot.phase !== 'ready' && this.snapshot.phase !== 'failed';
    if (report && wasActive) await this.flushTerminal(this.generation);
    ++this.generation; if (this.readyTimeout !== null) { window.clearTimeout(this.readyTimeout); this.readyTimeout = null; } this.qaGeneration = null;
    if (this.terminalTimer !== null) { window.clearTimeout(this.terminalTimer); this.terminalTimer = null; } this.pendingTerminal = ''; this.terminalGeneration = null;
    this.serverDispose?.(); this.serverDispose = null; this.frames.forEach(frame => frame.remove()); this.frames.clear();
    for (const process of [this.install, this.dev, this.shell]) { try { process?.kill(); } catch {} } this.install = this.dev = this.shell = null;
    if (report && current?.credentials && wasActive) {
      const response = await fetch('/api/build/jobs/runtime/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...current.credentials, runtimeRevision: current.revision, status: 'cancelled', terminalOutput: this.snapshot.output, browserErrors: this.snapshot.browserErrors, screenshots: [] }) }).catch(() => null);
      if (response && !response.ok) this.append(`\r\nCancellation report was rejected (${response.status}).\r\n`);
    }
    this.update({ phase: wasActive ? 'cancelled' : 'idle', qa: wasActive ? 'Runtime stopped' : '' });
  }
}
export const webcontainerRuntime = new Runtime();
export function useWebcontainerRuntime() { return useSyncExternalStore(webcontainerRuntime.subscribe, webcontainerRuntime.getSnapshot, webcontainerRuntime.getSnapshot); }