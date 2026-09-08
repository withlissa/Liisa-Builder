const fs = require('fs');
const content = fs.readFileSync('artifacts/ai-studio-applet/src/components/access-gate.tsx', 'utf8');
const lines = content.split('\n');

// 1. Add new icons to import
const iconImportLineIdx = lines.findIndex(l => l.includes('import { Loader2, Network, RefreshCw'));
if (iconImportLineIdx !== -1) {
  lines[iconImportLineIdx] = "import { Loader2, Network, RefreshCw, ShieldCheck, Wallet, Hexagon, ChevronRight, Fingerprint, Lock, ShieldAlert, Cpu, Bot, Layout, Code2, Database } from 'lucide-react';";
}

// 2. Adjust scrolling logic and add new chapter variables
const finaleOpacityIdx = lines.findIndex(l => l.includes('const finaleOpacity = useTransform(scrollYProgress, [0.58, 0.64], [0, 1]);'));

if (finaleOpacityIdx !== -1) {
  lines.splice(finaleOpacityIdx, 3, 
`  // Section 3: Finale
  const finaleOpacity = useTransform(scrollYProgress, [0.58, 0.64, 0.78, 0.82], [0, 1, 1, 0]);
  const finaleY = useTransform(scrollYProgress, [0.58, 0.66], [60, 0]);
  const finaleVisibility = useTransform(finaleOpacity, (v) => v > 0.05 ? "visible" : "hidden");

  // Section 4: Product Reveal
  const videoOpacity = useTransform(scrollYProgress, [0.82, 0.88], [0.9, 0]);
  const videoFilter = useTransform(
    scrollYProgress,
    [0.78, 0.82, 0.84, 0.86, 0.88],
    [
      'blur(0px) contrast(1) brightness(1) hue-rotate(0deg)',
      'blur(2px) contrast(1.5) brightness(1.2) hue-rotate(90deg)',
      'blur(8px) contrast(2) brightness(1.5) hue-rotate(-90deg)',
      'blur(4px) contrast(1.5) brightness(0.5) hue-rotate(180deg)',
      'blur(20px) contrast(1) brightness(0) hue-rotate(0deg)'
    ]
  );

  const dashboardY = useTransform(scrollYProgress, [0.82, 1], ['100%', '0%']);
  const dashboardOpacity = useTransform(scrollYProgress, [0.82, 0.95], [0, 1]);
  const dashboardScale = useTransform(scrollYProgress, [0.82, 1], [0.9, 1]);
  const dashboardRotateX = useTransform(scrollYProgress, [0.82, 1], ['15deg', '0deg']);
  const dashboardVisibility = useTransform(dashboardOpacity, (v) => v > 0.01 ? "visible" : "hidden");`);
}

// 3. Update video rendering with filter and opacity
const videoMotionIdx = lines.findIndex(l => l.includes('className="w-full h-full object-cover opacity-90"'));
if (videoMotionIdx !== -1) {
  lines.splice(videoMotionIdx, 2, 
`          className="w-full h-full object-cover"
          style={{ scale: zoomScale, objectPosition: videoPosition, transformOrigin: 'center 30%', opacity: videoOpacity, filter: videoFilter }}`);
}

// 4. Add the product reveal section
const finaleEndIdx = lines.findIndex((l, idx) => idx > finaleOpacityIdx && l.includes('</motion.section>'));
if (finaleEndIdx !== -1) {
  lines.splice(finaleEndIdx + 1, 0, 
`
        {/* PRODUCT REVEAL CHAPTER */}
        <motion.section
          style={{ 
            opacity: dashboardOpacity, 
            y: dashboardY, 
            scale: dashboardScale, 
            rotateX: dashboardRotateX, 
            transformPerspective: 1200,
            visibility: dashboardVisibility as any 
          }}
          className="absolute inset-0 flex flex-col items-center justify-end p-2 sm:p-6 md:p-12 pb-0 pointer-events-auto z-20 overflow-hidden"
        >
          <div className="w-full max-w-[1400px] h-[75vh] md:h-[85vh] bg-[#02040a] rounded-t-[2rem] md:rounded-t-[3rem] border-t border-l border-r border-white/10 shadow-[0_-20px_80px_rgba(5,11,224,0.15)] overflow-hidden flex flex-col relative">
            {/* Screen glare/curve effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none z-50" />
            <div className="absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-black/60 to-transparent pointer-events-none z-50" />
            <div className="absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-black/60 to-transparent pointer-events-none z-50" />
            
            {/* Studio Header Mock */}
            <header className="h-12 flex items-center justify-between px-3 md:px-4 border-b border-white/5 bg-[#05070e] shrink-0 relative z-20 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3 w-1/3">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-[#0a0c14] overflow-hidden border border-white/10 p-[1px]">
                  <img src="/brand/lissa-logo.jpg" alt="Lissa" className="w-full h-full object-cover rounded-[2px]" />
                </div>
                <img src="/brand/lissa-wordmark.png" alt="Lissa" className="h-3 w-auto object-contain opacity-90 hidden sm:block" />
              </div>
              <div className="hidden md:flex items-center h-full justify-center flex-1 gap-2">
                 {[
                   { icon: Bot, label: 'Agent' },
                   { icon: Layout, label: 'Preview' },
                   { icon: Code2, label: 'Code' },
                   { icon: Database, label: 'Data' }
                 ].map(tab => (
                   <div key={tab.label} className={cn(
                     "h-full px-3.5 flex items-center justify-center border-b-2 gap-1.5",
                     tab.label === 'Preview' ? "border-[#050BE0] text-[#050BE0]" : "border-transparent text-neutral-500"
                   )}>
                     <tab.icon className="w-3.5 h-3.5" />
                     <span className="text-[11px] uppercase tracking-wider font-medium">{tab.label}</span>
                   </div>
                 ))}
              </div>
              <div className="flex items-center justify-end w-1/3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-white/5">
                  <Wallet className="w-3 h-3 text-[#050BE0]" />
                  <span className="text-[10px] text-white">0x7F...4A2</span>
                </div>
              </div>
            </header>

            {/* Studio Body Mock */}
            <div className="flex-1 flex bg-[#02040a] relative z-10">
               {/* Left Agent Chat Mock */}
               <div className="hidden lg:flex flex-col w-[320px] bg-[#05070e] border-r border-white/5 p-4 gap-4 relative">
                 <div className="absolute top-4 right-4 w-32 h-32 bg-[#050BE0]/5 blur-3xl pointer-events-none" />
                 <div className="w-full p-3 bg-[#080a11] border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-[#050BE0]"/> Active Context</span>
                    </div>
                    <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                    <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                 </div>
                 
                 <div className="flex flex-col gap-4 flex-1 justify-end pb-2">
                   <div className="bg-[#0a0d16] border border-white/5 rounded-2xl rounded-tl-sm p-3 w-[85%]">
                     <div className="h-2 w-full bg-white/10 rounded-full mb-2" />
                     <div className="h-2 w-4/5 bg-white/10 rounded-full mb-2" />
                     <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                   </div>
                   <div className="bg-[#050BE0] rounded-2xl rounded-tr-sm p-3 w-[75%] self-end">
                     <div className="h-2 w-full bg-white/20 rounded-full mb-2" />
                     <div className="h-2 w-1/2 bg-white/20 rounded-full" />
                   </div>
                 </div>
                 
                 <div className="w-full h-12 bg-[#080a11] border border-white/10 rounded-xl flex items-center px-3 gap-2">
                    <div className="w-4 h-4 rounded-full bg-white/10" />
                    <div className="h-2 w-1/3 bg-white/10 rounded-full" />
                 </div>
               </div>
               
               {/* Right Preview Surface Mock */}
               <div className="flex-1 p-3 md:p-6 bg-[#030408] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                  <div className="w-full h-full bg-white rounded-md md:rounded-lg shadow-2xl overflow-hidden relative border border-white/10 flex flex-col">
                     {/* Web App UI Mock */}
                     <div className="h-12 border-b border-neutral-200 flex items-center px-4 md:px-6 justify-between bg-white shrink-0">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-md bg-[#050BE0]" />
                         <div className="h-3.5 w-24 bg-neutral-200 rounded" />
                       </div>
                       <div className="hidden md:flex gap-4">
                         <div className="h-3 w-16 bg-neutral-200 rounded" />
                         <div className="h-3 w-16 bg-neutral-200 rounded" />
                         <div className="h-3 w-16 bg-neutral-200 rounded" />
                       </div>
                       <div className="h-8 w-24 bg-neutral-900 rounded-md" />
                     </div>
                     <div className="flex-1 bg-neutral-50 p-4 md:p-8 flex flex-col md:flex-row gap-6">
                       <div className="w-full md:w-64 shrink-0 space-y-4">
                         <div className="h-32 w-full bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex flex-col justify-end gap-2">
                           <div className="h-3 w-1/2 bg-neutral-200 rounded" />
                           <div className="h-6 w-3/4 bg-neutral-300 rounded" />
                         </div>
                         <div className="hidden md:flex flex-col gap-2">
                           {[1,2,3,4].map(i => <div key={i} className="h-10 w-full bg-white rounded-lg border border-neutral-200 shadow-sm" />)}
                         </div>
                       </div>
                       <div className="flex-1 space-y-4">
                         <div className="h-48 md:h-64 w-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex">
                            <div className="w-1/3 bg-neutral-100 border-r border-neutral-200" />
                            <div className="flex-1 p-6 flex flex-col justify-center gap-3">
                               <div className="h-4 w-1/3 bg-neutral-300 rounded" />
                               <div className="h-3 w-2/3 bg-neutral-200 rounded" />
                               <div className="h-3 w-1/2 bg-neutral-200 rounded" />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {[1,2,3].map(i => <div key={i} className={cn("h-24 md:h-32 bg-white rounded-xl border border-neutral-200 shadow-sm", i === 3 ? "hidden md:block" : "")} />)}
                         </div>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.section>`);
}

fs.writeFileSync('artifacts/ai-studio-applet/src/components/access-gate.tsx', lines.join('\n'));
