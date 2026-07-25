"use client";

import { useCanvasStore } from "@/store/canvasStore";

export default function AudioControls() {
  const { isMuted, toggleMute } = useCanvasStore();

  return (
    <div id="audio-controls" className="flex items-center gap-2">
      <button
        id="mic-toggle-btn"
        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        onClick={toggleMute}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 border cursor-pointer ${
          isMuted
            ? "bg-[#2c363f]/40 text-[#ccc3d8] border-[#958da1]/20 hover:bg-[#2c363f]/60 hover:text-[#dae3f0]"
            : "bg-[#7c3aed]/20 text-[#d2bbff] border-[#7c3aed]/30 shadow-[0_0_12px_rgba(124,58,237,0.25)] hover:bg-[#7c3aed]/30"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isMuted ? "mic_off" : "mic"}
        </span>
      </button>
    </div>
  );
}
