

import React, { useState, useEffect } from "react";
import { Search, X, Folder, Sparkles, ArrowRight, Code, FileText } from "lucide-react";
import { Project } from "@/lib/types";

interface SearchCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  templates: Project[];
  onSelectProject: (p: Project) => void;
  onQuickPrompt: (prompt: string) => void;
}

export const SearchCommandModal: React.FC<SearchCommandModalProps> = ({
  isOpen,
  onClose,
  projects,
  templates,
  onSelectProject,
  onQuickPrompt,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allItems = [...projects, ...templates];
  const results = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-[#14151b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-[#191a21]">
          <Search className="w-4 h-4 text-neutral-400 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, templates, or type prompt to build..."
            className="w-full bg-transparent text-sm text-white placeholder-neutral-400 focus:outline-none"
            id="input-cmd-search"
          />
          <span className="text-[10px] bg-white/10 text-neutral-400 px-2 py-0.5 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 text-xs divide-y divide-white/5">
          {query.trim() && (
            <div
              onClick={() => {
                onQuickPrompt(query);
                onClose();
              }}
              className="p-3 hover:bg-blue-600/20 text-blue-400 rounded-xl cursor-pointer flex items-center justify-between mb-1"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Build new app: &quot;{query}&quot;</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="py-2">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase px-3 mb-1 block">
              Projects & Templates
            </span>
            {results.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-xs">
                No matching projects found.
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectProject(item);
                    onClose();
                  }}
                  className="p-3 hover:bg-white/5 rounded-xl cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-300">
                      <Folder className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-500 bg-white/5 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
