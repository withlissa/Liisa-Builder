

import React, { useState } from "react";
import { X, Search, Filter, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { Project } from "@/lib/types";

interface BrowseAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  templates: Project[];
  onSelectProject: (p: Project) => void;
}

export const BrowseAllModal: React.FC<BrowseAllModalProps> = ({
  isOpen,
  onClose,
  projects,
  templates,
  onSelectProject,
}) => {
  const [filter, setFilter] = useState<"all" | "projects" | "templates">("all");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const combined = [
    ...(filter === "all" || filter === "projects" ? projects : []),
    ...(filter === "all" || filter === "templates" ? templates : []),
  ];

  const filtered = combined.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in select-none">
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#121318] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Explore Workspace & Templates</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Browse all your created apps and official starter templates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps by keyword..."
              className="w-full bg-[#1b1c23] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#1a1b22] p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "all" ? "bg-[#272832] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({projects.length + templates.length})
            </button>
            <button
              onClick={() => setFilter("projects")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "projects" ? "bg-[#272832] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              My Projects ({projects.length})
            </button>
            <button
              onClick={() => setFilter("templates")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === "templates" ? "bg-[#272832] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Lissa Templates ({templates.length})
            </button>
          </div>
        </div>

        {/* Grid List */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectProject(item);
                onClose();
              }}
              className="group bg-[#181920] hover:bg-[#1f202a] border border-white/5 hover:border-white/20 rounded-2xl p-5 cursor-pointer flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-950/40 border border-blue-900/40 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-neutral-500">{item.lastEdited}</span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  {item.tags.slice(0, 2).map((t, idx) => (
                    <span key={idx} className="text-[9px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
