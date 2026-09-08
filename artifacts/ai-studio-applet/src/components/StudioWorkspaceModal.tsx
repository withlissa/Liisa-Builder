

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Eye,
  Download,
  Share2,
  GitBranch,
  Sparkles,
  Send,
  CheckCircle2,
  Circle,
  FileCode,
  Layers,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Project, PreviewDevice, EditorView, ProjectFile } from "@/lib/types";
import { useBuildApp } from "@workspace/api-client-react";

interface StudioWorkspaceModalProps {
  project: Project | null;
  onClose: () => void;
  onUpdateProject: (updated: Project) => void;
  isInitialGenerating?: boolean;
}

export const StudioWorkspaceModal: React.FC<StudioWorkspaceModalProps> = ({
  project,
  onClose,
  onUpdateProject,
  isInitialGenerating = false,
}) => {
  const buildApp = useBuildApp();
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [view, setView] = useState<EditorView>("split");
  const [activeFile, setActiveFile] = useState<string>(
    project?.files[0]?.name || "App.tsx"
  );
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(isInitialGenerating);
  const [copiedCode, setCopiedCode] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<
    { title: string; completed: boolean; current?: boolean }[]
  >([
    { title: "Analyzing prompt & application architecture", completed: true },
    { title: "Building responsive layout & theme", completed: true },
    { title: "Writing modular components & interactive state", completed: true },
    { title: "Assembling live sandbox environment", completed: true },
  ]);

  const [chatMessages, setChatMessages] = useState<
    { sender: "ai" | "user"; text: string; time: string }[]
  >(() => [
    {
      sender: "ai",
      text: project
        ? `Welcome to the studio for **${project.title}**. I've assembled the architecture, design system, and live sandbox preview. What would you like to build or iterate next?`
        : "Welcome to the studio!",
      time: "Just now",
    },
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Trigger celebratory confetti on initial load
  useEffect(() => {
    if (!project) return;
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // Ignore if not supported
    }
  }, [project]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isProcessing]);

  if (!project) return null;

  // Handle incremental build requests.
  const handleSendPrompt = async () => {
    if (!chatInput.trim() || isProcessing) return;

    const userPrompt = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: userPrompt, time: "Just now" },
    ]);
    setIsProcessing(true);

    // Update build steps.
    setGenerationSteps([
      { title: `Analyzing request: "${userPrompt}"`, completed: true },
      { title: "Updating component logic and Tailwind classes", completed: false, current: true },
      { title: "Hot reloading live sandbox preview", completed: false },
    ]);

    buildApp.mutate({
      data: {
        prompt: `Iterate on project "${project.title}". User requested: "${userPrompt}". Update the code and UI accordingly.`,
        mode: "build",
        existingCode: project.files.map((f) => `// File: ${f.name}\n${f.code}`).join("\n\n"),
      }
    }, {
      onSuccess: (data) => {
        // Update files & preview if returned
        const updatedFiles = data.files && data.files.length > 0 ? data.files : project.files;
        const updatedHtml = data.htmlPreview || project.htmlPreview;

        const updatedProject: Project = {
          ...project,
          title: data.title || project.title,
          subtitle: data.description || project.subtitle,
          files: updatedFiles,
          htmlPreview: updatedHtml,
          lastEdited: "Just now",
        };

        onUpdateProject(updatedProject);

        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `Applied updates for: "${userPrompt}". The live preview and component files have been updated.`,
            time: "Just now",
          },
        ]);
      },
      onError: (err: Error) => {
        console.error(err);
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `The build could not apply changes for "${userPrompt}". Please try again.`,
            time: "Just now",
          },
        ]);
      },
      onSettled: () => {
        setIsProcessing(false);
        setGenerationSteps((prev) =>
          prev.map((step) => ({ ...step, completed: true, current: false }))
        );
      }
    });
  };

  const currentFileObj =
    project.files.find((f) => f.name === activeFile) || project.files[0];

  const handleCopyCode = () => {
    if (currentFileObj) {
      navigator.clipboard.writeText(currentFileObj.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadZip = () => {
    const codeBlob = new Blob([currentFileObj?.code || ""], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(codeBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.slug}-${activeFile}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = project.htmlPreview;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0d12] flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Studio Header Bar */}
      <header className="h-14 bg-[#111217] border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0">
        {/* Left: Close button + Logo + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition"
            title="Back to Dashboard"
            id="btn-studio-close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <img
              src="/brand/lissa-logo.jpg"
              alt="Lissa"
              className="w-6 h-6 rounded-md object-cover shadow-sm ring-1 ring-white/15"
            />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white tracking-tight">
                {project.title}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 flex items-center gap-1 border border-white/5">
                <GitBranch className="w-2.5 h-2.5" />
                main
              </span>
            </div>
          </div>
        </div>

        {/* Center: Device Switcher + View Switcher */}
        <div className="hidden md:flex items-center gap-2">
          {/* Device Toggles */}
          <div className="flex items-center bg-[#18191f] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-lg text-xs transition ${
                device === "desktop"
                  ? "bg-[#272832] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Desktop View (100%)"
              id="btn-device-desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`p-1.5 rounded-lg text-xs transition ${
                device === "tablet"
                  ? "bg-[#272832] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Tablet View (768px)"
              id="btn-device-tablet"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-lg text-xs transition ${
                device === "mobile"
                  ? "bg-[#272832] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Mobile View (375px)"
              id="btn-device-mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-[#18191f] p-1 rounded-xl border border-white/5 text-xs font-medium">
            <button
              onClick={() => setView("preview")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                view === "preview"
                  ? "bg-[#272832] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
              id="btn-view-preview"
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setView("split")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                view === "split"
                  ? "bg-[#272832] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
              id="btn-view-split"
            >
              <Layers className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setView("code")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                view === "code"
                  ? "bg-[#272832] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
              id="btn-view-code"
            >
              <Code className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Right: Actions (Share, Export, Reload, Deploy) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReloadPreview}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
            title="Reload Sandbox"
            id="btn-studio-reload"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyCode}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium transition border border-white/5"
            title="Copy Code"
            id="btn-studio-copy"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadZip}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium transition border border-white/5"
            title="Export Source Files"
            id="btn-studio-export"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => {
              alert(`Project "${project.title}" was published from the Lissa workspace.`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
            id="btn-studio-publish"
          >
            <Share2 className="w-3 h-3" />
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body (Split Panel) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: AI Assistant, Chat, Code/Plan Tabs */}
        {(view === "split" || view === "code") && (
          <div className="w-full md:w-[420px] lg:w-[460px] bg-[#101116] border-r border-white/[0.08] flex flex-col shrink-0">
            {/* Left Header Tabs: Chat vs Architecture vs Files */}
            <div className="border-b border-white/5 px-4 py-2 flex items-center justify-between bg-[#14151b]">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Lissa AI Agent
                </span>
              </div>
              <div className="flex items-center gap-1">
                {project.files.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => setActiveFile(file.name)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                      activeFile === file.name
                        ? "bg-blue-600/20 text-blue-400 font-semibold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Middle: Chat Messages & Step Progress */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Build checklist status */}
              <div className="bg-[#181920] border border-white/5 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Architecture & Build Status</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    ● Ready
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {generationSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-[11px] text-neutral-300"
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : step.current ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-neutral-600 shrink-0 mt-0.5" />
                      )}
                      <span className={step.completed ? "text-neutral-300" : "text-neutral-500"}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Thread */}
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-[#181920] border border-white/5 text-neutral-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-neutral-500 mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-950/20 border border-blue-800/30 p-3 rounded-xl animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Lissa is applying the requested modifications...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Bottom Prompt Input inside Studio */}
            <div className="p-3 border-t border-white/[0.08] bg-[#14151b]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPrompt();
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Lissa to edit or add features..."
                  className="w-full bg-[#1e1f26] text-white text-xs placeholder-neutral-400 pl-3.5 pr-10 py-3 rounded-xl border border-white/10 focus:border-blue-500 focus:outline-none transition"
                  id="input-studio-chat"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isProcessing}
                  className={`absolute right-2 p-1.5 rounded-lg transition ${
                    chatInput.trim() && !isProcessing
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "text-neutral-500 hover:text-neutral-400"
                  }`}
                  id="btn-studio-send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Right Side: Live Sandbox Preview / Code Viewer */}
        {(view === "split" || view === "preview") && (
          <div className="flex-1 bg-[#090a0e] flex flex-col items-center justify-center p-3 sm:p-6 overflow-auto">
            {/* Device Container Frame */}
            <div
              className={`transition-all duration-300 bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-800 flex flex-col ${
                device === "mobile"
                  ? "w-[375px] h-[720px] max-h-full"
                  : device === "tablet"
                  ? "w-[768px] h-[850px] max-h-full"
                  : "w-full h-full"
              }`}
            >
              {/* Browser bar for sandbox */}
              <div className="h-7 bg-[#1c1d24] border-b border-neutral-700/80 px-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>
                <div className="px-3 py-0.5 rounded bg-black/40 text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                  <span>Published URL is created during deployment</span>
                </div>
                <div className="w-8"></div>
              </div>

              {/* Iframe rendering the standalone interactive web app preview */}
              <iframe
                ref={iframeRef}
                srcDoc={project.htmlPreview}
                title={project.title}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="w-full flex-1 border-0 bg-white"
              />
            </div>
          </div>
        )}

        {/* Code Full View */}
        {view === "code" && (
          <div className="flex-1 bg-[#0e0f14] p-6 overflow-auto font-mono text-xs text-neutral-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <span className="text-blue-400 font-semibold">{currentFileObj?.name}</span>
              <button
                onClick={handleCopyCode}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 bg-[#14151b] rounded-xl border border-white/5 overflow-x-auto text-[13px] leading-relaxed">
              <code>{currentFileObj?.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
