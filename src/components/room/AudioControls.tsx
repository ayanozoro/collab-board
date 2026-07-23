"use client";

import { useState } from "react";

export default function AudioControls() {
  const [muted, setMuted] = useState(true);

  return (
    <div id="audio-controls" className="flex items-center gap-2">
      <button
        id="mic-toggle-btn"
        title={muted ? "Unmute mic" : "Mute mic"}
        onClick={() => setMuted((m) => !m)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition
          ${muted
            ? "bg-slate-800 text-slate-500 hover:text-red-400"
            : "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
          }`}
      >
        {muted ? "🔇" : "🎙️"}
      </button>
    </div>
  );
}
