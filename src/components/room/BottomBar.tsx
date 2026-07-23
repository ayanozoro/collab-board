"use client";

import { useState } from "react";

export default function BottomBar() {
  const [zoom, setZoom] = useState(100);

  return (
    <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-panel h-12 rounded-xl flex items-center px-4 gap-3 z-50 shadow-2xl whitespace-nowrap">
      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          title="Undo"
          className="p-1.5 rounded-lg hover:bg-[#2c363f]/50 text-[#ccc3d8] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">undo</span>
        </button>
        <button
          title="Redo"
          className="p-1.5 rounded-lg hover:bg-[#2c363f]/50 text-[#ccc3d8] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">redo</span>
        </button>
      </div>

      <div className="h-4 w-px bg-[#4a4455]/40" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          title="Zoom out"
          onClick={() => setZoom((z) => Math.max(10, z - 10))}
          className="p-1 rounded hover:bg-[#2c363f]/50 text-[#ccc3d8] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
        <span className="text-sm font-medium text-[#dae3f0] min-w-[48px] text-center">
          {zoom}%
        </span>
        <button
          title="Zoom in"
          onClick={() => setZoom((z) => Math.min(400, z + 10))}
          className="p-1 rounded hover:bg-[#2c363f]/50 text-[#ccc3d8] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>

      <div className="h-4 w-px bg-[#4a4455]/40" />

      {/* Reset zoom */}
      <button
        title="Reset zoom"
        onClick={() => setZoom(100)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#2c363f]/50 text-[#ccc3d8] hover:text-[#d2bbff] transition-colors group"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
          center_focus_strong
        </span>
        <span className="text-xs font-medium">Fit</span>
      </button>
    </footer>
  );
}
