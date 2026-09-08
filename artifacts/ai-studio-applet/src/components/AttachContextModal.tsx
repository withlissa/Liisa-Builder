

import React, { useState } from "react";
import { X, Upload, Link, Github, Figma, FileText, Check } from "lucide-react";

interface AttachContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (contextInfo: string) => void;
}

export const AttachContextModal: React.FC<AttachContextModalProps> = ({
  isOpen,
  onClose,
  onAttach,
}) => {
  const [tab, setTab] = useState<"file" | "url" | "github" | "figma">("file");
  const [urlInput, setUrlInput] = useState("");
  const [isAttached, setIsAttached] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    setIsAttached(true);
    setTimeout(() => {
      onAttach(`Attached ${tab.toUpperCase()} context: ${urlInput || "Mock Design Assets"}`);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-[#15161c] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-semibold mb-1">Add Context to Prompt</h2>
        <p className="text-xs text-neutral-400 mb-4">
          Provide designs, schemas, or existing repositories for Lissa to build against.
        </p>

        {/* Tab selectors */}
        <div className="grid grid-cols-4 gap-1 bg-[#1a1b22] p-1 rounded-xl border border-white/5 mb-4 text-xs font-medium">
          <button
            onClick={() => setTab("file")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              tab === "file" ? "bg-[#272832] text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Files</span>
          </button>
          <button
            onClick={() => setTab("figma")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              tab === "figma" ? "bg-[#272832] text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Figma className="w-3 h-3" />
            <span>Figma</span>
          </button>
          <button
            onClick={() => setTab("github")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              tab === "github" ? "bg-[#272832] text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Github className="w-3 h-3" />
            <span>GitHub</span>
          </button>
          <button
            onClick={() => setTab("url")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              tab === "url" ? "bg-[#272832] text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Link className="w-3 h-3" />
            <span>URL</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {tab === "file" && (
            <div className="border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl p-6 text-center cursor-pointer transition bg-white/[0.02]">
              <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
              <span className="text-xs font-semibold text-white block">
                Drag & Drop screenshots, wireframes, or CSV data
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Supports PNG, JPG, SVG, JSON, CSV (Max 25MB)
              </span>
            </div>
          )}

          {tab === "figma" && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Figma File or Node URL:</label>
              <input
                type="text"
                placeholder="https://www.figma.com/file/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-[#1a1b22] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {tab === "github" && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">GitHub Repository Link:</label>
              <input
                type="text"
                placeholder="https://github.com/owner/repo"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-[#1a1b22] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {tab === "url" && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Inspiration / Web URL:</label>
              <input
                type="text"
                placeholder="https://example.com/app"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-[#1a1b22] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-neutral-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
          >
            {isAttached ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Attached!</span>
              </>
            ) : (
              <span>Attach Context</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
