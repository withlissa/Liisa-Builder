const fs = require('fs');
const content = fs.readFileSync('artifacts/ai-studio-applet/src/components/access-gate.tsx', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* HOW IT WORKS CHAPTER */}'));
const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes('</motion.section>'));

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find block");
  process.exit(1);
}

const replacement = `        {/* HOW IT WORKS CHAPTER (Sequential Flow) */}
        <motion.section
          style={{ opacity: section2Opacity, visibility: section2Visibility as any }}
          className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
        >
          <div className="relative w-full max-w-4xl h-[65vh] md:h-[75vh] pointer-events-auto">
            {/* Background SVG for Electrical Flow */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Base faint dashed line */}
              <motion.path 
                d="M 80 15 C 80 40, 20 30, 20 50 C 20 70, 80 60, 80 85" 
                vectorEffect="non-scaling-stroke"
                fill="none" 
                stroke="rgba(96, 165, 250, 0.15)" 
                strokeWidth="1.5"
                strokeDasharray="2 4"
              />
              {/* Glowing active line drawn on scroll */}
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
        </motion.section>`;

lines.splice(startIdx, endIdx - startIdx + 1, replacement);
fs.writeFileSync('artifacts/ai-studio-applet/src/components/access-gate.tsx', lines.join('\n'));
