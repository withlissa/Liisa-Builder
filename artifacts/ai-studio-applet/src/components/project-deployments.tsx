import { useEffect, useState } from 'react';
import { Rocket, Loader2, Globe, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Server, ArrowUpRight } from 'lucide-react';
import type { GeneratedApp } from '@workspace/api-client-react';

export default function ProjectDeployments({ projectId, walletAddress, app }: { projectId: string | null, walletAddress?: string, app: GeneratedApp | null }) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [project, setProject] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const loadData = async () => {
    if (!projectId || !walletAddress) return;
    setStatus('loading');
    try {
      const projRes = await fetch(`/api/projects/${projectId}?walletAddress=${walletAddress}`);
      if (!projRes.ok) throw new Error('Failed to load project');
      setProject(await projRes.json());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, walletAddress]);

  const handlePublish = async () => {
    if (!projectId || !walletAddress || !app) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const files = Object.fromEntries(app.files.map(f => [f.name, f.code]));
      const publishFiles = app.htmlPreview ? { ...files, 'index.html': app.htmlPreview } : files;
      
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress, files: publishFiles })
      });
      
      if (!res.ok) throw new Error('Deployment rejected');
      await loadData();
    } catch (e: any) {
      setPublishError(e.message || 'Network error during deployment.');
    } finally {
      setPublishing(false);
    }
  };

  if (!projectId || !walletAddress) {
    return <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-3"><Rocket className="w-8 h-8 opacity-50" /><p className="text-xs">No active project context.</p></div>;
  }

  if (status === 'loading' && !project) {
    return <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#050BE0]" /></div>;
  }
  if (status === 'error' && !project) {
    return <div className="w-full h-full flex flex-col items-center justify-center text-red-400 gap-3"><button onClick={loadData} aria-label="Retry"><RefreshCw className="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 transition-opacity" /></button><p className="text-xs">Failed to load deployment data.</p></div>;
  }

  return (
    <div className="w-full h-full p-6 lg:p-10 overflow-y-auto font-sans">
       <div className="max-w-3xl mx-auto space-y-8">
         <div className="flex items-center justify-between border-b border-white/10 pb-4">
           <div>
             <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Rocket className="w-5 h-5 text-[#050BE0]"/> Deployments</h2>
             <p className="text-xs text-neutral-400 mt-1">Manage edge releases and active runtime</p>
           </div>
           <button onClick={loadData} className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors" aria-label="Refresh Status">
             <RefreshCw className="w-4 h-4" />
           </button>
         </div>

         <div className="bg-[#05070e] border border-white/5 rounded-xl p-6 shadow-sm relative overflow-hidden">
            {project?.publishedUrl && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#050BE0]/10 blur-[50px] pointer-events-none rounded-full" />
            )}
            
            <div className="flex items-start justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${project?.published ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'}`} />
                  <h3 className="text-base font-medium text-white">{project?.published ? 'Production Active' : 'Not Published'}</h3>
                </div>
                
                <p className="text-xs text-neutral-400 max-w-lg mb-6 leading-relaxed">
                  Deploy your generated index.html bundle and source assets to the global edge network. This creates a secure, publicly accessible URL for your application.
                </p>

                {project?.publishedUrl && (
                  <div className="bg-black/40 border border-white/5 rounded-lg p-4 mb-6">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Deployment URL</div>
                    <a href={project.publishedUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#050BE0] hover:text-[#151BEF] transition-colors break-all group">
                      {project.publishedUrl}
                      <ArrowUpRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                    <div className="text-[10px] text-neutral-500 mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      Last deployed {new Date(project.updatedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {publishError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {publishError}
                  </div>
                )}

                <button 
                  onClick={handlePublish}
                  disabled={publishing || !app}
                  className="flex items-center gap-2 px-6 h-10 bg-[#050BE0] hover:bg-[#151BEF] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors group"
                  aria-label="Deploy to Edge"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                  {publishing ? 'Publishing...' : 'Deploy to Edge'}
                </button>
              </div>

              <div className="hidden sm:flex w-24 h-24 rounded-2xl bg-black/40 border border-white/5 items-center justify-center shrink-0 shadow-inner">
                <Server className={`w-10 h-10 ${project?.published ? 'text-green-500' : 'text-neutral-600'}`} />
              </div>
            </div>
         </div>
       </div>
    </div>
  );
}
