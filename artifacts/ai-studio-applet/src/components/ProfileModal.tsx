

import React from "react";
import { X, User, Zap, Shield, Key, Sparkles, Check, CreditCard, LogOut } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-[#14151b] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            J
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Jenn Miller</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold tracking-wide uppercase">
                Pro Member
              </span>
            </div>
            <span className="text-xs text-neutral-400">havenamehyper@gmail.com</span>
          </div>
        </div>

        {/* Credits & Usage */}
        <div className="bg-[#1a1b22] border border-white/5 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-300 font-medium">Build Credits</span>
            <span className="text-emerald-400 font-semibold">Unlimited (Active)</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-[35%] rounded-full"></div>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Build usage</span>
            <span>Resets on Oct 1</span>
          </div>
        </div>

        {/* Account Details & Plan Features */}
        <div className="space-y-2 text-xs text-neutral-300 mb-6">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Full-Stack Next.js Codebase Builds</span>
            </div>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Custom Domains & SSL Deployments</span>
            </div>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-purple-400" />
              <span>Build workspace access</span>
            </div>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-blue-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
