import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Mic,
  ArrowUp,
  ChevronDown,
  Sparkles,
  Layers,
  Zap,
  ArrowRight,
  MessageSquare,
  Paperclip,
  Code2,
  Check,
} from "lucide-react";
import { PromptMode } from "@/lib/types";

interface HeroPromptSectionProps {
  onStartBuild: (prompt: string, mode: PromptMode) => void;
  onOpenSlack: () => void;
  onOpenVoice: () => void;
  onOpenContext: () => void;
  isGenerating?: boolean;
}

export const HeroPromptSection: React.FC<HeroPromptSectionProps> = ({
  onStartBuild,
  onOpenSlack,
  onOpenVoice,
  onOpenContext,
  isGenerating = false,
}) => {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<PromptMode>("Plan");
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 44),
        160
      )}px`;
    }
  }, [prompt]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onStartBuild(prompt.trim(), mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const examplePrompts = [
    "Build a conversational AI loan pre-approval portal",
    "Create a multichain DEX with token swap & liquidity pool",
    "Design an aesthetic minimal e-commerce store with cart",
    "Construct a biometric health recovery dashboard",
  ];

  return (
    <section className="w-full flex flex-col items-center justify-center pt-8 pb-10 px-4 z-10 select-none">
      {/* Slack Integration Announcement Pill */}
      <div className="mb-6 animate-fade-in">
        <button
          onClick={onOpenSlack}
          className="group inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/20 text-xs text-white/90 backdrop-blur-md transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          id="btn-slack-announcement"
        >
          <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-[10px] font-bold text-white tracking-wide uppercase">
            New
          </span>
          <div className="flex items-center gap-1.5">
            {/* Slack colored hashtag icon */}
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523 2.52 2.52 0 0 1 2.52-2.52h2.52v2.52c0 1.394-1.127 2.523-2.52 2.523z"
                fill="#E01E5A"
              />
              <path
                d="M6.304 15.165a2.528 2.528 0 0 1 2.52-2.523 2.52 2.52 0 0 1 2.52 2.523v6.307a2.52 2.52 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.52-2.52v-6.307z"
                fill="#E01E5A"
              />
              <path
                d="M8.824 5.043a2.528 2.528 0 0 1-2.52-2.52 2.52 2.52 0 0 1 2.52-2.523 2.528 2.528 0 0 1 2.52 2.523v2.52h-2.52z"
                fill="#36C5F0"
              />
              <path
                d="M8.824 6.305a2.528 2.528 0 0 1 2.52 2.52 2.52 2.52 0 0 1-2.52 2.524H2.522A2.52 2.52 0 0 1 0 8.825a2.528 2.528 0 0 1 2.522-2.52h6.302z"
                fill="#36C5F0"
              />
              <path
                d="M18.878 8.825a2.528 2.528 0 0 1 2.52 2.524 2.52 2.52 0 0 1-2.52 2.52h-2.52v-2.52c0-1.395 1.126-2.524 2.52-2.524z"
                fill="#2EB67D"
              />
              <path
                d="M17.616 8.825a2.528 2.528 0 0 1-2.52 2.524 2.52 2.52 0 0 1-2.52-2.524V2.523A2.52 2.52 0 0 1 15.096 0a2.528 2.528 0 0 1 2.52 2.523v6.302z"
                fill="#2EB67D"
              />
              <path
                d="M15.096 18.877a2.528 2.528 0 0 1 2.52 2.52 2.52 2.52 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.52-2.523v-2.52h2.52z"
                fill="#ECB22E"
              />
              <path
                d="M15.096 17.615a2.528 2.528 0 0 1-2.52-2.52 2.52 2.52 0 0 1 2.52-2.523h6.302a2.52 2.52 0 0 1 2.522 2.523 2.528 2.528 0 0 1-2.522 2.52h-6.302z"
                fill="#ECB22E"
              />
            </svg>
            <span className="font-medium text-[13px]">Talk to Lissa in Slack</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-[38px] font-semibold text-white tracking-tight text-center mb-8 drop-shadow-sm">
        Ready to build, jenn?
      </h1>

      {/* Main Prompt Input Box */}
      <div className="w-full max-w-2xl bg-[#1c1d22]/90 hover:bg-[#1f2026] border border-white/10 focus-within:border-white/20 rounded-[22px] p-3 shadow-2xl backdrop-blur-xl transition-all relative">
        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Lissa to"
          rows={1}
          className="w-full bg-transparent text-white placeholder-neutral-400 text-[15px] sm:text-[16px] px-3 pt-1.5 pb-2 resize-none focus:outline-none leading-relaxed min-h-[44px]"
          id="input-lissa-prompt"
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-2 px-1 border-t border-white/[0.04]">
          {/* Left: Plus / Attach Context button */}
          <button
            type="button"
            onClick={onOpenContext}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Attach images, Figma URLs, GitHub, or data context"
            id="btn-prompt-attach"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Right Controls: Plan selector, Mic, Submit Button */}
          <div className="flex items-center gap-2">
            {/* Mode Dropdown (Plan / Build / Chat) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent hover:bg-white/5 text-neutral-300 hover:text-white text-xs font-medium transition"
                id="btn-mode-dropdown"
              >
                <span>{mode}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showModeDropdown && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#18191f] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("Plan");
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${
                      mode === "Plan"
                        ? "bg-blue-600/20 text-blue-400 font-semibold"
                        : "text-neutral-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Plan</span>
                    </div>
                    {mode === "Plan" && <Check className="w-3 h-3 text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("Build");
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${
                      mode === "Build"
                        ? "bg-blue-600/20 text-blue-400 font-semibold"
                        : "text-neutral-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Build</span>
                    </div>
                    {mode === "Build" && <Check className="w-3 h-3 text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("Chat");
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${
                      mode === "Chat"
                        ? "bg-blue-600/20 text-blue-400 font-semibold"
                        : "text-neutral-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </div>
                    {mode === "Chat" && <Check className="w-3 h-3 text-blue-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Microphone Icon */}
            <button
              type="button"
              onClick={onOpenVoice}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Speak with Lissa (Voice input)"
              id="btn-prompt-voice"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Submit Arrow Button */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!prompt.trim() || isGenerating}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                prompt.trim() && !isGenerating
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 scale-100"
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
              title="Build Application"
              id="btn-prompt-submit"
            >
              {isGenerating ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Inspiration Prompts */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mt-4">
        {examplePrompts.map((sample, i) => (
          <button
            key={i}
            onClick={() => setPrompt(sample)}
            className="text-[11px] text-neutral-300/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 px-3 py-1.5 rounded-full transition-all text-left truncate max-w-[280px]"
            title={sample}
          >
            <Sparkles className="w-3 h-3 inline-block mr-1 opacity-70" /> {sample}
          </button>
        ))}
      </div>
    </section>
  );
};
