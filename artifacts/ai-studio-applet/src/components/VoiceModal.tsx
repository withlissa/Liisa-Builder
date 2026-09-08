

import React, { useState, useEffect } from "react";
import { Mic, X, Check, Square, Volume2 } from "lucide-react";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onTranscript,
}) => {
  const [isRecording, setIsRecording] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [waveform, setWaveform] = useState<number[]>([40, 60, 30, 80, 50, 90, 70, 45, 65, 85, 30, 50]);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate speech detection progression
    const phrases = [
      "Build a modern SaaS application for borrower loan pre-approvals...",
      "Include interactive charts, loan calculator, and dark mode theme...",
    ];

    let currentIdx = 0;
    const transcriptTimer = setInterval(() => {
      if (currentIdx < phrases.length) {
        setTranscript((prev) => (prev ? prev + " " : "") + phrases[currentIdx]);
        currentIdx++;
      }
    }, 1200);

    const waveTimer = setInterval(() => {
      setWaveform((prev) =>
        prev.map(() => Math.floor(Math.random() * 70) + 20)
      );
    }, 150);

    return () => {
      clearInterval(transcriptTimer);
      clearInterval(waveTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDone = () => {
    setIsRecording(false);
    onTranscript(
      transcript || "Build an automated CRM for borrower management with real-time financial metrics"
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-[#13141a] border border-white/10 rounded-3xl p-8 shadow-2xl relative text-center text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing Mic Badge */}
        <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping"></div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/30 relative z-10">
            <Mic className="w-7 h-7 text-white animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2">Listening to your idea...</h3>
        <p className="text-xs text-neutral-400 mb-6">
          Describe the features, layout, and functionality you want Lissa to build.
        </p>

        {/* Animated Waveform Visualizer */}
        <div className="flex items-center justify-center gap-1.5 h-12 mb-6 px-4">
          {waveform.map((h, idx) => (
            <div
              key={idx}
              className="w-1.5 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-full transition-all duration-150"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {/* Live Transcript Box */}
        <div className="bg-[#1c1d25] border border-white/5 rounded-2xl p-4 text-left min-h-[72px] mb-6">
          <span className="text-[10px] uppercase font-semibold text-blue-400 tracking-wider block mb-1">
            Live Speech Transcript:
          </span>
          <p className="text-xs text-neutral-200 italic">
            &quot;{transcript || "Listening..."}&quot;
          </p>
        </div>

        {/* Done Actions */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-neutral-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Prompt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
