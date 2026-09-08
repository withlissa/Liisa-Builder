import { useEffect, useState, useMemo } from 'react';
import { Database, FileText, KeyRound, Loader2, RefreshCw, HardDrive, FileJson, FileCode2, Image as ImageIcon, Box } from 'lucide-react';

export default function ProjectData({ projectId, walletAddress }: { projectId: string | null, walletAddress?: string }) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [project, setProject] = useState<any>(null);
  const [secrets, setSecrets] = useState<string[]>([]);
  
  const loadData = async () => {
    if (!projectId || !walletAddress) return;
    setStatus('loading');
    try {
      const [projRes, secRes] = await Promise.all([
        fetch(`/api/projects/${projectId}?walletAddress=${walletAddress}`),
        fetch(`/api/projects/${projectId}/secrets?walletAddress=${walletAddress}`)
      ]);
      
      if (!projRes.ok) throw new Error('Failed to load project');
      
      setProject(await projRes.json());
      if (secRes.ok) {
        const secData = await secRes.json();
        setSecrets(secData.keys || []);
      }
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, walletAddress]);

  const fileStats = useMemo(() => {
    if (!project?.files) return null;
    const stats = { tsx: 0, html: 0, css: 0, json: 0, other: 0, totalSize: 0, fileCount: 0 };
    Object.entries(project.files as Record<string, string>).forEach(([name, content]) => {
      const size = new Blob([content]).size;
      stats.totalSize += size;
      stats.fileCount++;
      if (name.endsWith('.tsx') || name.endsWith('.ts')) stats.tsx++;
      else if (name.endsWith('.html')) stats.html++;
      else if (name.endsWith('.css')) stats.css++;
      else if (name.endsWith('.json')) stats.json++;
      else stats.other++;
    });
    return stats;
  }, [project]);

  if (!projectId || !walletAddress) {
    return <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-3"><HardDrive className="w-8 h-8 opacity-50" /><p className="text-xs">No active project context.</p></div>;
  }

  if (status === 'loading') {
    return <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#050BE0]" /></div>;
  }
  if (status === 'error') {
    return <div className="w-full h-full flex flex-col items-center justify-center text-red-400 gap-3"><button onClick={loadData} aria-label="Retry"><RefreshCw className="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 transition-opacity" /></button><p className="text-xs">Failed to load project data.</p></div>;
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full h-full p-6 lg:p-10 overflow-y-auto font-sans">
       <div className="max-w-4xl mx-auto space-y-8">
         <div className="flex items-center justify-between border-b border-white/10 pb-4">
           <div>
             <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Database className="w-5 h-5 text-[#050BE0]"/> Project Data</h2>
             <p className="text-xs text-neutral-400 mt-1">Persisted metadata, file analysis, and secret keys</p>
           </div>
           <button onClick={loadData} className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors" aria-label="Refresh Data">
             <RefreshCw className="w-4 h-4" />
           </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-[#05070e] border border-white/5 rounded-xl p-5 shadow-sm">
             <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2"><HardDrive className="w-4 h-4 text-neutral-400"/> Metadata</h3>
             <div className="space-y-4 text-sm">
               <div className="flex justify-between items-center"><span className="text-neutral-500">ID</span><span className="font-mono text-xs text-neutral-300 truncate pl-4 max-w-[200px]">{project.id}</span></div>
               <div className="flex justify-between items-center"><span className="text-neutral-500">Title</span><span className="text-neutral-200 truncate pl-4">{project.title}</span></div>
               <div className="flex justify-between items-center"><span className="text-neutral-500">Created</span><span className="text-neutral-300">{new Date(project.createdAt).toLocaleString()}</span></div>
               <div className="flex justify-between items-center"><span className="text-neutral-500">Updated</span><span className="text-neutral-300">{new Date(project.updatedAt).toLocaleString()}</span></div>
               <div className="flex justify-between items-center"><span className="text-neutral-500">Published Status</span><span className={project.published ? "text-green-400" : "text-neutral-400"}>{project.published ? 'Yes' : 'No'}</span></div>
               {project.publishedUrl && (
                 <div className="flex justify-between items-center"><span className="text-neutral-500">URL</span><a href={project.publishedUrl} target="_blank" rel="noreferrer" className="text-[#050BE0] hover:underline text-xs truncate max-w-[200px]">{project.publishedUrl}</a></div>
               )}
             </div>
           </div>

           <div className="bg-[#05070e] border border-white/5 rounded-xl p-5 shadow-sm">
             <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-neutral-400"/> Filesystem Analysis</h3>
             <div className="flex items-end gap-3 mb-6">
               <div className="text-3xl font-semibold text-white">{fileStats?.fileCount}</div>
               <div className="text-xs text-neutral-500 mb-1">Total Files</div>
               <div className="ml-auto text-sm font-mono text-[#050BE0] bg-[#050BE0]/10 px-2 py-1 rounded">{formatSize(fileStats?.totalSize || 0)}</div>
             </div>
             
             <div className="space-y-3">
               <div className="flex items-center gap-3">
                 <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
                 <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden"><div className="bg-blue-400 h-full transition-all" style={{width: `${(fileStats?.tsx || 0) / (fileStats?.fileCount || 1) * 100}%`}}/></div>
                 <span className="text-xs text-neutral-400 w-14 text-right">{fileStats?.tsx} TSX</span>
               </div>
               <div className="flex items-center gap-3">
                 <Box className="w-4 h-4 text-orange-400 shrink-0" />
                 <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden"><div className="bg-orange-400 h-full transition-all" style={{width: `${(fileStats?.html || 0) / (fileStats?.fileCount || 1) * 100}%`}}/></div>
                 <span className="text-xs text-neutral-400 w-14 text-right">{fileStats?.html} HTML</span>
               </div>
               <div className="flex items-center gap-3">
                 <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
                 <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden"><div className="bg-pink-400 h-full transition-all" style={{width: `${(fileStats?.css || 0) / (fileStats?.fileCount || 1) * 100}%`}}/></div>
                 <span className="text-xs text-neutral-400 w-14 text-right">{fileStats?.css} CSS</span>
               </div>
               <div className="flex items-center gap-3">
                 <FileJson className="w-4 h-4 text-yellow-400 shrink-0" />
                 <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden"><div className="bg-yellow-400 h-full transition-all" style={{width: `${(fileStats?.json || 0) / (fileStats?.fileCount || 1) * 100}%`}}/></div>
                 <span className="text-xs text-neutral-400 w-14 text-right">{fileStats?.json} JSON</span>
               </div>
             </div>
           </div>

           <div className="bg-[#05070e] border border-white/5 rounded-xl p-5 shadow-sm lg:col-span-2">
             <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4 text-neutral-400"/> Persisted Secrets</h3>
             {secrets.length === 0 ? (
               <div className="py-8 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-white/5 rounded-lg bg-black/20">
                 <KeyRound className="w-6 h-6 mb-2 opacity-50" />
                 <span className="text-xs">No secrets configured for this project</span>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {secrets.map(k => (
                   <div key={k} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/30 border border-white/5">
                     <div className="w-7 h-7 rounded bg-green-500/10 flex items-center justify-center shrink-0">
                       <KeyRound className="w-3.5 h-3.5 text-green-500" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="text-xs font-semibold text-white truncate" title={k}>{k}</div>
                       <div className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">Encrypted</div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </div>
       </div>
    </div>
  );
}
