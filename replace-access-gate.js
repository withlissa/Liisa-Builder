const fs = require('fs');

const content = `import { useEffect, useRef, useState } from 'react';
import { Loader2, Network, RefreshCw, ShieldCheck, Wallet, Hexagon, ChevronRight, Fingerprint, Lock, ShieldAlert, Cpu, Bot, Layout, Code2, Database, Table2, FileArchive, Box, PlugZap } from 'lucide-react';
import { formatUnits } from 'viem';
import { robinhoodChain } from '@/lib/web3';
import { motion, useTransform, useMotionValue, useMotionValueEvent, useReducedMotion, type MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

const INTEGRATIONS = [
  { id: 'github', name: 'GitHub', label: 'Sync repositories', url: 'https://cdn.simpleicons.org/github/white' },
  { id: 'bitbucket', name: 'Bitbucket', label: 'Source control', url: 'https://cdn.simpleicons.org/bitbucket/2684FF' },
  { id: 'figma', name: 'Figma', label: 'Design to code', url: 'https://cdn.simpleicons.org/figma/F24E1E' },
  { id: 'bolt', name: 'Bolt', label: 'Lightning fast edge', url: '/brand/bolt.png', fallback: PlugZap },
  { id: 'base44', name: 'Base44', label: 'Database backend', url: '/brand/base44.png', fallback: Database },
  { id: 'vercel', name: 'Vercel', label: 'Instant deployment', url: 'https://cdn.simpleicons.org/vercel/white' },
  { id: 'data', name: 'Spreadsheet', label: 'Import CSV/JSON', fallback: Table2 },
  { id: 'zip', name: 'ZIP Archive', label: 'Export source code', fallback: FileArchive },
  { id: 'empty', name: 'Empty Project', label: 'Start from scratch', fallback: Box },
];

function IntegrationIcon({ item }: { item: any }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (item.url && !imgFailed) {
    return <img src={item.url} alt={item.name} className="w-6 h-6 object-contain" onError={() => setImgFailed(true)} />;
  }
  if (item.fallback) {
    const Icon = item.fallback;
    return <Icon className="w-6 h-6 text-white group-hover:text-blue-400 transition-colors" />;
  }
  return <Hexagon className="w-6 h-6 text-white group-hover:text-blue-400 transition-colors" />;
}

function ScrollTypingText({
  progress,
  start,
  end,
  text,
  className,
  reducedMotion,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  text: string;
  className: string;
  reducedMotion: boolean;
}) {
  const [characterCount, setCharacterCount] = useState(() => reducedMotion ? text.length : 0);

  useEffect(() => {
    const latest = progress.get();
    const ratio = reducedMotion ? 1 : Math.min(Math.max((latest - start) / (end - start), 0), 1);
    setCharacterCount(Math.round(text.length * ratio));
  }, [end, progress, reducedMotion, start, text]);

  useMotionValueEvent(progress, 'change', latest => {
    const ratio = reducedMotion ? 1 : Math.min(Math.max((latest - start) / (end - start), 0), 1);
    setCharacterCount(Math.round(text.length * ratio));
  });

  const isTyping = characterCount > 0 && characterCount < text.length;

  return (
    <div className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, characterCount)}</span>
      {isTyping && (
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-[0.85em] w-[2px] translate-y-[0.05em] bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
        />
      )}
    </div>
  );
}

function WalletCTA({ walletProps, onSignIn, isSigningIn, signInError, className }: any) {
  const {
    address, isConnected, chainId, open, disconnect, switchChain, isSwitching,
    lissaBalance, minimumLissaBalance, lissaDecimals, lissaSymbol,
    hasLissaAccess, isTokenDataLoading, tokenReadError,
  } = walletProps;

  const isCorrectChain = chainId === robinhoodChain.id;
  const decimals = Number(lissaDecimals ?? 18);
  const symbol = lissaSymbol || 'LOS';
  const held = lissaBalance === undefined ? '---' : Number(formatUnits(lissaBalance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  const required = minimumLissaBalance === undefined ? '1,000,000' : Number(formatUnits(minimumLissaBalance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  const shortAddress = address ? \`\${address.slice(0, 6)}...\${address.slice(-4)}\` : '';

  const changeWallet = () => {
    disconnect();
    window.setTimeout(() => open({ view: 'Connect' }), 250);
  };

  return (
    <div className={cn("relative p-6 sm:p-8 bg-[#02040A]/60 backdrop-blur-2xl border-y border-white/10 overflow-hidden shadow-2xl shadow-blue-900/20 group", className)}>
      <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0" />
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0" />
      
      <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-400/50 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-[scanline_4s_linear_infinite]" />

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-[pulse-ring_2s_infinite_cubic-bezier(0.215,0.61,0.355,1)]" />
          <span className="text-[10px] font-mono tracking-[0.25em] text-blue-300/80 uppercase">System Auth</span>
        </div>
        <Fingerprint className="w-4 h-4 text-blue-400/30" />
      </div>

      <div className="space-y-4 font-mono text-sm mb-8 relative z-10">
        <div className="flex justify-between items-end border-b border-white/5 pb-2 transition-colors">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Required</span>
          <span className="text-white/90 font-medium">{required} {symbol}</span>
        </div>
        
        <div className="flex justify-between items-end border-b border-white/5 pb-2 transition-colors">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Balance</span>
          {isConnected && isCorrectChain && !isTokenDataLoading ? (
            <span className={cn(
              "font-medium",
              hasLissaAccess ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
            )}>{held} {symbol}</span>
          ) : (
            <span className="text-white/20 font-medium">---</span>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {!isConnected ? (
          <button type="button" onClick={() => open({ view: 'Connect' })} className="w-full relative group/btn overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 text-white h-12 flex items-center justify-between px-4 font-mono text-xs uppercase tracking-widest transition-all">
            <div className="absolute inset-0 w-0 bg-blue-600/20 group-hover/btn:w-full transition-all duration-500 ease-out" />
            <span className="relative flex items-center gap-3"><Wallet className="w-4 h-4 text-blue-400" /> Initialize Link</span>
            <ChevronRight className="w-4 h-4 relative text-blue-400 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        ) : !isCorrectChain ? (
          <button type="button" onClick={() => switchChain({ chainId: robinhoodChain.id })} disabled={isSwitching} className="w-full relative group/btn overflow-hidden bg-blue-600 hover:bg-blue-500 text-white h-12 flex items-center justify-between px-4 font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            <span className="relative flex items-center gap-3"><Network className="w-4 h-4" /> {isSwitching ? 'Switching...' : 'Switch Network'}</span>
            <ChevronRight className="w-4 h-4 relative group-hover/btn:translate-x-1 transition-transform" />
          </button>
        ) : isTokenDataLoading ? (
          <div className="w-full bg-blue-950/20 border border-blue-900/50 text-blue-400/70 h-12 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
          </div>
        ) : hasLissaAccess ? (
          <button type="button" onClick={onSignIn} disabled={isSigningIn} className="w-full relative group/btn overflow-hidden bg-blue-600 hover:bg-blue-500 text-white h-12 flex items-center justify-between px-4 font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite_linear]" />
            <span className="relative flex items-center gap-3">
              {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {isSigningIn ? 'Authenticating...' : 'Enter App'}
            </span>
            <ChevronRight className="w-4 h-4 relative group-hover/btn:translate-x-1 transition-transform" />
          </button>
        ) : (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-4 flex items-start gap-3 text-xs font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {tokenReadError ? 'Verification failed. Check network.' : \`Access denied. \${shortAddress} lacks minimum holding.\`}
            </span>
          </div>
        )}

        {isConnected && (
          <button type="button" onClick={changeWallet} className="w-full flex items-center justify-center gap-2 text-[10px] font-mono text-white/30 hover:text-white/80 transition-colors uppercase tracking-widest pt-2">
            <RefreshCw className="w-3 h-3" /> Change Wallet
          </button>
        )}

        {signInError && (
          <div className="text-red-400 text-[10px] font-mono text-center mt-2 animate-in fade-in">
            {signInError}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccessGate({ walletProps, onSignIn, isSigningIn, signInError }: { walletProps: any; onSignIn: () => void; isSigningIn: boolean; signInError: string | null }) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollYProgress = useMotionValue(0);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const updateProgress = () => {
      const container = containerRef.current;
      if (!container) return;
      const scrollableDistance = Math.max(container.offsetHeight - window.innerHeight, 1);
      const progress = (window.scrollY - container.offsetTop) / scrollableDistance;
      scrollYProgress.set(Math.min(Math.max(progress, 0), 1));
    };

    videoRef.current?.load();
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      videoRef.current.currentTime = latest * Math.max(videoRef.current.duration - 0.04, 0);
    }
  });

  const zoomScale = useTransform(scrollYProgress, [0, 0.45, 0.65], [1, reducedMotion ? 1 : 1.4, reducedMotion ? 1 : 2.5]);
  const videoPosition = useTransform(scrollYProgress, [0, 0.65], ['32% center', '50% center']);

  // Section 1: Hero
  const heroOpacity = useTransform(scrollYProgress, [0, 0.11, 0.18], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -60]);
  const heroVisibility = useTransform(heroOpacity, (v) => v > 0.05 ? "visible" : "hidden");

  // Section 2: Sequential Flow
  const section2Opacity = useTransform(scrollYProgress, [0.12, 0.15, 0.38, 0.45], [0, 1, 1, 0]);
  const section2Visibility = useTransform(section2Opacity, (v) => v > 0.01 ? "visible" : "hidden");

  const step1Opacity = useTransform(scrollYProgress, [0.14, 0.19], [0, 1]);
  const step1Y = useTransform(scrollYProgress, [0.14, 0.19], [40, 0]);

  const step2Opacity = useTransform(scrollYProgress, [0.21, 0.26], [0, 1]);
  const step2Y = useTransform(scrollYProgress, [0.21, 0.26], [40, 0]);

  const step3Opacity = useTransform(scrollYProgress, [0.28, 0.33], [0, 1]);
  const step3Y = useTransform(scrollYProgress, [0.28, 0.33], [40, 0]);

  const lineProgress = useTransform(scrollYProgress, [0.17, 0.31], [0, 1]);

  // Section 3: Finale
  const finaleOpacity = useTransform(scrollYProgress, [0.41, 0.45, 0.57, 0.61], [0, 1, 1, 0]);
  const finaleY = useTransform(scrollYProgress, [0.41, 0.47], [60, 0]);
  const finaleVisibility = useTransform(finaleOpacity, (v) => v > 0.05 ? "visible" : "hidden");

  // Section 4: Product Reveal
  const videoOpacity = useTransform(scrollYProgress, [0.59, 0.63], [0.9, 0]);
  const videoFilter = useTransform(
    scrollYProgress,
    [0.57, 0.59, 0.60, 0.61, 0.63],
    [
      'blur(0px) contrast(1) brightness(1) hue-rotate(0deg)',
      'blur(2px) contrast(1.5) brightness(1.2) hue-rotate(90deg)',
      'blur(8px) contrast(2) brightness(1.5) hue-rotate(-90deg)',
      'blur(4px) contrast(1.5) brightness(0.5) hue-rotate(180deg)',
      'blur(20px) contrast(1) brightness(0) hue-rotate(0deg)'
    ]
  );

  const productContainerY = useTransform(scrollYProgress, [0.63, 0.70, 0.82, 0.95], ['50vh', '0vh', '0vh', '-50vh']);
  const productOpacity = useTransform(scrollYProgress, [0.63, 0.67], [0, 1]);
  const productVisibility = useTransform(productOpacity, (v) => v > 0.01 ? "visible" : "hidden");

  const dashboardScale = useTransform(scrollYProgress, [0.64, 0.72], [0.85, 1]);
  const dashboardRotateX = useTransform(scrollYProgress, [0.64, 0.72], ['15deg', '0deg']);

  const intTitleOpacity = useTransform(scrollYProgress, [0.75, 0.80], [0, 1]);
  const intRow1Opacity = useTransform(scrollYProgress, [0.78, 0.83], [0, 1]);
  const intRow2Opacity = useTransform(scrollYProgress, [0.81, 0.86], [0, 1]);
  const intRow3Opacity = useTransform(scrollYProgress, [0.84, 0.89], [0, 1]);

  return (
    <main ref={containerRef} className="relative min-h-[700vh] bg-[#02040A] selection:bg-blue-500/30 text-white">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#02040A] overflow-hidden">
        <motion.video
          ref={videoRef}
          poster="/brand/lissa-landing-poster.jpg"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={event => {
            event.currentTarget.currentTime = scrollYProgress.get() * Math.max(event.currentTarget.duration - 0.04, 0);
          }}
          className="w-full h-full object-cover"
          style={{ scale: zoomScale, objectPosition: videoPosition, transformOrigin: 'center 30%', opacity: videoOpacity, filter: videoFilter }}
        >
          <source src="/brand/lissa-landing.webm" type="video/webm" />
          <source src="/brand/lissa-landing.mp4" type="video/mp4" />
        </motion.video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#02040A] via-[#02040A]/20 to-[#02040A]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#02040A_120%)]" />
      </div>

      {/* Fixed Content Overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none">

        {/* HERO CHAPTER */}
        <motion.section
          style={{ opacity: heroOpacity, y: heroY, visibility: heroVisibility as any }}
          className="absolute inset-0 flex flex-col justify-center md:justify-end p-6 md:p-12 lg:p-24 pb-24 md:pb-32"
        >
          <div className="flex flex-col lg:flex-row justify-between items-end gap-12 lg:gap-20 w-full max-w-[1400px] mx-auto">
             <div className="pointer-events-auto max-w-3xl w-full">
               <div className="flex flex-col mb-8 md:mb-12 relative">
                 <div className="flex items-center gap-4">
                   <div className="relative group">
                     <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                     <img src="/brand/lissa-logo.jpg" alt="" className="h-12 w-12 md:h-16 md:w-16 rounded-lg border border-white/10 object-cover relative z-10 shadow-2xl" />
                   </div>
                   <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-white/20 to-transparent" />
                   <img src="/brand/lissa-wordmark.png" alt="Lissa" className="h-5 md:h-7 w-auto object-contain opacity-90" />
                 </div>
               </div>
               
               <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-sans font-medium tracking-tighter text-white mb-6 leading-[0.95] [text-shadow:0_10px_30px_rgba(0,0,0,0.8)]">
                 The Intelligence <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-500 to-indigo-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                   Singularity.
                 </span>
               </h1>
               <p className="text-base md:text-lg text-white/50 font-mono max-w-xl leading-relaxed">
                 Advanced neural modeling and AI app creation.<br className="hidden md:block"/>
                 Exclusive access granted to verified LOS holders.
               </p>
             </div>

             <div className="pointer-events-auto w-full lg:w-[420px]">
               <WalletCTA
                 walletProps={walletProps}
                 onSignIn={onSignIn}
                 isSigningIn={isSigningIn}
                 signInError={signInError}
               />
             </div>
          </div>
        </motion.section>

        {/* HOW IT WORKS CHAPTER (Sequential Flow) */}
        <motion.section
          style={{ opacity: section2Opacity, visibility: section2Visibility as any }}
          className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
        >
          <div className="relative w-full max-w-4xl h-[65vh] md:h-[75vh] pointer-events-auto">
            {/* Background SVG for Electrical Flow */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
              <motion.path 
                d="M 80 15 C 80 40, 20 30, 20 50 C 20 70, 80 60, 80 85" 
                vectorEffect="non-scaling-stroke"
                fill="none" 
                stroke="rgba(96, 165, 250, 0.15)" 
                strokeWidth="1.5"
                strokeDasharray="2 4"
              />
              <motion.path 
                d="M 80 15 C 80 40, 20 30, 20 50 C 20 70, 80 60, 80 85" 
                vectorEffect="non-scaling-stroke"
                fill="none" 
                stroke="#3B82F6" 
                strokeWidth="2"
                style={{ pathLength: reducedMotion ? 1 : lineProgress }}
                className="drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]"
              />
            </svg>

            {/* 01 DESCRIBE (Upper Right) */}
            <motion.div 
              style={{ opacity: step1Opacity, y: reducedMotion ? 0 : step1Y }}
              className="absolute left-[80%] top-[15%] w-[16rem] sm:w-64 md:w-80 -translate-x-full pr-5 md:pr-8"
            >
              <div className="absolute right-[-4px] md:right-[-5px] top-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,1)] animate-[pulse-ring_2s_infinite_cubic-bezier(0.215,0.61,0.355,1)] -translate-y-1/2" />
              <div className="text-right -translate-y-[10px] md:-translate-y-[12px]">
                <div className="font-mono text-blue-400/80 text-[10px] md:text-xs tracking-[0.2em] mb-2 uppercase">01 // Describe</div>
                <h3 className="text-xl md:text-2xl font-medium font-sans tracking-tight mb-2 text-white uppercase [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">Describe</h3>
                <p className="text-white/60 font-mono text-xs md:text-sm leading-relaxed [text-shadow:0_4px_12px_rgba(0,0,0,0.9)]">Explain the product, interface, and interactions you want to create in natural language.</p>
              </div>
            </motion.div>

            {/* 02 BUILD (Center Left) */}
            <motion.div 
              style={{ opacity: step2Opacity, y: reducedMotion ? 0 : step2Y }}
              className="absolute left-[20%] top-[50%] w-[16rem] sm:w-64 md:w-80 pl-5 md:pl-8"
            >
              <div className="absolute left-[-4px] md:left-[-5px] top-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,1)] animate-[pulse-ring_2s_infinite_cubic-bezier(0.215,0.61,0.355,1)] -translate-y-1/2" />
              <div className="text-left -translate-y-[10px] md:-translate-y-[12px]">
                <div className="font-mono text-blue-400/80 text-[10px] md:text-xs tracking-[0.2em] mb-2 uppercase">02 // Build</div>
                <h3 className="text-xl md:text-2xl font-medium font-sans tracking-tight mb-2 text-white uppercase [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">Build</h3>
                <p className="text-white/60 font-mono text-xs md:text-sm leading-relaxed [text-shadow:0_4px_12px_rgba(0,0,0,0.9)]">Lissa plans the architecture, writes the source, and assembles a live browser workspace.</p>
              </div>
            </motion.div>

            {/* 03 REFINE (Lower Right) */}
            <motion.div 
              style={{ opacity: step3Opacity, y: reducedMotion ? 0 : step3Y }}
              className="absolute left-[80%] top-[85%] w-[16rem] sm:w-64 md:w-80 -translate-x-full pr-5 md:pr-8"
            >
              <div className="absolute right-[-4px] md:right-[-5px] top-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,1)] animate-[pulse-ring_2s_infinite_cubic-bezier(0.215,0.61,0.355,1)] -translate-y-1/2" />
              <div className="text-right -translate-y-[10px] md:-translate-y-[12px]">
                <div className="font-mono text-blue-400/80 text-[10px] md:text-xs tracking-[0.2em] mb-2 uppercase">03 // Refine</div>
                <h3 className="text-xl md:text-2xl font-medium font-sans tracking-tight mb-2 text-white uppercase [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">Refine</h3>
                <p className="text-white/60 font-mono text-xs md:text-sm leading-relaxed [text-shadow:0_4px_12px_rgba(0,0,0,0.9)]">Inspect the preview, edit the code, iterate with the agent, and publish when it is ready.</p>
              </div>
            </motion.div>

          </div>
        </motion.section>

        {/* FINALE CHAPTER */}
        <motion.section
          style={{ opacity: finaleOpacity, y: finaleY, visibility: finaleVisibility as any }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12"
        >
          <div className="text-center space-y-4 max-w-4xl pointer-events-auto w-full [text-shadow:0_10px_40px_rgba(0,0,0,1)]">
            <ScrollTypingText
              progress={scrollYProgress}
              start={0.42}
              end={0.47}
              text="Intelligence is no longer artificial."
              className="min-h-[1.1em] text-4xl md:text-6xl lg:text-[5rem] leading-[1.1] font-sans font-medium tracking-tighter text-white"
              reducedMotion={Boolean(reducedMotion)}
            />
            <ScrollTypingText
              progress={scrollYProgress}
              start={0.48}
              end={0.52}
              text="It is collaborative."
              className="min-h-[1.1em] text-4xl md:text-6xl lg:text-[5rem] leading-[1.1] font-sans font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 drop-shadow-[0_0_30px_rgba(96,165,250,0.3)]"
              reducedMotion={Boolean(reducedMotion)}
            />
            <ScrollTypingText
              progress={scrollYProgress}
              start={0.53}
              end={0.56}
              text="Step into the workspace"
              className="min-h-[1.2em] pt-10 md:pt-12 text-xs font-mono text-white uppercase tracking-[0.3em]"
              reducedMotion={Boolean(reducedMotion)}
            />
          </div>
        </motion.section>

        {/* PRODUCT REVEAL CHAPTER */}
        <motion.section
          style={{ 
            opacity: productOpacity, 
            y: productContainerY, 
            visibility: productVisibility as any 
          }}
          className="absolute inset-0 flex flex-col items-center pt-[12vh] px-2 sm:px-6 md:px-12 pointer-events-auto z-20"
        >
          {/* Intro Text */}
          <div className="text-center max-w-3xl mb-8 md:mb-12 shrink-0 px-4">
            <h2 className="text-3xl md:text-5xl font-sans font-medium tracking-tight text-white mb-4 [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">
              Production-grade architecture.
            </h2>
            <p className="text-white/60 font-mono text-sm md:text-base leading-relaxed">
              Lissa generates full-stack source code directly in your browser. Deploy instantly or eject to your preferred workflow.
            </p>
          </div>

          {/* Dashboard */}
          <motion.div
            style={{ 
              scale: dashboardScale, 
              rotateX: dashboardRotateX, 
              transformPerspective: 1200
            }}
            className="w-full max-w-[1400px] h-[65vh] md:h-[75vh] shrink-0 bg-[#02040a] rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(5,11,224,0.15)] overflow-hidden flex flex-col relative"
          >
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
          </motion.div>

          {/* Integrations */}
          <div className="w-full max-w-[1200px] shrink-0 mt-24 md:mt-32 pb-32 px-4">
             <motion.div style={{ opacity: intTitleOpacity }} className="text-center mb-12">
                <h3 className="text-2xl md:text-3xl font-sans font-medium text-white mb-4">Plug into your workflow</h3>
                <div className="h-[2px] w-12 bg-gradient-to-r from-blue-400 to-indigo-600 mx-auto rounded-full" />
             </motion.div>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {INTEGRATIONS.map((item, i) => {
                  const rowOpacity = i < 3 ? intRow1Opacity : i < 6 ? intRow2Opacity : intRow3Opacity;
                  return (
                    <motion.div
                      key={item.id}
                      style={{ opacity: rowOpacity }}
                      className="flex items-center gap-4 p-4 md:p-5 bg-[#05070e] hover:bg-[#0a0d16] border border-white/5 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-xl transition-all duration-300 group cursor-default"
                    >
                      <div className="w-12 h-12 shrink-0 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                         <IntegrationIcon item={item} />
                      </div>
                      <div>
                         <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{item.name}</div>
                         <div className="text-[11px] md:text-xs font-mono text-neutral-500 mt-1">{item.label}</div>
                      </div>
                    </motion.div>
                  );
                })}
             </div>
          </div>
        </motion.section>

      </div>
    </main>
  );
}
`;
fs.writeFileSync('artifacts/ai-studio-applet/src/components/access-gate.tsx', content);
