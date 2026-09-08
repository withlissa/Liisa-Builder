

import React from "react";
import {
  Home,
  Search,
  GitBranch,
  MessageSquare,
  LayoutGrid,
  Sparkles,
  Settings,
} from "lucide-react";
import { LeftNavTab } from "@/lib/types";

interface SidebarRailProps {
  activeTab: LeftNavTab;
  onSelectTab: (tab: LeftNavTab) => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  onSelectTab,
  onOpenProfile,
  onOpenSearch,
}) => {
  return (
    <aside className="w-14 shrink-0 bg-[#0d0e12]/90 border-r border-white/5 flex flex-col items-center justify-between py-4 z-40 select-none">
      {/* Top section: Logo + Profile + Main Nav */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Lissa Logo */}
        <button
          onClick={() => onSelectTab("home")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group relative"
          title="Lissa Home"
          id="btn-sidebar-logo"
        >
          <img
            src="/brand/lissa-logo.jpg"
            alt="Lissa"
            className="w-8 h-8 rounded-lg object-cover shadow-md shadow-blue-600/20 ring-1 ring-white/15"
          />
        </button>

        {/* User Profile Avatar "J" */}
        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-600/30 transition-transform hover:scale-105 active:scale-95 relative group"
          title="Jenn's Workspace"
          id="btn-sidebar-profile"
        >
          <span>J</span>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d0e12]"></span>
        </button>

        {/* Divider */}
        <div className="w-6 h-[1px] bg-white/10 my-1"></div>

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {/* Home */}
          <button
            onClick={() => onSelectTab("home")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "home"
                ? "bg-white/10 text-white shadow-inner"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
            title="Home"
            id="btn-sidebar-home"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* Search */}
          <button
            onClick={onOpenSearch}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "search"
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
            title="Search & Quick Actions (Cmd+K)"
            id="btn-sidebar-search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Git Branch / Workflow */}
          <button
            onClick={() => onSelectTab("branches")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "branches"
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
            title="Branches & Deployments"
            id="btn-sidebar-branches"
          >
            <GitBranch className="w-4 h-4" />
          </button>

          {/* Chat / Feedback */}
          <button
            onClick={() => onSelectTab("feedback")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "feedback"
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
            title="Community & Feedback"
            id="btn-sidebar-feedback"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* All Apps / Templates */}
          <button
            onClick={() => onSelectTab("apps")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "apps"
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
            title="App Gallery & Integrations"
            id="btn-sidebar-apps"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </nav>
      </div>

      {/* Bottom Section: Lissa engine status */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full bg-black border border-white/15 hover:border-white/40 flex items-center justify-center transition shadow-lg group"
          title="Lissa Build Engine"
          id="btn-sidebar-engine"
        >
          <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-black"></span>
          </div>
        </button>
      </div>
    </aside>
  );
};
