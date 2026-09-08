import { Project } from "./types";

export const initialProjects: Project[] = [
  {
    id: "boomerang",
    title: "Boomerang",
    slug: "boomerang",
    subtitle: "Build lasting relationships.",
    description: "Conversational AI platform for modern financial institutions — agents that handle the full borrower lifecycle across email, SMS, and voice.",
    category: "Fintech & AI",
    tags: ["Conversational AI", "Fintech", "Next.js", "Tailwind"],
    theme: "light",
    thumbnailType: "boomerang",
    lastEdited: "12 mins ago",
    plan: [
      "1. Architect borrower conversation state engine with dynamic context switching",
      "2. Integrate omni-channel webhooks for SMS (Twilio), Voice (SIP/WebRTC), and Email (SendGrid)",
      "3. Construct compliance auditing dashboard with real-time risk scoring and sentiment analytics",
      "4. Deploy responsive borrower self-service portal with loan repayment calculator",
    ],
    features: [
      "Autonomous conversational AI borrower assistance",
      "Real-time pipeline tracking and loan application routing",
      "Omni-channel engagement via voice, SMS, and email",
      "Enterprise SOC-2 compliance & audit trail logging",
    ],
    htmlPreview: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boomerang – AI Platform for Financial Institutions</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .serif-display { font-family: 'Newsreader', Georgia, serif; }
  </style>
</head>
<body class="bg-[#faf9f5] text-neutral-900 antialiased min-h-screen">
  <!-- Nav -->
  <header class="border-b border-neutral-200/80 px-8 py-4 flex items-center justify-between bg-[#faf9f5]/90 backdrop-blur sticky top-0 z-50">
    <div class="flex items-center gap-8">
      <div class="flex items-center gap-2 font-bold text-lg tracking-tight">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
        <span>Boomerang</span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-xs text-neutral-600 font-medium">
        <a href="#product" class="hover:text-black transition">Product</a>
        <a href="#solutions" class="hover:text-black transition">Solutions</a>
        <a href="#pricing" class="hover:text-black transition">Pricing</a>
        <a href="#company" class="hover:text-black transition">Company</a>
      </nav>
    </div>
    <div class="flex items-center gap-3">
      <button class="text-xs font-semibold px-4 py-2 text-neutral-700 hover:text-black transition">Sign In</button>
      <button class="text-xs font-semibold bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition shadow-sm">Book A Demo</button>
    </div>
  </header>

  <!-- Hero -->
  <main class="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300/80 bg-neutral-100/80 text-[11px] font-medium text-neutral-700 mb-8">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      Next-Gen Financial Agent Architecture
    </div>

    <h1 class="serif-display text-5xl md:text-7xl font-normal tracking-tight text-neutral-950 mb-6 leading-[1.08]">
      Build lasting<br><span class="italic font-light">relationships.</span>
    </h1>

    <p class="text-neutral-600 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
      Conversational AI platform for modern financial institutions — agents that handle the full borrower lifecycle across email, SMS, and voice.
    </p>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
      <button class="w-full sm:w-auto px-6 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition shadow-md">
        Book A Demo
      </button>
      <button class="w-full sm:w-auto px-6 py-3 border border-neutral-300 text-neutral-800 text-sm font-medium rounded-xl hover:bg-neutral-100 transition">
        Explore Interactive Simulator
      </button>
    </div>

    <!-- Live Interactive Demo Mockup -->
    <div class="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xl text-left max-w-4xl mx-auto">
      <div class="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-red-400"></span>
          <span class="w-3 h-3 rounded-full bg-amber-400"></span>
          <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
          <span class="ml-2 text-xs font-medium text-neutral-500">Live Agent Console · Borrower Session #4928</span>
        </div>
        <span class="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">● AI Agent Active</span>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-3">
          <div class="bg-neutral-50 rounded-xl p-3.5 border border-neutral-100 text-xs">
            <span class="font-semibold text-neutral-900 block mb-1">Borrower (Marcus Vance):</span>
            <p class="text-neutral-600">"Hi, I received an update that my pre-approval was submitted. Can I adjust my down payment to $45,000 to lower the monthly APR?"</p>
          </div>
          <div class="bg-blue-50/70 rounded-xl p-3.5 border border-blue-100/80 text-xs">
            <span class="font-semibold text-blue-950 block mb-1">Boomerang AI Agent:</span>
            <p class="text-blue-900">"Great to connect, Marcus! Increasing your down payment to $45,000 lowers your Loan-to-Value to 76.5%, reducing your monthly payment by $214/mo and removing Private Mortgage Insurance (PMI). Would you like me to update your formal loan package now?"</p>
          </div>
        </div>

        <div class="bg-neutral-900 text-white rounded-xl p-4 flex flex-col justify-between text-xs">
          <div>
            <span class="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-2">Loan Summary</span>
            <div class="space-y-2">
              <div class="flex justify-between text-neutral-300"><span>Target Property</span><span class="text-white font-medium">$420,000</span></div>
              <div class="flex justify-between text-neutral-300"><span>New Down Payment</span><span class="text-emerald-400 font-medium">$45,000</span></div>
              <div class="flex justify-between text-neutral-300"><span>Est. Monthly</span><span class="text-white font-bold">$2,380/mo</span></div>
            </div>
          </div>
          <button class="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium text-xs transition text-center">
            Confirm & Approve Update
          </button>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`,
    files: [
      {
        name: "App.tsx",
        language: "typescript",
        code: `import React, { useState } from 'react';\nimport { ArrowUpRight, CheckCircle, MessageSquare, Phone, ShieldCheck } from 'lucide-react';\n\nexport default function BoomerangApp() {\n  const [downPayment, setDownPayment] = useState(45000);\n  const loanAmount = 420000 - downPayment;\n  const estimatedMonthly = Math.round((loanAmount * 0.058) / 12 + 650);\n\n  return (\n    <div className="min-h-screen bg-[#faf9f5] text-neutral-900">\n      <header className="border-b border-neutral-200 px-8 py-4 flex items-center justify-between">\n        <h1 className="text-xl font-bold flex items-center gap-2">\n          <ArrowUpRight className="w-5 h-5" /> Boomerang\n        </h1>\n        <button className="bg-black text-white text-xs px-4 py-2 rounded-lg font-medium">\n          Book A Demo\n        </button>\n      </header>\n      <main className="max-w-4xl mx-auto p-8 text-center">\n        <h2 className="text-5xl font-serif mb-4">Build lasting relationships.</h2>\n        <p className="text-neutral-600 mb-8">Conversational AI platform for modern financial institutions.</p>\n      </main>\n    </div>\n  );\n}`,
      },
      {
        name: "types.ts",
        language: "typescript",
        code: `export interface BorrowerSession {\n  id: string;\n  name: string;\n  status: 'active' | 'completed' | 'escalated';\n  loanAmount: number;\n  downPayment: number;\n  propertyPrice: number;\n  sentiment: 'positive' | 'neutral' | 'curious';\n}`,
      },
    ],
  },
  {
    id: "abab-dex",
    title: "ABAB DEX",
    slug: "abab-dex",
    subtitle: "Everyone's Favorite DEX",
    description: "Trade, earn, and own crypto on the all-in-one multichain DEX — now native on Robinhood Chain with ultra-low gas fees.",
    category: "Crypto & Web3",
    tags: ["Web3", "DEX", "Solidity", "Tailwind", "Robinhood Chain"],
    theme: "dark",
    thumbnailType: "dex",
    stats: {
      users: "3,204,881",
      trades: "142,908,412",
      tvl: "$1.84B",
      volume: "$212.4M",
    },
    lastEdited: "1 hour ago",
    plan: [
      "1. Implement AMM Uniswap v3 style tick math and liquidity pool routing",
      "2. Integrate multi-wallet connectors (MetaMask, Phantom, Robinhood Wallet, WalletConnect)",
      "3. Render real-time Candlestick TradingView charts with custom slippage tolerance",
      "4. Deploy staking yield farm contracts with auto-compounder APR calculation",
    ],
    features: [
      "Instant token swap with smart multi-hop routing",
      "Yield farming pools with real-time APR counters",
      "Robinhood Chain native gasless transaction support",
      "Comprehensive liquidity pool provision dashboard",
    ],
    htmlPreview: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ABAB DEX – Multi-Chain Crypto Exchange</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    .glow-bg {
      background: radial-gradient(circle at center, rgba(147, 51, 234, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 80%);
    }
  </style>
</head>
<body class="bg-[#0b0d14] text-white min-h-screen antialiased flex flex-col font-sans">
  <!-- Nav -->
  <header class="border-b border-neutral-800/80 px-8 py-3.5 flex items-center justify-between bg-[#0b0d14]/90 backdrop-blur sticky top-0 z-50">
    <div class="flex items-center gap-8">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center font-black text-xs text-black shadow-lg shadow-orange-500/20">
          AB
        </div>
        <span class="font-bold tracking-tight text-lg">ABAB</span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-xs text-neutral-400 font-medium">
        <a href="#" class="text-white font-semibold">Trade ▾</a>
        <a href="#" class="hover:text-white transition">Earn ▾</a>
        <a href="#" class="hover:text-white transition">Win ▾</a>
        <a href="#" class="hover:text-white transition">NFT</a>
        <a href="#" class="hover:text-white transition">More ▾</a>
      </nav>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="font-semibold text-white">RHC</span>
        <span class="text-neutral-500">· $0.0012 Gas</span>
      </div>
      <button onclick="alert('Wallet modal opening...')" class="text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-blue-500/20 flex items-center gap-1.5">
        <span>Connect Wallet</span>
      </button>
    </div>
  </header>

  <!-- Main Hero -->
  <main class="flex-1 max-w-6xl mx-auto px-6 pt-16 pb-20 w-full relative">
    <div class="absolute inset-0 glow-bg pointer-events-none -z-10"></div>

    <div class="grid lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7 space-y-6">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/30 text-xs text-purple-300">
          <span>Live on Robinhood Chain</span>
        </div>

        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Everyone's Favorite <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">DEX</span>
        </h1>

        <p class="text-neutral-400 text-sm md:text-base max-w-lg leading-relaxed">
          Trade, earn, and own crypto on the all-in-one multichain DEX — now native on Robinhood Chain with zero-slippage routes and 100x liquid staking.
        </p>

        <div class="flex items-center gap-4 pt-2">
          <button class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 font-semibold text-sm rounded-xl transition shadow-lg shadow-purple-600/30">
            Connect Wallet
          </button>
          <button class="px-6 py-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 font-semibold text-sm rounded-xl transition">
            Start Earning
          </button>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-neutral-800/80">
          <div class="bg-neutral-900/60 border border-neutral-800/80 p-3.5 rounded-xl">
            <span class="text-xs text-neutral-400 block mb-1">Users</span>
            <span class="text-lg font-bold text-white tracking-tight">3,204,881</span>
          </div>
          <div class="bg-neutral-900/60 border border-neutral-800/80 p-3.5 rounded-xl">
            <span class="text-xs text-neutral-400 block mb-1">Total Trades</span>
            <span class="text-lg font-bold text-white tracking-tight">142,908,412</span>
          </div>
          <div class="bg-neutral-900/60 border border-neutral-800/80 p-3.5 rounded-xl">
            <span class="text-xs text-neutral-400 block mb-1">Total Value Locked</span>
            <span class="text-lg font-bold text-emerald-400 tracking-tight">$1.84B</span>
          </div>
          <div class="bg-neutral-900/60 border border-neutral-800/80 p-3.5 rounded-xl">
            <span class="text-xs text-neutral-400 block mb-1">24h Volume</span>
            <span class="text-lg font-bold text-blue-400 tracking-tight">$212.4M</span>
          </div>
        </div>
      </div>

      <!-- Swap Card -->
      <div class="lg:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur">
        <div class="flex items-center justify-between mb-6">
          <span class="font-bold text-base">Swap</span>
          <div class="flex items-center gap-2 text-xs text-neutral-400">
            <span class="px-2 py-1 bg-neutral-800 rounded">0.5% Slippage</span>
            <button class="p-1 hover:text-white">Opt</button>
          </div>
        </div>

        <div class="space-y-2">
          <!-- Pay Box -->
          <div class="bg-neutral-950 border border-neutral-800/90 rounded-2xl p-4">
            <div class="flex justify-between text-xs text-neutral-400 mb-2">
              <span>You Pay</span>
              <span>Balance: 4.821 ETH</span>
            </div>
            <div class="flex items-center justify-between">
              <input type="number" value="1.5" class="bg-transparent text-2xl font-bold focus:outline-none w-32" />
              <button class="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-xl text-sm font-semibold transition">
                <span class="w-4 h-4 rounded-full bg-blue-500 inline-block"></span>
                <span>ETH</span>
                <span class="text-xs text-neutral-400">▾</span>
              </button>
            </div>
            <span class="text-[11px] text-neutral-500 mt-1 block">~$4,832.10 USD</span>
          </div>

          <!-- Swap Icon -->
          <div class="flex justify-center -my-2 relative z-10">
            <button class="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 flex items-center justify-center text-xs transition">
              ↓
            </button>
          </div>

          <!-- Receive Box -->
          <div class="bg-neutral-950 border border-neutral-800/90 rounded-2xl p-4">
            <div class="flex justify-between text-xs text-neutral-400 mb-2">
              <span>You Receive (Estimated)</span>
              <span>Balance: 12,450 ABAB</span>
            </div>
            <div class="flex items-center justify-between">
              <input type="number" value="38420.5" readonly class="bg-transparent text-2xl font-bold text-emerald-400 focus:outline-none w-32" />
              <button class="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-xl text-sm font-semibold transition">
                <span class="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 inline-block"></span>
                <span>ABAB</span>
                <span class="text-xs text-neutral-400">▾</span>
              </button>
            </div>
            <span class="text-[11px] text-neutral-500 mt-1 block">~$4,829.80 USD (-0.05% Price Impact)</span>
          </div>
        </div>

        <button class="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-bold text-sm rounded-2xl transition shadow-xl shadow-purple-600/20">
          Swap Tokens
        </button>
      </div>
    </div>
  </main>
</body>
</html>`,
    files: [
      {
        name: "App.tsx",
        language: "typescript",
        code: `import React, { useState } from 'react';\n\nexport default function AbabDexApp() {\n  const [fromAmount, setFromAmount] = useState('1.5');\n  const toAmount = (parseFloat(fromAmount || '0') * 25613.6).toFixed(2);\n\n  return (\n    <div className="min-h-screen bg-[#0b0d14] text-white p-8">\n      <header className="flex justify-between items-center mb-12">\n        <div className="text-xl font-bold">ABAB DEX</div>\n        <button className="bg-blue-600 px-4 py-2 rounded-lg font-medium">Connect Wallet</button>\n      </header>\n      <div className="max-w-md mx-auto bg-neutral-900 p-6 rounded-2xl border border-neutral-800">\n        <h2 className="text-lg font-bold mb-4">Swap Tokens</h2>\n        <input value={fromAmount} onChange={e => setFromAmount(e.target.value)} className="w-full bg-black p-3 rounded-lg mb-4 text-xl" />\n        <div className="text-emerald-400 font-bold text-xl mb-4">Receiving: {toAmount} ABAB</div>\n        <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold">Swap</button>\n      </div>\n    </div>\n  );\n}`,
      },
    ],
  },
  {
    id: "desk",
    title: "Desk",
    slug: "desk",
    subtitle: "Banks own you. We fund you.",
    description: "First time at the desk? Terms are fixed at funding. Prices can move however they like — nothing gets sold out from under a borrower.",
    category: "Fintech & Lending",
    tags: ["Lending", "Decentralized Credit", "Fixed Terms", "React"],
    theme: "dark",
    thumbnailType: "desk",
    lastEdited: "3 hours ago",
    plan: [
      "1. Build non-liquidating debt agreement smart vault logic",
      "2. Render fixed repayment schedules and collateral ratio visualizer",
      "3. Configure automated milestone release escrow",
    ],
    features: [
      "Fixed rate lending with zero liquidation volatility",
      "Collateral protection protocol",
      "Automated interest milestone settlements",
    ],
    htmlPreview: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Desk – Non-Liquidating Institutional Credit</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Space Grotesk', sans-serif; }
  </style>
</head>
<body class="bg-[#0e0e11] text-neutral-100 min-h-screen antialiased flex flex-col justify-between p-8 md:p-16">
  <header class="flex justify-between items-center max-w-6xl mx-auto w-full">
    <div class="text-xl font-mono tracking-widest uppercase font-bold text-amber-400">DESK // 01</div>
    <div class="text-xs font-mono text-neutral-500 uppercase tracking-wider">Protocol Status: Optimal</div>
  </header>

  <main class="max-w-4xl mx-auto w-full py-16">
    <div class="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur">
      <span class="text-xs font-mono uppercase tracking-widest text-amber-400 block mb-4">First time at the desk?</span>
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
        Banks own you.<br><span class="text-neutral-400">We fund you.</span>
      </h1>

      <div class="space-y-4 text-neutral-300 text-sm md:text-base leading-relaxed max-w-2xl mb-10">
        <p>
          <strong class="text-white">No liquidations.</strong> Terms are fixed at funding. Prices can move however they like — nothing gets sold out from under a borrower.
        </p>
        <p class="text-neutral-400">
          If maturity passes unpaid, the lender simply claims the collateral. No margin calls, no surprise cascading liquidations.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <button class="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm rounded-xl transition shadow-lg shadow-amber-400/20">
          Enter The Desk
        </button>
        <button class="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm rounded-xl transition border border-neutral-700">
          Read Term Sheet Specs
        </button>
      </div>
    </div>
  </main>

  <footer class="max-w-6xl mx-auto w-full text-center text-xs text-neutral-600 font-mono">
    Desk Capital Protocol · All rights reserved
  </footer>
</body>
</html>`,
    files: [
      {
        name: "App.tsx",
        language: "typescript",
        code: `import React from 'react';\n\nexport default function DeskApp() {\n  return (\n    <div className="min-h-screen bg-[#0e0e11] text-white p-12">\n      <h1 className="text-4xl font-bold text-amber-400 mb-4">Banks own you. We fund you.</h1>\n      <p className="text-neutral-400">Terms are fixed at funding. No liquidations.</p>\n    </div>\n  );\n}`,
      },
    ],
  },
  {
    id: "healthpulse",
    title: "HealthPulse AI",
    slug: "healthpulse",
    subtitle: "Autonomous Health & Longevity Dashboard",
    description: "Continuous metabolic, sleep, and heart biometric monitoring with tailored lifestyle interventions.",
    category: "Health & AI",
    tags: ["Health", "AI", "Biometrics", "Longevity"],
    theme: "dark",
    thumbnailType: "health",
    lastEdited: "Yesterday",
    plan: [
      "1. Build real-time resting heart rate & HRV telemetry charts",
      "2. Integrate circadian rhythm sleep cycle scoring",
      "3. Build recommendations for recovery windows",
    ],
    features: [
      "Real-time biometric telemetry",
      "Sleep quality optimization score",
      "AI nutrition and workout scheduler",
    ],
    htmlPreview: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HealthPulse AI</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-950 text-white p-8 min-h-screen font-sans">
  <div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-emerald-400">HealthPulse AI</h1>
      <span class="text-xs px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full">Recovery Score: 94%</span>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <span class="text-xs text-neutral-400">Heart Rate (Resting)</span>
        <div class="text-3xl font-bold text-white mt-2">52 <span class="text-sm font-normal text-neutral-400">bpm</span></div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <span class="text-xs text-neutral-400">Deep Sleep</span>
        <div class="text-3xl font-bold text-blue-400 mt-2">2h 45m</div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <span class="text-xs text-neutral-400">Metabolic Strain</span>
        <div class="text-3xl font-bold text-purple-400 mt-2">Optimal</div>
      </div>
    </div>
  </div>
</body>
</html>`,
    files: [
      {
        name: "App.tsx",
        language: "typescript",
        code: `import React from 'react';\n\nexport default function App() {\n  return <div className="p-8 text-white">HealthPulse AI Dashboard</div>;\n}`,
      },
    ],
  },
  {
    id: "saas-studio",
    title: "SaaS Studio",
    slug: "saas-studio",
    subtitle: "Enterprise Product Analytics & MRR Tracking",
    description: "Subscription analytics, cohort churn heatmaps, and automated MRR growth forecasting.",
    category: "Analytics & SaaS",
    tags: ["SaaS", "Dashboard", "MRR", "Stripe"],
    theme: "light",
    thumbnailType: "saas",
    lastEdited: "2 days ago",
    plan: [
      "1. Calculate MRR, ARR, and net revenue retention metrics",
      "2. Render cohort retention heatmaps",
      "3. Forecast churn probabilities using machine learning models",
    ],
    features: [
      "Real-time revenue metrics dashboard",
      "Cohort churn breakdown table",
      "Automated invoice and subscription webhook ingestion",
    ],
    htmlPreview: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SaaS Studio Analytics</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-neutral-900 p-8 min-h-screen">
  <div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-8 border-b pb-4">
      <h1 class="text-2xl font-bold">SaaS Studio</h1>
      <span class="text-sm font-semibold text-emerald-600">MRR: $48,290 (+14.2%)</span>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-neutral-50 border p-6 rounded-2xl">
        <span class="text-xs text-neutral-500">Active Subscribers</span>
        <div class="text-3xl font-bold mt-2">1,420</div>
      </div>
      <div class="bg-neutral-50 border p-6 rounded-2xl">
        <span class="text-xs text-neutral-500">Churn Rate</span>
        <div class="text-3xl font-bold text-emerald-600 mt-2">1.2%</div>
      </div>
      <div class="bg-neutral-50 border p-6 rounded-2xl">
        <span class="text-xs text-neutral-500">LTV / CAC</span>
        <div class="text-3xl font-bold text-blue-600 mt-2">4.8x</div>
      </div>
    </div>
  </div>
</body>
</html>`,
    files: [
      {
        name: "App.tsx",
        language: "typescript",
        code: `import React from 'react';\n\nexport default function App() {\n  return <div className="p-8">SaaS Studio Dashboard</div>;\n}`,
      },
    ],
  },
];

export const lovableTemplates: Project[] = [
  {
    id: "tmpl-saas",
    title: "Modern AI SaaS Landing & Dashboard",
    slug: "modern-ai-saas",
    subtitle: "Complete auth, billing, and generative dashboard starter",
    description: "Launch your next AI application with pre-integrated landing page, pricing table, and user dashboard.",
    category: "SaaS",
    tags: ["Template", "SaaS", "Next.js", "Tailwind"],
    theme: "dark",
    thumbnailType: "saas",
    lastEdited: "Updated today",
    plan: [
      "1. Pre-configured pricing tiers and Stripe checkout",
      "2. User authentication and organization teams",
      "3. Dark mode UI components library",
    ],
    features: ["Pricing calculator", "Dark/light toggle", "Dashboard analytics"],
    htmlPreview: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-neutral-950 text-white p-8 flex items-center justify-center min-h-screen"><div class="text-center"><h1 class="text-4xl font-bold mb-4">Modern AI SaaS Starter</h1><p class="text-neutral-400">Ready to deploy with Next.js and Tailwind.</p></div></body></html>`,
    files: [{ name: "App.tsx", language: "typescript", code: "// Starter code" }],
  },
  {
    id: "tmpl-ecommerce",
    title: "Minimalist Artisan E-Commerce",
    slug: "artisan-ecommerce",
    subtitle: "High-conversion product showcase and cart drawer",
    description: "Clean aesthetic store with instant filter, product variant selector, and slide-over checkout.",
    category: "E-Commerce",
    tags: ["E-Commerce", "Cart", "Minimalist"],
    theme: "light",
    thumbnailType: "boomerang",
    lastEdited: "Updated 2 days ago",
    plan: ["1. Product catalog with instant filter", "2. Slide-out cart state", "3. Checkout flow"],
    features: ["Responsive product grid", "Variant picker", "Cart calculation"],
    htmlPreview: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#faf9f5] text-neutral-900 p-8 flex items-center justify-center min-h-screen"><div class="text-center"><h1 class="text-4xl font-serif mb-4">Artisan Goods Co.</h1><p class="text-neutral-600">Curated handcrafted objects for the home.</p></div></body></html>`,
    files: [{ name: "App.tsx", language: "typescript", code: "// Starter code" }],
  },
  {
    id: "tmpl-crypto",
    title: "DeFi Liquid Staking Protocol",
    slug: "defi-staking",
    subtitle: "Automated APY compounding and wallet connector",
    description: "Multichain decentralized yield farm interface with real-time token price charts.",
    category: "Web3",
    tags: ["Web3", "Crypto", "Staking"],
    theme: "dark",
    thumbnailType: "dex",
    lastEdited: "Updated 3 days ago",
    plan: ["1. Connect wallet interface", "2. Liquid staking deposit & unstake", "3. Yield APR ticker"],
    features: ["Instant liquidity", "Gas optimization", "Real-time APY"],
    htmlPreview: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-neutral-950 text-white p-8 flex items-center justify-center min-h-screen"><div class="text-center"><h1 class="text-4xl font-bold text-purple-400 mb-4">Liquid Staking Protocol</h1><p class="text-neutral-400">Earn 14.8% APY on auto-compounded ETH.</p></div></body></html>`,
    files: [{ name: "App.tsx", language: "typescript", code: "// Starter code" }],
  },
];
