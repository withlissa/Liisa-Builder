

import React, { useState } from "react";
import { Search, ArrowRight, Plus, Sparkles, ExternalLink, Clock, Layers, Star } from "lucide-react";
import { Project, ActiveTab } from "@/lib/types";

interface BottomProjectsShelfProps {
  projects: Project[];
  templates: Project[];
  onSelectProject: (project: Project) => void;
  onOpenNewProjectModal: () => void;
  onOpenBrowseAll: () => void;
}

export const BottomProjectsShelf: React.FC<BottomProjectsShelfProps> = ({
  projects,
  templates,
  onSelectProject,
  onOpenNewProjectModal,
  onOpenBrowseAll,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("projects");
  const [searchQuery, setSearchQuery] = useState("");

  const currentList =
    activeTab === "templates"
      ? templates
      : activeTab === "recent"
      ? projects.slice(0, 3)
      : projects;

  const filteredList = currentList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#131418]/95 border-t border-white/[0.08] rounded-t-3xl pt-5 pb-8 px-6 lg:px-10 shadow-2xl backdrop-blur-2xl z-20 select-none">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Left: Search input + Filter tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input Pill */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="bg-[#1e1f25] hover:bg-[#24252c] focus:bg-[#24252c] text-neutral-200 placeholder-neutral-400 text-xs pl-8 pr-3 py-2 rounded-xl border border-white/5 focus:border-white/20 focus:outline-none transition w-36 sm:w-44"
              id="input-bottom-search"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#18191f] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "projects"
                  ? "bg-[#272832] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              id="tab-my-projects"
            >
              My projects
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "recent"
                  ? "bg-[#272832] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              id="tab-recently-viewed"
            >
              Recently viewed
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "templates"
                  ? "bg-[#272832] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              id="tab-lissa-templates"
            >
              Lissa templates
            </button>
          </div>
        </div>

        {/* Right: Browse all link */}
        <button
          onClick={onOpenBrowseAll}
          className="group flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white font-medium transition"
          id="btn-browse-all"
        >
          <span>Browse all</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-x-auto pb-2">
        {/* Render Projects */}
        {filteredList.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="group cursor-pointer bg-[#191a21] hover:bg-[#1e1f28] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between relative"
            id={`card-project-${project.id}`}
          >
            {/* Visual Thumbnail Representation */}
            <div className="h-44 w-full relative overflow-hidden bg-neutral-900 flex items-center justify-center p-3">
              {project.thumbnailType === "boomerang" ? (
                // Boomerang Light UI mockup
                <div className="w-full h-full bg-[#faf9f5] rounded-xl p-3 text-neutral-900 flex flex-col justify-between shadow-inner border border-neutral-200/80 overflow-hidden">
                  <div className="flex items-center justify-between text-[9px] text-neutral-500 font-semibold">
                    <span className="flex items-center gap-1 font-bold text-neutral-900">
                      <span className="w-1.5 h-1.5 bg-black rounded-full"></span> Boomerang
                    </span>
                    <span className="bg-black text-white px-2 py-0.5 rounded text-[8px]">Book A Demo</span>
                  </div>
                  <div className="text-center my-auto">
                    <div className="font-serif text-lg font-normal leading-tight text-neutral-900">
                      Build lasting<br />relationships.
                    </div>
                    <p className="text-[8px] text-neutral-500 line-clamp-1 mt-1 max-w-[200px] mx-auto">
                      Conversational AI platform for modern financial institutions.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-1.5 border border-neutral-200/90 text-[8px] flex items-center justify-between text-neutral-600">
                    <span>Borrower #4928</span>
                    <span className="text-emerald-600 font-semibold">Pre-Approved</span>
                  </div>
                </div>
              ) : project.thumbnailType === "dex" ? (
                // ABAB DEX Dark UI mockup
                <div className="w-full h-full bg-[#0b0d14] rounded-xl p-3 text-white flex flex-col justify-between shadow-inner border border-neutral-800 overflow-hidden">
                  <div className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1 font-bold">
                      <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 inline-block text-[7px] text-center text-black font-black">AB</span>
                      <span>ABAB</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-neutral-800 text-[8px] rounded text-neutral-400">Robinhood Chain</span>
                  </div>
                  <div className="my-auto">
                    <div className="text-xs font-extrabold tracking-tight">
                      Everyone&apos;s Favorite <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">DEX</span>
                    </div>
                    {/* Stats pill preview */}
                    <div className="grid grid-cols-2 gap-1 mt-1.5 text-[7px]">
                      <div className="bg-neutral-900 border border-neutral-800 rounded p-1">
                        <span className="text-neutral-400 block">Users</span>
                        <span className="font-bold text-white">3,204,881</span>
                      </div>
                      <div className="bg-neutral-900 border border-neutral-800 rounded p-1">
                        <span className="text-neutral-400 block">TVL</span>
                        <span className="font-bold text-emerald-400">$1.84B</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[8px]">
                    <span className="text-neutral-400">Trade, Earn, Win</span>
                    <span className="bg-blue-600 px-2 py-0.5 rounded text-white font-medium">Connect</span>
                  </div>
                </div>
              ) : project.thumbnailType === "desk" ? (
                // Desk Dark Minimalist mockup
                <div className="w-full h-full bg-[#0e0e11] rounded-xl p-3 text-white flex flex-col justify-between border border-neutral-800">
                  <div className="text-[8px] font-mono text-amber-400 tracking-widest uppercase">DESK // 01</div>
                  <div className="my-auto text-left">
                    <div className="text-xs font-mono font-bold text-white leading-tight">
                      Banks own you.<br /><span className="text-neutral-400">We fund you.</span>
                    </div>
                    <p className="text-[8px] text-neutral-500 font-mono mt-1">
                      No liquidations. Terms fixed at funding.
                    </p>
                  </div>
                  <div className="text-[8px] font-mono text-neutral-400 flex items-center justify-between">
                    <span>Collateral: Vault A</span>
                    <span className="text-amber-400">Fixed Rate</span>
                  </div>
                </div>
              ) : (
                // Generic modern app mockup
                <div className="w-full h-full bg-neutral-950 rounded-xl p-3 text-white flex flex-col justify-between border border-neutral-800">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="font-bold text-blue-400">{project.title}</span>
                    <span className="text-neutral-500 text-[8px]">{project.category}</span>
                  </div>
                  <div className="my-auto text-center">
                    <span className="text-xs font-semibold text-white block">{project.subtitle}</span>
                  </div>
                  <div className="text-[8px] text-neutral-400 flex justify-between">
                    <span>Preview Ready</span>
                    <span className="text-emerald-400">● Interactive</span>
                  </div>
                </div>
              )}

              {/* Hover Overlay Button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
                <span className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-all">
                  <span>Open Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card Footer Info */}
            <div className="p-3.5 flex flex-col justify-between gap-2 border-t border-white/5">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                    {project.title}
                  </h3>
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {project.lastEdited}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {project.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {project.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-neutral-300 border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Create New Project Card */}
        <button
          onClick={onOpenNewProjectModal}
          className="h-full min-h-[220px] bg-[#16171e]/60 hover:bg-[#1c1d25] border border-dashed border-white/15 hover:border-blue-500/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-neutral-400 hover:text-white transition-all group"
          id="btn-card-create-new"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-blue-600/20 text-neutral-300 group-hover:text-blue-400 border border-white/10 group-hover:border-blue-500/30 flex items-center justify-center transition">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-center">
            <span className="text-xs font-semibold text-white block">Create New Project</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Start with custom AI prompt</span>
          </div>
        </button>
      </div>
    </div>
  );
};
