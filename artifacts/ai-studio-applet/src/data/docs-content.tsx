import { ReactNode } from 'react';

export interface DocSection {
  id: string;
  title: string;
  content: ReactNode;
  toc?: { id: string; title: string }[];
}

export interface DocCategory {
  id: string;
  title: string;
  items: DocSection[];
}

export const DOCS_DATA: DocCategory[] = [
  {
    id: 'getting-started',
    title: 'GETTING STARTED',
    items: [
      {
        id: 'overview',
        title: 'Overview',
        toc: [
          { id: 'what-is-lissa', title: 'What is LISSA?' },
          { id: 'key-features', title: 'Key Features' }
        ],
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Overview</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Build applications, dashboards, and AI-assisted products with LISSA. The workspace combines an AI development agent, browser-based IDE, live preview, persistent projects, imports, and publishing in one continuous workflow.
            </p>
            
            <h2 id="what-is-lissa" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">What is LISSA?</h2>
            <p className="text-neutral-400 leading-relaxed">
              LISSA is an exclusive AI application builder for LISSA token holders. It acts as both your software architect and your co-developer. You describe the product, interface, and interactions you want in natural language, and LISSA plans the architecture, writes the source code, and assembles a live browser workspace.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-5 border border-white/10 bg-[#05070e] rounded-xl">
                <div className="text-blue-500 mb-3"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                <h3 className="text-white font-medium mb-2">Rapid Prototyping</h3>
                <p className="text-sm text-neutral-500">Move from a detailed product brief to editable source code and a running browser preview.</p>
              </div>
              <div className="p-5 border border-white/10 bg-[#05070e] rounded-xl">
                <div className="text-blue-500 mb-3"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></div>
                <h3 className="text-white font-medium mb-2">Refinement</h3>
                <p className="text-sm text-neutral-500">Iterate on your generated application with follow-up prompts or manual code edits.</p>
              </div>
            </div>

            <h2 id="key-features" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Key Features</h2>
            <ul className="space-y-3 text-neutral-400 list-disc list-outside ml-5">
              <li><strong className="text-neutral-200">Browser IDE:</strong> A full-featured editor with syntax highlighting, terminal, and file management.</li>
              <li><strong className="text-neutral-200">Live Preview:</strong> Instantly view the results of your generation or code changes side-by-side.</li>
              <li><strong className="text-neutral-200">Persistent Projects:</strong> Your workspaces are securely stored, allowing you to pause and resume work anytime.</li>
              <li><strong className="text-neutral-200">Repository Sync:</strong> Import from and export to GitHub, enabling seamless collaboration.</li>
            </ul>
          </div>
        )
      },
      {
        id: 'quickstart',
        title: 'Quickstart',
        toc: [
          { id: 'first-build', title: 'Your First Build' },
          { id: 'workspace-tour', title: 'Workspace Tour' }
        ],
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Quickstart</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Get up and running with LISSA in three simple steps. Let the agent handle the heavy lifting.
            </p>

            <h2 id="first-build" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Your First Build</h2>
            <div className="space-y-4 text-neutral-400">
              <p>1. <strong>Connect Your Wallet:</strong> You must authenticate using a wallet holding the required minimum LISSA balance on the Robinhood chain.</p>
              <p>2. <strong>Describe Your App:</strong> In the Builder Home, enter a natural language prompt describing what you want. Be specific about features, layout, and color schemes.</p>
              <p>3. <strong>Refine:</strong> Once the agent completes the initial build, you will enter the Studio Workspace. Use the chat to request changes, or click the <em>Code</em> tab to edit the source manually.</p>
            </div>

            <div className="bg-[#080a11] border border-white/10 rounded-xl p-6 mt-6">
              <h3 className="text-white font-medium mb-3">Example Prompt</h3>
              <p className="text-sm text-neutral-400 font-mono bg-black/40 p-3 rounded-lg border border-white/5">
                "Build a modern CRM dashboard for a real estate agency. Include a sidebar navigation, a stats overview at the top with dummy data, and a searchable data table for client leads. Use a dark theme with blue accents."
              </p>
            </div>
            
            <h2 id="workspace-tour" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Workspace Tour</h2>
            <p className="text-neutral-400 leading-relaxed mb-4">
              The Studio keeps every part of the build loop close together. Use Agent for follow-up instructions, Preview for the running result, Code for files and terminal access, Data for project records, Deployments for release status, and Tools for connected capabilities.
            </p>
            <div className="bg-[#05070e] border border-white/10 rounded-lg overflow-hidden font-mono text-sm">
              <div className="flex items-center px-4 py-2 border-b border-white/5 bg-black/40 text-neutral-500">
                <span>Recommended first session</span>
              </div>
              <div className="p-4 text-neutral-300 space-y-1.5">
                <div><span className="text-blue-500">01</span> Review the generated preview</div>
                <div><span className="text-blue-500">02</span> Inspect the source and terminal</div>
                <div><span className="text-blue-500">03</span> Request one focused refinement</div>
                <div><span className="text-blue-500">04</span> Save, connect, or publish the project</div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'wallet-access',
        title: 'Wallet & Access',
        toc: [
          { id: 'requirements', title: 'Token Requirements' },
          { id: 'network', title: 'Network Setup' }
        ],
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Wallet & Access</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              LISSA is an exclusive tool. Access is cryptographically gated and restricted to verified token holders.
            </p>

            <h2 id="requirements" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Token Requirements</h2>
            <p className="text-neutral-400 leading-relaxed">
              To enter the app, your connected wallet must hold the minimum threshold of the <strong>LISSA</strong> token. The access card reads the token supply and your wallet balance directly from the configured contract, then displays the current required amount.
            </p>
            <div className="p-4 border-l-2 border-blue-500 bg-blue-500/10 text-blue-100 text-sm my-4">
              Access is granted to wallets holding at least 0.1% of the token's total supply. The current experience presents this requirement as approximately 1,000,000 LISSA, while the live access card remains the source of truth.
            </div>

            <h2 id="network" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Network Setup</h2>
            <p className="text-neutral-400 leading-relaxed">
              The LISSA token contract resides on the <strong>Robinhood Chain</strong>. When you initialize your link on the landing page, the application will prompt you to switch to the correct network if you are connected to Ethereum Mainnet or another chain.
            </p>
            <div className="grid gap-3 rounded-xl border border-white/10 bg-[#05070e] p-5 font-mono text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><span className="text-neutral-500">Chain ID</span><span className="text-neutral-200">4663</span></div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><span className="text-neutral-500">Token</span><span className="text-neutral-200">LISSA</span></div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><span className="text-neutral-500">Contract</span><span className="break-all text-neutral-200">0x23D1BF831469305488902070066aa3966f011617</span></div>
            </div>
            <p className="text-neutral-400 leading-relaxed mt-2">
              Authentication requires a signed message to prove wallet ownership. This request does not trigger a transaction or cost gas.
            </p>
          </div>
        )
      }
    ]
  },
  {
    id: 'core-concepts',
    title: 'CORE CONCEPTS',
    items: [
      {
        id: 'build-credits',
        title: 'Build Credits',
        toc: [
          { id: 'usage', title: 'Credit Usage' },
          { id: 'claiming', title: 'Claiming Credits' }
        ],
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Build Credits</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              AI generations require substantial compute. To manage resources fairly among holders, LISSA utilizes a credit system.
            </p>

            <h2 id="usage" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Credit Usage</h2>
            <p className="text-neutral-400 leading-relaxed">
              Every wallet receives two free builds per day. After the daily allowance is used, an initial generation or follow-up build consumes available credit balance. Browsing projects, editing files manually, using the terminal, and inspecting previews do not consume build credits.
            </p>
            <ul className="space-y-3 text-neutral-400 list-disc list-outside ml-5 mt-4">
              <li><strong>Initial Generation:</strong> Consumes 1 build credit.</li>
              <li><strong>Follow-up Refinement:</strong> Consumes 1 build credit.</li>
              <li><strong>Manual Code Edits:</strong> Free.</li>
               <li><strong>Project Saving and Browsing:</strong> Free.</li>
               <li><strong>Failed Build:</strong> The charged allowance or credit is restored automatically.</li>
            </ul>

            <h2 id="claiming" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Claiming Credits</h2>
            <p className="text-neutral-400 leading-relaxed">
              Eligible LISSA holders accrue additional claimable credit over time. Open <strong className="text-white">Manage credits</strong> below the prompt to review free builds remaining, numeric credit balance, and claimable credit. Claiming moves the currently available amount into the build balance.
            </p>
          </div>
        )
      },
      {
        id: 'prompting',
        title: 'Prompting Guide',
        toc: [
          { id: 'best-practices', title: 'Best Practices' },
          { id: 'file-attachments', title: 'Using Attachments' }
        ],
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Prompting Guide</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              The quality of your generated application directly correlates to the specificity of your instructions. 
            </p>

            <h2 id="best-practices" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Best Practices</h2>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="bg-[#05070e] p-4 rounded-lg border border-white/10">
                <h3 className="text-red-400 font-semibold mb-2">Avoid Vague Prompts</h3>
                <p className="text-sm text-neutral-500">"Make a crypto app."</p>
                <p className="text-sm text-neutral-500 mt-2">"Build a nice landing page."</p>
              </div>
              <div className="bg-[#05070e] p-4 rounded-lg border border-white/10">
                <h3 className="text-emerald-400 font-semibold mb-2">Use Specific Constraints</h3>
                <p className="text-sm text-neutral-500">"Build a crypto portfolio tracker. Include a line chart for balance history over 7 days, a data table for assets showing price and 24h change. Use a dense, technical aesthetic with pure black backgrounds and neon green accents."</p>
              </div>
            </div>
            
            <ul className="space-y-3 text-neutral-400 list-disc list-outside ml-5 mt-4">
              <li><strong>Layout:</strong> Mention if you want sidebars, top navigation, grids, or specific flex alignments.</li>
              <li><strong>Data:</strong> Specify what kind of dummy data the agent should generate to populate the views.</li>
              <li><strong>Aesthetic:</strong> Describe the mood, color palette, and font styles.</li>
            </ul>

            <h2 id="file-attachments" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Using Attachments</h2>
            <p className="text-neutral-400 leading-relaxed">
              You can attach supporting files directly to a prompt using the <strong className="text-white">+</strong> control in the input field.
            </p>
            <p className="text-neutral-400 leading-relaxed mt-2">
              Small text, code, JSON, CSV, HTML, CSS, JavaScript, and TypeScript files can contribute readable context to the build brief. Other attachment types remain identified by filename, media type, and size. Describe the intended use of every attachment in the prompt instead of assuming the agent will infer it.
            </p>
          </div>
        )
      },
      {
        id: 'generation-lifecycle',
        title: 'Generation Lifecycle',
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Generation Lifecycle</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              When you submit a prompt, LISSA initiates a multi-stage build process. Understanding this pipeline helps in crafting better prompts and diagnosing issues.
            </p>
            
            <div className="space-y-4 mt-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#02040a] bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-mono text-xs">
                  01
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-[#05070e] shadow-sm">
                  <h3 className="font-semibold text-white mb-1">Context Analysis</h3>
                  <p className="text-sm text-neutral-400">The agent reads the prompt and attached files, extracting constraints, visual requests, and necessary features.</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#02040a] bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-mono text-xs">
                  02
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-[#05070e] shadow-sm">
                  <h3 className="font-semibold text-white mb-1">Architecture Planning</h3>
                  <p className="text-sm text-neutral-400">LISSA outlines the necessary component hierarchy, state management, and file structure.</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#02040a] bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-mono text-xs">
                  03
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-[#05070e] shadow-sm">
                  <h3 className="font-semibold text-white mb-1">Code Synthesis</h3>
                  <p className="text-sm text-neutral-400">The neural engine writes the raw source code (React, Tailwind, utility functions) simultaneously.</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#02040a] bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-mono text-xs">
                  04
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-[#05070e] shadow-sm">
                  <h3 className="font-semibold text-white mb-1">Assembly & Preview</h3>
                  <p className="text-sm text-neutral-400">The code is bundled into an execution context, yielding an interactive HTML preview and a navigable file tree.</p>
                </div>
              </div>
            </div>
            
            <p className="text-neutral-400 leading-relaxed mt-6">
              Build jobs are stored server-side and polled by the workspace. If the browser reloads or the server restarts, an active job can continue from its persisted status instead of charging a second time. A terminal failure restores the build allowance or credit automatically.
            </p>
          </div>
        )
      }
    ]
  },
  {
    id: 'workspace',
    title: 'WORKSPACE',
    items: [
      {
        id: 'editor-terminal',
        title: 'Code Editor & Terminal',
        toc: [
          { id: 'monaco-integration', title: 'IDE Capabilities' },
          { id: 'terminal-access', title: 'Terminal Access' }
        ],
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Editor & Terminal</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              LISSA isn't just a code generator; it provides a professional-grade browser development environment.
            </p>

            <h2 id="monaco-integration" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">IDE Capabilities</h2>
            <p className="text-neutral-400 leading-relaxed">
              By switching to the <strong>Code</strong> tab in the Studio Workspace, you access a Monaco-powered code editor. This is the same engine that powers VS Code. 
            </p>
            <ul className="space-y-3 text-neutral-400 list-disc list-outside ml-5 mt-4">
              <li>Syntax highlighting for TypeScript, React, CSS, and HTML.</li>
              <li>Live error linting and syntax checking.</li>
              <li>Auto-save functionality: any change you make is instantly synced to the project state.</li>
              <li>File tree management: rename, delete, or create new files manually.</li>
            </ul>

            <h2 id="terminal-access" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Terminal Access</h2>
            <p className="text-neutral-400 leading-relaxed">
              Advanced users can interact with the underlying execution context via the built-in terminal (if supported by the current environment). Navigate to the terminal panel within the Code view to run package commands, inspect logs, and debug build failures manually.
            </p>
          </div>
        )
      },
      {
        id: 'live-preview',
        title: 'Live Preview',
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Live Preview</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              The Preview surface gives you real-time feedback on your application's appearance and functionality.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Accessible via the <strong>Preview</strong> tab, this environment renders the generated application inside a secure sandbox.
            </p>
            
            <div className="bg-[#05070e] p-5 rounded-xl border border-white/10 mt-4">
              <h3 className="text-white font-medium mb-3">Viewport Controls</h3>
              <p className="text-sm text-neutral-400">
                You can test responsive designs immediately by toggling the viewport buttons located in the top-left of the preview header:
              </p>
              <ul className="space-y-2 text-sm text-neutral-500 list-disc list-outside ml-5 mt-3">
                <li><strong>Desktop:</strong> Fills the available panel space.</li>
                <li><strong>Tablet:</strong> Constrains the view to 768px width.</li>
                <li><strong>Mobile:</strong> Constrains the view to 375px width and adds device bezels.</li>
              </ul>
            </div>
            
            <p className="text-neutral-400 leading-relaxed mt-4">
              Use the <strong className="text-white">Refresh</strong> button to force a full reload of the iframe, or the <strong className="text-white">External Link</strong> button to open the preview in a dedicated browser tab.
            </p>
          </div>
        )
      },
      {
        id: 'refinement',
        title: 'Follow-up Refinement',
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Follow-up Refinement</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              AI rarely gets a complex app perfectly right on the first try. Follow-up refinement is the core loop of working with LISSA.
            </p>
            
            <p className="text-neutral-400 leading-relaxed">
              In the <strong>Agent</strong> tab of the studio, you have access to a chat interface. This interface maintains context of the currently built code.
            </p>
            
            <h3 className="text-white font-medium mt-6 mb-2">How to Request Changes</h3>
            <div className="space-y-4 text-neutral-400">
              <p>1. <strong>Be explicit about targets:</strong> "Change the background color of the sidebar to deep purple."</p>
              <p>2. <strong>Fix errors by describing them:</strong> "When I click the submit button, the form doesn't clear. Please fix the state management."</p>
              <p>3. <strong>Add entirely new features:</strong> "Add a new settings page with toggles for email notifications and dark mode."</p>
            </div>
            
            <div className="p-4 border border-white/10 bg-black/40 rounded-lg mt-6 text-sm text-neutral-400 italic">
              Note: Every time you submit a follow-up prompt, LISSA analyzes the existing code, plans the modification, and generates the updated files. This consumes 1 build credit.
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'workflows',
    title: 'WORKFLOWS',
    items: [
      {
        id: 'repository-sync',
        title: 'Repository & Sync',
        toc: [
          { id: 'github-import', title: 'GitHub Imports' },
          { id: 'local-sessions', title: 'Local Sessions' }
        ],
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Repository & Sync</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              LISSA bridges the gap between AI generation and standard software engineering workflows.
            </p>

            <h2 id="github-import" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">GitHub Imports</h2>
            <p className="text-neutral-400 leading-relaxed">
              You can import existing repositories directly from GitHub. From the Builder Home, click <strong>Import repository</strong>. This securely fetches the source code and initializes a LISSA workspace. You can then use the Agent to explain, refactor, or extend your existing codebase.
            </p>

            <h2 id="local-sessions" className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Local vs. Synced Sessions</h2>
            <ul className="space-y-4 text-neutral-400 mt-4">
              <li className="flex flex-col gap-1">
                <span className="text-white font-medium">Local Sessions:</span>
                <span className="text-sm">Projects that are currently stored only in your browser's local storage. Clearing browser data may result in data loss.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-white font-medium">Synced Workspace:</span>
                <span className="text-sm">When authenticated, LISSA automatically syncs your project data to the cloud. You can resume these projects across devices as long as you log in with the same wallet.</span>
              </li>
            </ul>
          </div>
        )
      },
      {
        id: 'data-tools',
        title: 'Data Tools',
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Data Tools</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Manage structured data directly within the studio.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              The <strong>Data</strong> tab provides a project-scoped view of available data records and controls. Its contents depend on the current project and connected backend capabilities. Treat generated sample data separately from persistent application data, and verify the active environment before changing records.
            </p>
          </div>
        )
      },
      {
        id: 'deployments',
        title: 'Deployments',
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Deployments</h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Take your application from the sandbox to the public web.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              In the <strong>Deployments</strong> tab, review publication status and publish the current project files. A successful release returns a public URL that can be opened from the deployment panel.
            </p>
            <p className="text-neutral-400 leading-relaxed mt-4">
              Publishing uses the current generated files and preview document. If you edit the project after publishing, publish again when you are ready to update the live result. Always inspect the preview and resolve visible errors before starting a release.
            </p>
          </div>
        )
      }
    ]
  },
  {
    id: 'support',
    title: 'SUPPORT',
    items: [
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Troubleshooting</h1>
            
            <div className="space-y-4">
              <div className="bg-[#05070e] p-5 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-2">Blank Preview Screen</h3>
                <p className="text-sm text-neutral-400">This usually indicates a syntax error or a hydration mismatch in React. Open the <strong>Code</strong> tab, look for red squiggly lines in the editor, or tell the Agent: <em>"The app is rendering a blank screen, please fix the rendering errors."</em></p>
              </div>

              <div className="bg-[#05070e] p-5 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-2">Build Timeout / Stuck Agent</h3>
                <p className="text-sm text-neutral-400">If the generation hangs for more than 3 minutes, the build job likely failed upstream. Reload the page. LISSA uses recovery tokens; if the job completely failed, the system will prompt you to retry.</p>
              </div>

              <div className="bg-[#05070e] p-5 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-2">Wallet Connection Issues</h3>
                <p className="text-sm text-neutral-400">Ensure your wallet is connected to the <strong>Robinhood Chain</strong>. If you recently acquired LISSA tokens, it may take a few blocks for the chain to confirm the balance. Disconnect and reconnect your wallet.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'security',
        title: 'Security & Ownership',
        content: (
          <div className="space-y-6">
            <h1 className="text-4xl font-sans font-semibold tracking-tight text-white mb-2">Security & Ownership</h1>
            
            <h2 className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Intellectual Property</h2>
            <p className="text-neutral-400 leading-relaxed">
              You own the code generated by LISSA. You are free to export the code, deploy it elsewhere, monetize it, or open-source it. We enforce no proprietary licenses on the output.
            </p>

            <h2 className="text-2xl font-sans font-medium text-white pt-6 border-t border-white/10 scroll-m-20">Data Privacy</h2>
            <p className="text-neutral-400 leading-relaxed">
              Your project sessions are associated with the connected wallet identity. A wallet signature proves control of the address without exposing the wallet's private key and does not trigger a transaction. Never paste private keys, recovery phrases, production credentials, or other secrets into prompts or generated source files.
            </p>
          </div>
        )
      }
    ]
  }
];
