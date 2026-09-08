import re

with open('artifacts/ai-studio-applet/src/components/access-gate.tsx', 'r') as f:
    content = f.read()

# 1. min-h-[700vh] -> min-h-[1400vh]
content = content.replace('min-h-[700vh]', 'min-h-[1400vh]')

# 2. Insert part1 and part2 right after useReducedMotion
content = content.replace(
    'const reducedMotion = useReducedMotion();',
    'const reducedMotion = useReducedMotion();\n  const part1 = useTransform(scrollYProgress, [0, 0.5], [0, 1]);\n  const part2 = useTransform(scrollYProgress, [0.5, 1], [0, 1]);'
)

# 3. Update the video useMotionValueEvent to use part1
content = content.replace(
    'useMotionValueEvent(scrollYProgress, "change", (latest) => {',
    'useMotionValueEvent(part1, "change", (latest) => {'
)

# 4. Replace all useTransform(scrollYProgress, with useTransform(part1,
content = content.replace('useTransform(scrollYProgress,', 'useTransform(part1,')

# 5. Fix productContainerY array
content = content.replace(
    "['50vh', '0vh', '0vh', '-78vh']",
    "['50vh', '0vh', '0vh', '-100vh']"
)
content = content.replace(
    "const productContainerY = useTransform(part1, [0.63, 0.70, 0.82, 1]",
    "const productContainerY = useTransform(part1, [0.63, 0.70, 0.9, 1]"
)

# 6. Add new part 2 constants before return statement
constants = """
  // NEW PART 2 LOGIC
  const part2Y = useTransform(part1, [0.9, 1], ['100vh', '0vh']);
  
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
"""
content = content.replace(
    "  return (\n    <main",
    constants + "\n  return (\n    <main"
)

# 7. Add SVG clip path right after <div className="fixed inset-0 z-10 pointer-events-none">
svg_clip = """
        <svg width="0" height="0" className="fixed pointer-events-none">
          <defs>
            <clipPath id="lissa-dome" clipPathUnits="objectBoundingBox">
              <path d="M 0,0.05 Q 0.5,0 1,0.05 L 1,1 L 0,1 Z" />
            </clipPath>
          </defs>
        </svg>
"""
content = content.replace(
    '<div className="fixed inset-0 z-10 pointer-events-none">',
    '<div className="fixed inset-0 z-10 pointer-events-none">\n' + svg_clip
)

# 8. Add Part 2 JSX right before closing </div> of fixed overlay
part2_jsx = """
        {/* PART 2: THE DESTINATION */}
        <motion.section
          style={{
            y: part2Y,
            clipPath: 'url(#lissa-dome)'
          }}
          className="fixed inset-0 z-30 pointer-events-none overflow-hidden bg-[#02040A]"
        >
          {/* Glowing Dome Border */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[5vh] text-blue-500 z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] opacity-80">
            <path d="M 0,100 Q 50,0 100,100" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Anime Background */}
          <motion.div
            style={{ scale: part2BgScale, y: part2BgY }}
            className="absolute inset-0 z-0 origin-top"
          >
            <img src="/brand/anime-bg.png" alt="Anime bg" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#02040A] via-[#02040A]/40 to-[#02040A] mix-blend-multiply" />
            <div className="absolute inset-0 bg-blue-950/30 mix-blend-color" />
          </motion.div>

          {/* COMMUNITY INVITATION CARD */}
          <motion.div
            style={{ y: cardY, opacity: cardOpacity, scale: cardScale, filter: cardGlitch, x: cardX }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl aspect-auto md:aspect-[3/1] bg-black/60 border border-blue-500/30 backdrop-blur-xl rounded-2xl flex flex-col md:flex-row items-center justify-between p-8 md:p-12 overflow-hidden group pointer-events-auto shadow-[0_0_50px_rgba(37,99,235,0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex flex-col items-start gap-4 z-10 w-full md:w-1/2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.25em] text-blue-300/80 uppercase">Network Open</span>
              </div>
              <h3 className="text-3xl md:text-5xl font-sans font-medium text-white tracking-tighter [text-shadow:0_4px_20px_rgba(0,0,0,1)]">
                Join the Nexus.
              </h3>
              <p className="text-white/60 font-mono text-xs md:text-sm leading-relaxed mt-2">
                The LISSA protocol is governed by its builders. Connect your identity, contribute to the swarm, and shape the intelligence singularity.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 z-10 w-full md:w-auto mt-8 md:mt-0">
              <button className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-widest rounded transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]">
                Launch Studio
              </button>
              <button className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs uppercase tracking-widest rounded transition-all">
                Read Docs
              </button>
            </div>
          </motion.div>

          {/* ASYMMETRIC FAQ */}
          <motion.div
            style={{ y: faqY, opacity: faqOpacity }}
            className="absolute top-0 left-0 w-full flex pointer-events-auto"
          >
            <div className="w-[90%] md:w-[75%] lg:w-[65%] bg-black/70 border-t border-r border-b border-white/10 rounded-r-[2rem] md:rounded-r-[4rem] backdrop-blur-2xl p-6 sm:p-8 md:p-16 relative overflow-hidden shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
              <motion.div
                style={{ backgroundColor: faqColor }}
                className="absolute top-0 left-0 w-1.5 md:w-2 h-full shadow-[0_0_20px_currentColor]"
              />
              <h3 className="text-2xl md:text-4xl font-sans font-medium mb-8 md:mb-12 text-white">System Queries</h3>

              <div className="space-y-4 md:space-y-6">
                {[
                  { q: "What is LISSA?", a: "An autonomous agentic builder designed exclusively for token holders. It translates natural language into production-ready architectures." },
                  { q: "How does the token gate work?", a: "Your wallet must hold the minimum balance of LOS on the Robinhood chain to bypass the security gate. No exceptions." },
                  { q: "Can I export my code?", a: "Yes. Every line generated by LISSA is yours to own, export, and deploy anywhere." }
                ].map((item, i) => (
                  <details key={i} className="group cursor-pointer border-b border-white/5 pb-4 md:pb-6">
                    <summary className="text-sm md:text-lg font-mono text-white/80 list-none [&::-webkit-details-marker]:hidden flex justify-between items-center group-hover:text-blue-400 transition-colors outline-none">
                      {item.q}
                      <span className="text-blue-500/50 group-open:rotate-45 transition-transform duration-300 font-sans text-xl">+</span>
                    </summary>
                    <p className="mt-4 text-white/50 font-sans text-xs md:text-sm leading-relaxed max-w-2xl">
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
            className="absolute bottom-0 left-0 w-full h-[50vh] flex flex-col justify-end pointer-events-auto"
          >
            <div className="w-full relative overflow-hidden pt-12 flex flex-col items-center">
              <div className="absolute inset-0 bg-gradient-to-t from-[#050BE0]/20 via-[#02040A]/80 to-transparent pointer-events-none" />
              
              <motion.div
                style={{ textShadow: footerShadow }}
                className="text-[18vw] font-sans font-bold text-white/5 tracking-tighter leading-[0.8] select-none z-0 mt-8"
              >
                LISSA
              </motion.div>
              
              <div className="absolute bottom-6 md:bottom-12 left-6 right-6 md:left-12 md:right-12 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 font-mono text-[10px] md:text-xs text-white/30 uppercase tracking-widest z-10 border-t border-white/10 pt-6">
                <span>© 2026 LISSA SYSTEM INC.</span>
                <div className="flex gap-6">
                  <button className="hover:text-blue-400 transition-colors">Terms of Service</button>
                  <button className="hover:text-blue-400 transition-colors">Privacy Policy</button>
                </div>
              </div>
            </div>
          </motion.footer>

        </motion.section>
"""
content = content.replace(
    '      </div>\n\n    </main>',
    part2_jsx + '\n      </div>\n\n    </main>'
)

with open('artifacts/ai-studio-applet/src/components/access-gate.tsx', 'w') as f:
    f.write(content)
