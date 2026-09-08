

import React, { useState } from "react";
import { X, Check, ArrowRight, MessageSquare, Bell, Zap, Shield } from "lucide-react";

interface SlackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SlackModal: React.FC<SlackModalProps> = ({ isOpen, onClose }) => {
  const [channel, setChannel] = useState("#product-builds");
  const [connected, setConnected] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-[#14151a] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
          id="btn-slack-modal-close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#4A154B] flex items-center justify-center shadow-lg">
            {/* Slack colored hashtag icon */}
            <svg
              className="w-5 h-5"
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
          </div>
          <div>
            <h2 className="text-base font-semibold">Talk to Lissa in Slack</h2>
            <p className="text-xs text-neutral-400">
              Trigger app builds and discuss changes directly in Slack channels.
            </p>
          </div>
        </div>

        <div className="bg-[#1a1b22] border border-white/5 rounded-xl p-4 my-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 font-medium">Workspace Integration</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              Connected to Acme Inc.
            </span>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Target Slack Channel:</label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full bg-[#111216] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 text-neutral-400 space-y-1 text-[11px]">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Sends real-time build notifications & live preview URLs</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Mention @Lissa in any thread to request code changes</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-neutral-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setConnected(true);
              setTimeout(() => onClose(), 800);
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
          >
            {connected ? "Connected!" : "Save & Enable Slack Bot"}
          </button>
        </div>
      </div>
    </div>
  );
};
