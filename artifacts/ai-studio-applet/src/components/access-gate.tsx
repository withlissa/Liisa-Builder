import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Loader2, Network, RefreshCw, ShieldCheck, Wallet, Hexagon, ChevronRight, Fingerprint, Lock, ShieldAlert, Cpu, Bot, Layout, Code2, Database, Table2, FileArchive, Box, PlugZap, Github, Send, Book } from 'lucide-react';
import { formatUnits } from 'viem';
import { robinhoodChain } from '@/lib/web3';
import { motion, useTransform, useMotionValue, useMotionValueEvent, useReducedMotion, type MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

const INTEGRATIONS = [
  { id: 'github', name: 'GitHub', label: 'Sync repositories', url: 'https://cdn.simpleicons.org/github/ffffff' },
  { id: 'bitbucket', name: 'Bitbucket', label: 'Source control', url: 'https://cdn.simpleicons.org/bitbucket/2684FF' },
  { id: 'figma', name: 'Figma', label: 'Design to code', url: 'https://cdn.simpleicons.org/figma/F24E1E' },
  { id: 'bolt', name: 'Bolt', label: 'Import prototypes', url: '/brand/integrations/bolt.png', fallback: PlugZap },
  { id: 'base44', name: 'Base44', label: 'Migrate applications', url: '/brand/integrations/base44.png', fallback: Database },
  { id: 'vercel', name: 'Vercel', label: 'Import deployments', url: 'https://cdn.simpleicons.org/vercel/ffffff' },
  { id: 'data', name: 'Spreadsheet', label: 'Structured data import', fallback: Table2 },
  { id: 'zip', name: 'ZIP Archive', label: 'Import project archives', fallback: FileArchive },
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

const SOCIAL_LINKS = [
  { name: 'X', href: 'https://x.com/lissabuilder', icon: null },
  { name: 'Telegram', href: 'https://t.me/lissaontelegram', icon: Send },
  { name: 'GitHub', href: 'https://github.com/withlissa', icon: Github },
];

const FOOTER_LINKS = [
  {
    title: 'Create',
    items: [
      { label: 'AI agent', href: '/docs/prompting' },
      { label: 'Live preview', href: '/docs/live-preview' },
      { label: 'Browser IDE', href: '/docs/editor-terminal' },
    ],
  },
  {
    title: 'Connect',
    items: [
      { label: 'Repositories', href: '/docs/repository-sync' },
      { label: 'Design sources', href: '/docs/prompting' },
      { label: 'Data imports', href: '/docs/data-tools' },
    ],
  },
  {
    title: 'Ship',
    items: [
      { label: 'Persistent projects', href: '/docs/repository-sync' },
      { label: 'Source export', href: '/docs/repository-sync' },
      { label: 'Deployment', href: '/docs/deployments' },
    ],
  },
];

function SocialPill() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <nav
      aria-label="Lissa social media"
      onMouseLeave={() => setActiveIndex(null)}
      className="fixed left-4 top-4 md:left-6 md:top-6 z-50 pointer-events-auto rounded-full border border-white/15 bg-[#02040A]/65 p-1 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
    >
      <div className="relative flex items-center gap-1">
        <motion.div
          aria-hidden="true"
          animate={{
            opacity: activeIndex === null ? 0 : 1,
            x: activeIndex === null ? 0 : activeIndex * 36,
            scale: activeIndex === null ? 0.8 : 1,
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.7 }}
          className="absolute left-0 top-0 h-8 w-8 rounded-full bg-white shadow-[0_6px_16px_rgba(255,255,255,0.18)]"
        />

        {SOCIAL_LINKS.map((social, index) => {
          const Icon = social.icon;
          const isActive = activeIndex === index;

          return (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              aria-label={social.name}
              title={social.name}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                isActive ? 'text-[#050BE0]' : 'text-white/65 hover:text-white'
              )}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : <span aria-hidden="true">X</span>}
            </a>
          );
        })}
      </div>
    </nav>
  );
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
    lissaBalance, minimumLissaBalance, lissaDecimals,
    hasLissaAccess, isTokenDataLoading, tokenReadError,
  } = walletProps;

  const isCorrectChain = chainId === robinhoodChain.id;
  const decimals = Number(lissaDecimals ?? 18);
  const symbol = 'LISSA';
  const held = lissaBalance === undefined ? '---' : Number(formatUnits(lissaBalance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  const required = minimumLissaBalance === undefined ? '1,000,000' : Number(formatUnits(minimumLissaBalance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const changeWallet = () => {
    disconnect();
    window.setTimeout(() => open({ view: 'Connect' }), 250);
  };

  return (
    <div className={cn("relative p-6 sm:p-8 bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xl shadow-black/5 group", className)}>
      <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-slate-200/0 via-slate-300/50 to-slate-200/0" />
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-slate-200/0 via-slate-300/50 to-slate-200/0" />

      <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-[scanline_4s_linear_infinite]" />

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-[pulse-ring_2s_infinite_cubic-bezier(0.215,0.61,0.355,1)]" />
          <span className="text-[10px] font-mono tracking-[0.25em] text-blue-700 font-semibold uppercase">System Auth</span>
        </div>
        <Fingerprint className="w-4 h-4 text-slate-300" />
      </div>

      <div className="space-y-4 font-mono text-sm mb-8 relative z-10">
        <div className="flex justify-between items-end border-b border-slate-100 pb-2 transition-colors">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Required</span>
          <span className="text-slate-900 font-bold">{required} {symbol}</span>
        </div>

        <div className="flex justify-between items-end border-b border-slate-100 pb-2 transition-colors">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Balance</span>
          {isConnected && isCorrectChain && !isTokenDataLoading ? (
            <span className={cn(
              "font-bold",
              hasLissaAccess ? "text-blue-600" : "text-red-600"
            )}>{held} {symbol}</span>
          ) : (
            <span className="text-slate-300 font-medium">---</span>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {!isConnected ? (
          <button type="button" onClick={() => open({ view: 'Connect' })} className="w-full relative group/btn overflow-hidden bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 h-12 flex items-center justify-between px-4 font-mono text-xs font-bold uppercase tracking-widest transition-all rounded-lg">
            <div className="absolute inset-0 w-0 bg-blue-50 group-hover/btn:w-full transition-all duration-500 ease-out" />
            <span className="relative flex items-center gap-3"><Wallet className="w-4 h-4 text-slate-400 group-hover/btn:text-blue-600 transition-colors" /> Initialize Link</span>
            <ChevronRight className="w-4 h-4 relative text-slate-300 group-hover/btn:text-blue-600 group-hover/btn:translate-x-1 transition-all" />
          </button>
        ) : !isCorrectChain ? (
          <button type="button" onClick={() => switchChain({ chainId: robinhoodChain.id })} disabled={isSwitching} className="w-full relative group/btn overflow-hidden bg-blue-600 hover:bg-blue-700 text-white h-12 flex items-center justify-between px-4 font-mono text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 rounded-lg">
            <span className="relative flex items-center gap-3"><Network className="w-4 h-4" /> {isSwitching ? 'Switching...' : 'Switch Network'}</span>
            <ChevronRight className="w-4 h-4 relative group-hover/btn:translate-x-1 transition-transform" />
          </button>
        ) : isTokenDataLoading ? (
          <div className="w-full bg-slate-50 border border-slate-200 text-slate-500 h-12 flex items-center justify-center gap-3 font-mono text-xs font-bold uppercase tracking-widest rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Verifying...
          </div>
        ) : hasLissaAccess ? (
          <button type="button" onClick={onSignIn} disabled={isSigningIn} className="w-full relative group/btn overflow-hidden bg-blue-600 hover:bg-blue-700 text-white h-12 flex items-center justify-between px-4 font-mono text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] rounded-lg">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite_linear]" />
            <span className="relative flex items-center gap-3">
              {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {isSigningIn ? 'Authenticating...' : 'Enter App'}
            </span>
            <ChevronRight className="w-4 h-4 relative group-hover/btn:translate-x-1 transition-transform" />
          </button>
        ) : (
          <div className="w-full bg-red-50 border border-red-100 text-red-600 p-4 flex items-start gap-3 text-xs font-mono rounded-lg">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span className="leading-relaxed font-medium">
              {tokenReadError ? 'Verification failed. Check network.' : `Access denied. ${shortAddress} lacks minimum holding.`}
            </span>
          </div>
        )}

        {isConnected && (
          <button type="button" onClick={changeWallet} className="w-full flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest font-semibold pt-2">
            <RefreshCw className="w-3 h-3" /> Change Wallet
          </button>
        )}

        {signInError && (
          <div className="text-red-500 text-[10px] font-mono font-medium text-center mt-2 animate-in fade-in">
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
  const part1 = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const part2 = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

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

  useMotionValueEvent(part1, "change", (latest) => {
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      videoRef.current.currentTime = latest * Math.max(videoRef.current.duration - 0.04, 0);
    }
  });

  const zoomScale = useTransform(part1, [0, 0.45, 0.65], [1, reducedMotion ? 1 : 1.4, reducedMotion ? 1 : 2.5]);
  const videoPosition = useTransform(part1, [0, 0.65], ['32% center', '50% center']);

  // Section 1: Hero
  const heroOpacity = useTransform(part1, [0, 0.11, 0.18], [1, 1, 0]);
  const heroY = useTransform(part1, [0, 0.18], [0, -60]);
  const heroVisibility = useTransform(heroOpacity, (v) => v > 0.05 ? "visible" : "hidden");

  // Section 2: Sequential Flow
  const section2Opacity = useTransform(part1, [0.12, 0.15, 0.38, 0.45], [0, 1, 1, 0]);
  const section2Visibility = useTransform(section2Opacity, (v) => v > 0.01 ? "visible" : "hidden");

  const step1Opacity = useTransform(part1, [0.14, 0.19], [0, 1]);
  const step1Y = useTransform(part1, [0.14, 0.19], [40, 0]);

  const step2Opacity = useTransform(part1, [0.21, 0.26], [0, 1]);
  const step2Y = useTransform(part1, [0.21, 0.26], [40, 0]);

  const step3Opacity = useTransform(part1, [0.28, 0.33], [0, 1]);
  const step3Y = useTransform(part1, [0.28, 0.33], [40, 0]);

  const lineProgress = useTransform(part1, [0.17, 0.31], [0, 1]);

  // Section 3: Finale
  const finaleOpacity = useTransform(part1, [0.41, 0.45, 0.57, 0.61], [0, 1, 1, 0]);
  const finaleY = useTransform(part1, [0.41, 0.47], [60, 0]);
  const finaleVisibility = useTransform(finaleOpacity, (v) => v > 0.05 ? "visible" : "hidden");

  // Section 4: Product Reveal
  const videoOpacity = useTransform(part1, [0.59, 0.63], [0.9, 0]);
  const videoFilter = useTransform(
    part1,
    [0.57, 0.59, 0.60, 0.61, 0.63],
    [
      'blur(0px) contrast(1) brightness(1) hue-rotate(0deg)',
      'blur(2px) contrast(1.5) brightness(1.2) hue-rotate(90deg)',
      'blur(8px) contrast(2) brightness(1.5) hue-rotate(-90deg)',
      'blur(4px) contrast(1.5) brightness(0.5) hue-rotate(180deg)',
      'blur(20px) contrast(1) brightness(0) hue-rotate(0deg)'
    ]
  );
  const glitchOpacity = useTransform(
    part1,
    [0.57, 0.585, 0.6, 0.615, 0.63],
    [0, 0.75, 0.18, 0.9, 0]
  );
  const glitchX = useTransform(
    part1,
    [0.57, 0.585, 0.6, 0.615, 0.63],
    ['0%', '3%', '-2%', '4%', '0%']
  );
  const blackoutOpacity = useTransform(part1, [0.59, 0.64, 0.67], [0, 1, 1]);

  const productContainerY = useTransform(
    part1,
    [0.63, 0.70, 0.80, 0.95, 1],
    ['50vh', '0vh', '0vh', '-78vh', '-120vh']
  );
  const productOpacity = useTransform(part1, [0.63, 0.67], [0, 1]);
  const productVisibility = useTransform(productOpacity, (v) => v > 0.01 ? "visible" : "hidden");

  const dashboardScale = useTransform(part1, [0.64, 0.72], [0.85, 1]);
  const dashboardRotateX = useTransform(part1, [0.64, 0.72], ['15deg', '0deg']);

  const intTitleOpacity = useTransform(part1, [0.75, 0.80], [0, 1]);
  const intRow1Opacity = useTransform(part1, [0.78, 0.83], [0, 1]);
  const intRow2Opacity = useTransform(part1, [0.81, 0.86], [0, 1]);
  const intRow3Opacity = useTransform(part1, [0.84, 0.89], [0, 1]);
  const intRow1Y = useTransform(part1, [0.78, 0.83], [36, 0]);
  const intRow2Y = useTransform(part1, [0.81, 0.86], [36, 0]);
  const intRow3Y = useTransform(part1, [0.84, 0.89], [36, 0]);


  // NEW PART 2 LOGIC
  const part2Y = useTransform(part1, [0.96, 1], ['100vh', '0vh']);

  const cardY = useTransform(part2, [0.0, 0.2, 0.4, 0.6], ['100vh', '15vh', '15vh', '-100vh']);
  const cardOpacity = useTransform(part2, [0.05, 0.15, 0.4, 0.5], [0, 1, 1, 0]);
  const cardScale = useTransform(part2, [0.05, 0.15], [0.8, 1]);
  const cardGlitch = useTransform(part2, [0.05, 0.08, 0.11, 0.13, 0.15], [
    'none',
    'contrast(200%) brightness(150%) hue-rotate(90deg)',
    'contrast(100%) brightness(50%) blur(4px) invert(100%)',
    'contrast(150%) brightness(120%) hue-rotate(-90deg)',
    'none'
  ]);
  const cardX = useTransform(part2, [0.05, 0.08, 0.11, 0.13, 0.15], ['0px', '-20px', '15px', '-10px', '0px']);

  const faqY = useTransform(part2, [0.3, 0.5, 0.7, 0.9], ['100vh', '20vh', '20vh', '-100vh']);
  const faqOpacity = useTransform(part2, [0.3, 0.4, 0.7, 0.8], [0, 1, 1, 0]);
  const faqColor = useTransform(part2, [0.3, 0.6], ['rgba(255,255,255,0.4)', 'rgba(96,165,250,1)']);

  const footerY = useTransform(part2, [0.7, 0.9], ['50vh', '0vh']);
  const footerOpacity = useTransform(part2, [0.7, 0.9], [0, 1]);
  const footerShadow = useTransform(part2, [0.8, 1], ['0 0 0px rgba(59,130,246,0)', '0 0 100px rgba(59,130,246,0.5)']);
  const part2BgScale = useTransform(part2, [0, 1], [1, 1.3]);
  const part2BgY = useTransform(part2, [0, 1], ['0%', '10%']);

  const scrollToLandingProgress = (progress: number) => {
    const container = containerRef.current;
    if (!container) return;
    const scrollableDistance = Math.max(container.offsetHeight - window.innerHeight, 1);
    window.scrollTo({
      top: container.offsetTop + (scrollableDistance * progress),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <main ref={containerRef} className="relative min-h-[1400vh] bg-[#02040A] selection:bg-blue-500/30 text-white">
      <SocialPill />

      <nav aria-label="Documentation" className="fixed right-4 top-4 md:right-6 md:top-6 z-50 pointer-events-auto rounded-full border border-white/15 bg-[#02040A]/65 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
        <Link href="/docs" className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold text-white/70 hover:text-[#050BE0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-full">
          <Book className="w-3.5 h-3.5" />
          <span>Docs</span>
        </Link>
      </nav>

      {/* Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#02040A] overflow-hidden">
        <motion.video
          ref={videoRef}
          poster="/brand/lissa-landing-poster.jpg"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={event => {
            event.currentTarget.currentTime = part1.get() * Math.max(event.currentTarget.duration - 0.04, 0);
          }}
          className="w-full h-full object-cover"
          style={{ scale: zoomScale, objectPosition: videoPosition, transformOrigin: 'center 30%', opacity: videoOpacity, filter: videoFilter }}
        >
          <source src="/brand/lissa-landing.webm" type="video/webm" />
          <source src="/brand/lissa-landing.mp4" type="video/mp4" />
        </motion.video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#02040A] via-[#02040A]/20 to-[#02040A]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#02040A_120%)]" />
        <motion.div
          aria-hidden="true"
          style={{ opacity: glitchOpacity, x: glitchX }}
          className="absolute inset-0 overflow-hidden mix-blend-screen"
        >
          <div className="absolute left-[-5%] right-[-5%] top-[18%] h-[2px] bg-blue-200/80 shadow-[0_0_18px_rgba(96,165,250,0.95)]" />
          <div className="absolute left-[-8%] right-[-8%] top-[39%] h-4 bg-blue-500/15 backdrop-invert" />
          <div className="absolute left-[-6%] right-[-6%] top-[62%] h-[1px] bg-white/75 shadow-[0_0_12px_rgba(255,255,255,0.85)]" />
          <div className="absolute left-[-10%] right-[-10%] top-[78%] h-7 bg-indigo-500/10 backdrop-contrast-200" />
        </motion.div>
        <motion.div
          aria-hidden="true"
          style={{ opacity: blackoutOpacity }}
          className="absolute inset-0 bg-[#02040A]"
        />
      </div>

      {/* Fixed Content Overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none">

        <svg width="0" height="0" className="fixed pointer-events-none">
          <defs>
            <clipPath id="lissa-dome" clipPathUnits="objectBoundingBox">
              <path d="M 0,0.1 Q 0.5,0 1,0.1 L 1,1 L 0,1 Z" />
            </clipPath>
          </defs>
        </svg>


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
                  <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.18)]">
                   Singularity.
                 </span>
               </h1>
               <p className="text-base md:text-lg text-white/50 font-mono max-w-xl leading-relaxed">
                 Advanced neural modeling and AI app creation.<br className="hidden md:block"/>
                 Exclusive access granted to verified LISSA holders.
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
                stroke="#60A5FA"
                strokeWidth="2"
                strokeDasharray="6 10"
                style={{ pathLength: reducedMotion ? 1 : lineProgress }}
                className="lissa-electric-flow drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]"
              />
            </svg>

            {/* 01 DESCRIBE (Upper Right) */}
            <motion.div
              style={{ opacity: step1Opacity, y: reducedMotion ? 0 : step1Y }}
              className="absolute left-[80%] top-[15%] w-[16rem] sm:w-64 md:w-80 -translate-x-full pr-5 md:pr-8"
            >
              <div className="absolute right-[-4px] md:right-[-5px] top-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,1)] animate-[pulse-ring_2s_infinite_cubic-bezier(0.215,0.61,0.355,1)] -translate-y-1/2" />
              <div className="text-right -translate-y-[10px] md:-translate-y-[12px]">
                 <div className="font-mono text-blue-400/80 text-[10px] md:text-xs tracking-[0.2em] mb-2 uppercase">01 //</div>
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
                 <div className="font-mono text-blue-400/80 text-[10px] md:text-xs tracking-[0.2em] mb-2 uppercase">02 //</div>
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
                 <div className="font-mono text-blue-400/80 text-[10px] md:text-xs tracking-[0.2em] mb-2 uppercase">03 //</div>
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
              progress={part1}
              start={0.42}
              end={0.47}
              text="Intelligence is no longer artificial."
              className="min-h-[1.1em] text-4xl md:text-6xl lg:text-[5rem] leading-[1.1] font-sans font-medium tracking-tighter text-white"
              reducedMotion={Boolean(reducedMotion)}
            />
            <ScrollTypingText
              progress={part1}
              start={0.48}
              end={0.52}
              text="It is collaborative."
              className="min-h-[1.1em] text-4xl md:text-6xl lg:text-[5rem] leading-[1.1] font-sans font-bold tracking-tighter text-white"
              reducedMotion={Boolean(reducedMotion)}
            />
            <ScrollTypingText
              progress={part1}
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

                 <div className="flex flex-col gap-4 flex-1 justify-end pb-2 text-xs">
                   <div className="bg-[#0a0d16] border border-white/5 rounded-2xl rounded-tl-sm p-3 w-[90%] space-y-2 relative overflow-hidden group">
                     <p className="text-white/70 leading-relaxed">I've scaffolded the dashboard layout based on your spec. How does this look?</p>
                     <div className="bg-[#080a11] rounded p-2 flex items-center justify-between border border-white/5">
                       <div className="flex items-center gap-2">
                         <Code2 className="w-3 h-3 text-[#050BE0]" />
                         <span className="text-white/50 text-[10px] font-mono">app/page.tsx</span>
                       </div>
                       <span className="text-[#050BE0] text-[10px] font-medium">View Diff</span>
                     </div>
                   </div>
                   <div className="bg-[#050BE0] rounded-2xl rounded-tr-sm p-3 w-[85%] self-end shadow-[0_0_15px_rgba(5,11,224,0.3)]">
                     <p className="text-white/90 leading-relaxed">Perfect. Let's add a metrics chart to the main area for daily volume.</p>
                   </div>
                   <div className="bg-[#0a0d16] border border-[#050BE0]/30 rounded-2xl rounded-tl-sm p-3 w-[90%] space-y-2 relative overflow-hidden shadow-[0_0_10px_rgba(5,11,224,0.1)]">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
                     <p className="text-white flex items-center gap-2 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#050BE0]" /> Generating chart...
                     </p>
                   </div>
                 </div>

                 <div className="w-full h-12 bg-[#080a11] border border-white/10 rounded-xl flex items-center px-3 gap-2 mt-2">
                    <div className="w-4 h-4 rounded-full bg-white/10" />
                    <span className="text-white/30 text-xs font-medium">Message Lissa...</span>
                 </div>
               </div>

               {/* Right Preview Surface Mock */}
               <div className="flex-1 p-3 md:p-6 bg-[#030408] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                  <div className="w-full h-full bg-white rounded-md md:rounded-lg shadow-2xl overflow-hidden relative border border-white/10 flex flex-col">
                     {/* Web App UI Mock */}
                     <div className="h-12 border-b border-neutral-200 flex items-center px-4 md:px-6 justify-between bg-white shrink-0 shadow-sm z-10 relative">
                       <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-md bg-[#050BE0] flex items-center justify-center">
                           <Layout className="w-3 h-3 text-white" />
                         </div>
                         <span className="font-sans font-semibold text-sm text-slate-800">Nexus CRM</span>
                       </div>
                       <div className="hidden md:flex gap-6 items-center text-xs font-medium text-slate-500">
                         <span className="text-[#050BE0]">Dashboard</span>
                         <span className="hover:text-slate-800 cursor-default">Customers</span>
                         <span className="hover:text-slate-800 cursor-default">Analytics</span>
                         <span className="hover:text-slate-800 cursor-default">Settings</span>
                       </div>
                       <div className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium flex items-center justify-center shadow-sm cursor-default transition-colors">
                         New Report
                       </div>
                     </div>
                     <div className="flex-1 bg-slate-50/50 p-4 md:p-8 flex flex-col md:flex-row gap-6 relative">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />

                       <div className="w-full md:w-64 shrink-0 flex flex-col gap-4 relative z-10">
                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                           <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Revenue</div>
                           <div className="text-3xl font-bold text-slate-900">$124,500</div>
                           <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                             <div className="px-1.5 py-0.5 rounded bg-emerald-100">+14.2%</div>
                             <span className="text-slate-500">vs last month</span>
                           </div>
                         </div>
                         <div className="hidden md:flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                           <div className="p-4 text-xs font-medium text-slate-500 border-b border-slate-100 uppercase tracking-wider">Recent Activity</div>
                           <div className="divide-y divide-slate-100">
                             {[
                               { action: "New subscription", user: "Alice M.", time: "2m ago" },
                               { action: "Plan upgrade", user: "Acme Corp", time: "1h ago" },
                               { action: "Ticket closed", user: "Bob T.", time: "3h ago" },
                             ].map((item, i) => (
                               <div key={i} className="p-4 flex flex-col gap-1 hover:bg-slate-50 transition-colors">
                                 <div className="text-sm font-medium text-slate-900">{item.action}</div>
                                 <div className="flex items-center justify-between text-xs text-slate-500">
                                   <span>{item.user}</span>
                                   <span>{item.time}</span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       </div>

                       <div className="flex-1 flex flex-col gap-6 relative z-10">
                         <div className="h-64 w-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-5 relative overflow-hidden">
                            <div className="text-sm font-medium text-slate-900 mb-4 flex items-center justify-between">
                              Daily Volume Overview
                              <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] text-blue-500 font-medium">Live</span>
                              </div>
                            </div>
                            <div className="flex-1 flex items-end gap-2 px-2 relative z-10">
                               {[40, 60, 45, 80, 50, 75, 90, 65, 55, 85, 40, 70].map((h, i) => (
                                 <div key={i} className="flex-1 bg-blue-50 rounded-t-sm relative group overflow-hidden">
                                    <div
                                      className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-t-sm"
                                      style={{ height: `${h}%`, animation: `growUp 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
                                    />
                                 </div>
                               ))}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent w-1/2 animate-[shimmer_3s_infinite]" />
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {[
                             { label: "Active Users", val: "2,845" },
                             { label: "Conversion", val: "4.8%" },
                             { label: "Bounce Rate", val: "1.2%" },
                           ].map((stat, i) => (
                             <div key={i} className={cn("bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-1 hover:border-blue-200 transition-colors cursor-default", i === 2 ? "hidden md:block" : "")}>
                                <div className="text-xs font-medium text-slate-500">{stat.label}</div>
                                <div className="text-lg font-bold text-slate-900">{stat.val}</div>
                             </div>
                           ))}
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

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {INTEGRATIONS.map((item, i) => {
                  const rowOpacity = i < 3 ? intRow1Opacity : i < 6 ? intRow2Opacity : intRow3Opacity;
                   const rowY = i < 3 ? intRow1Y : i < 6 ? intRow2Y : intRow3Y;
                  return (
                    <motion.div
                      key={item.id}
                       style={{ opacity: rowOpacity, y: reducedMotion ? 0 : rowY }}
                       className="min-w-0 flex items-center gap-3 p-3 md:gap-4 md:p-5 bg-[#05070e] hover:bg-[#0a0d16] border border-white/5 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-xl transition-all duration-300 group cursor-default"
                    >
                       <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                         <IntegrationIcon item={item} />
                      </div>
                       <div className="min-w-0">
                         <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{item.name}</div>
                         <div className="text-[11px] md:text-xs font-mono text-neutral-500 mt-1">{item.label}</div>
                      </div>
                    </motion.div>
                  );
                })}
             </div>
          </div>
        </motion.section>


        {/* PART 2: THE DESTINATION */}
        <motion.section
          style={{
            y: part2Y,
            clipPath: 'url(#lissa-dome)'
          }}
          className="fixed inset-0 z-30 pointer-events-none overflow-hidden bg-[#02040A]"
        >
          {/* Glowing Dome Border */}
          <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[10vh] text-white z-10">
            <path d="M 0,10 Q 50,0 100,10" fill="none" stroke="currentColor" strokeWidth="0.14" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Anime Background */}
          <motion.div
            style={{ scale: part2BgScale, y: part2BgY }}
            className="absolute inset-0 z-0 origin-top"
          >
            <img src="/brand/anime-bg.png" alt="" className="w-full h-full object-cover" />
          </motion.div>

          {/* COMMUNITY INVITATION CARD */}
          <motion.div
            style={{ y: cardY, opacity: cardOpacity, scale: cardScale, filter: cardGlitch, x: cardX }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl aspect-auto md:aspect-[3/1] bg-white border border-blue-900/10 rounded-2xl flex flex-col md:flex-row items-center justify-between p-8 md:p-12 overflow-hidden group pointer-events-auto shadow-[0_24px_80px_rgba(18,28,94,0.22)]"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[#050BE0]" />

            <div className="flex flex-col items-start gap-4 z-10 w-full md:w-1/2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#050BE0] animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#050BE0]/70 uppercase">Community signal open</span>
              </div>
              <h3 className="text-3xl md:text-5xl font-sans font-medium text-[#07114C] tracking-tighter">
                Join the LISSA community.
              </h3>
              <p className="text-[#07114C]/60 font-mono text-xs md:text-sm leading-relaxed mt-2">
                Build alongside token holders, exchange ideas, and help shape the next generation of collaborative intelligence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 z-10 w-full md:w-auto mt-8 md:mt-0">
              <button
                type="button"
                onClick={() => scrollToLandingProgress(0)}
                className="px-6 py-4 bg-[#050BE0] hover:bg-[#07114C] text-white font-mono text-xs uppercase tracking-widest rounded transition-colors text-center"
              >
                Access Studio
              </button>
              <button
                type="button"
                onClick={() => scrollToLandingProgress(0.76)}
                className="px-6 py-4 bg-[#F1F3FF] hover:bg-[#E4E7FF] border border-[#050BE0]/15 text-[#07114C] font-mono text-xs uppercase tracking-widest rounded transition-colors text-center"
              >
                Explore FAQ
              </button>
            </div>
          </motion.div>

          {/* ASYMMETRIC FAQ */}
          <motion.div
            style={{ y: faqY, opacity: faqOpacity }}
            className="absolute top-0 left-0 w-full flex pointer-events-auto"
          >
            <div className="w-[94%] md:w-[92%] lg:w-[88%] bg-white border-t border-r border-b border-blue-900/10 rounded-r-[2rem] md:rounded-r-[4rem] p-6 sm:p-8 md:p-16 relative overflow-hidden shadow-[20px_24px_70px_rgba(18,28,94,0.2)]">
              <motion.div
                style={{ backgroundColor: faqColor }}
                className="absolute top-0 left-0 w-1.5 md:w-2 h-full shadow-[0_0_20px_currentColor]"
              />
              <div className="mb-8 md:mb-12 max-w-2xl">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#050BE0]/60">Knowledge base</span>
                <h3 className="mt-3 text-3xl md:text-5xl font-sans font-medium tracking-tight text-[#07114C]">Frequently asked questions</h3>
                <p className="mt-4 text-sm md:text-base text-[#07114C]/55">Everything you need to understand access, ownership, generation, and deployment inside LISSA.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-x-10 gap-y-3">
                {[
                  { q: "What is LISSA?", a: "An autonomous agentic builder designed exclusively for token holders. It translates natural language into production-ready architectures." },
                  { q: "How does holder access work?", a: "Connect a wallet on Robinhood Chain, verify the required LISSA balance, then sign a gasless authentication message." },
                  { q: "What can LISSA build?", a: "LISSA can generate focused interfaces and complete full-stack applications from natural-language instructions." },
                  { q: "Can I refine a generated project?", a: "Yes. Continue the agent conversation, edit files directly, use the terminal, and inspect every change in the live preview." },
                  { q: "Can I import an existing project?", a: "Projects can begin from repositories, design sources, deployment platforms, spreadsheets, ZIP archives, or an empty workspace." },
                  { q: "Can I export my code?", a: "Yes. Every generated file remains available to inspect, edit, download, connect to a repository, and deploy." },
                  { q: "Are failed builds charged?", a: "Build jobs are persisted and failed generation attempts are refunded so an interrupted job does not consume a credit." },
                  { q: "Where does the project run?", a: "The workspace runs in an isolated browser IDE with files, terminal access, live preview, and persistent project sessions." }
                ].map((item, i) => (
                  <details key={i} className="group cursor-pointer border-b border-[#07114C]/10 py-4 md:py-5">
                    <summary className="text-sm md:text-base font-mono text-[#07114C]/80 list-none [&::-webkit-details-marker]:hidden flex justify-between items-center gap-4 group-hover:text-[#050BE0] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#050BE0]/30">
                      {item.q}
                      <span className="text-[#050BE0]/50 group-open:rotate-45 transition-transform duration-300 font-sans text-xl">+</span>
                    </summary>
                    <p className="mt-4 pr-8 text-[#07114C]/55 font-sans text-xs md:text-sm leading-relaxed max-w-2xl">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </motion.div>

          {/* DISTINCT FOOTER */}
          <motion.footer
            style={{ y: footerY, opacity: footerOpacity }}
            className="absolute bottom-0 left-0 w-full h-[80vh] md:h-[64vh] flex flex-col justify-end pointer-events-auto"
          >
            <div className="w-full min-h-full relative overflow-hidden px-6 md:px-12 pt-10 pb-8 flex flex-col bg-white border-t border-[#050BE0]/15">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(5,11,224,0.24),transparent_58%)] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#050BE0]/60 to-transparent" />

              <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 text-[#07114C]">
                <div className="col-span-2 md:col-span-2 max-w-md">
                  <Link href="/" aria-label="LISSA home" className="mb-5 inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#050BE0]/40">
                    <img src="/brand/lissa-wordmark.png" alt="Lissa" className="h-6 w-auto object-contain brightness-0" />
                  </Link>
                  <p className="text-sm leading-relaxed text-[#07114C]/55">
                    Collaborative intelligence for builders who want to move from an idea to working software without leaving the browser.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#050BE0]/15 bg-[#F1F3FF] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#050BE0]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#050BE0]" />
                    Robinhood Chain active
                  </div>
                </div>
                {FOOTER_LINKS.map(column => (
                  <div key={column.title}>
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#050BE0]/60">{column.title}</h4>
                    <ul className="mt-4 space-y-3 text-xs md:text-sm text-[#07114C]/55">
                      {column.items.map(item => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className="inline-flex rounded-sm transition-colors hover:text-[#050BE0] focus-visible:text-[#050BE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#050BE0]/30"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <motion.div
                style={{ textShadow: footerShadow }}
                className="mt-auto text-center text-[18vw] font-sans font-bold text-[#050BE0]/10 tracking-tighter leading-[0.7] select-none z-0 pt-8"
              >
                LISSA
              </motion.div>

              <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 font-mono text-[9px] md:text-[10px] text-[#07114C]/50 uppercase tracking-widest border-t border-[#050BE0]/15 pt-5">
                <span>© 2026 LISSA SYSTEM</span>
                <div className="flex gap-6 text-[#050BE0]/65">
                   <Link href="/docs/wallet-access" className="transition-colors hover:text-[#050BE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#050BE0]/30">Robinhood Chain</Link>
                   <Link href="/docs/overview" className="transition-colors hover:text-[#050BE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#050BE0]/30">AI-native workspace</Link>
                </div>
              </div>
            </div>
          </motion.footer>

        </motion.section>

      </div>
    </main>
  );
}
