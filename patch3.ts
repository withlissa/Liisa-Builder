const fs = require('fs');
const content = fs.readFileSync('artifacts/ai-studio-applet/src/components/access-gate.tsx', 'utf8');
const lines = content.split('\n');

const finaleOpacityIdx = lines.findIndex(l => l.includes('const finaleOpacity = useTransform(scrollYProgress, [0.58, 0.64, 0.78, 0.82], [0, 1, 1, 0]);'));
if (finaleOpacityIdx !== -1) {
  lines[finaleOpacityIdx] = "  const finaleOpacity = useTransform(scrollYProgress, [0.58, 0.64, 0.80, 0.84], [0, 1, 1, 0]);";
}

const typingIdx = lines.findIndex(l => l.includes('text="Step into the workspace"'));
if (typingIdx !== -1) {
  lines[typingIdx - 1] = "              end={0.78}";
}

fs.writeFileSync('artifacts/ai-studio-applet/src/components/access-gate.tsx', lines.join('\n'));
