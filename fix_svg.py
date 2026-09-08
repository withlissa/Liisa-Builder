with open('artifacts/ai-studio-applet/src/components/access-gate.tsx', 'r') as f:
    content = f.read()

# Update clip path to use explicit values
content = content.replace(
    '<path d="M 0,0.1 Q 0.5,-0.02 1,0.1 L 1,1 L 0,1 Z" />',
    '<path d="M 0,0.1 Q 0.5,0 1,0.1 L 1,1 L 0,1 Z" />'
)

# Replace the stroke SVG to perfectly match
old_svg = """          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[5vh] text-blue-500 z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] opacity-80">
            <path d="M 0,100 Q 50,0 100,100" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>"""

new_svg = """          <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[10vh] text-blue-500 z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] opacity-80">
            <path d="M 0,10 Q 50,0 100,10" fill="none" stroke="currentColor" strokeWidth="0.1" vectorEffect="non-scaling-stroke" />
          </svg>"""

content = content.replace(old_svg, new_svg)

with open('artifacts/ai-studio-applet/src/components/access-gate.tsx', 'w') as f:
    f.write(content)
