"use client";

import { useState } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { sendWSMessage } from "@/hooks/useWebSocket";
import { useAudio } from "@/hooks/useAudio";

export default function BottomBar() {
  const {
    undo,
    redo,
    historyIndex,
    history,
    roomId,
    strokes,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvasStore();
  const { isMuted, isDeafened, isSpeaking, toggleMute, toggleDeafen } = useAudio(roomId || "");

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (canUndo) {
      const removed = strokes[strokes.length - 1];
      undo();
      if (roomId && removed) {
        sendWSMessage({
          type: "undo",
          roomId,
          strokeId: removed.id,
        });
      }
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextState = history[historyIndex + 1];
      const added = nextState[nextState.length - 1];
      redo();
      if (roomId && added) {
        sendWSMessage({
          type: "draw-stroke",
          roomId,
          stroke: added,
        });
      }
    }
  };

  return (
    <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-panel h-12 rounded-xl flex items-center px-4 gap-3 z-50 shadow-2xl whitespace-nowrap">
      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          title="Undo"
          onClick={handleUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            canUndo
              ? "hover:bg-[#2c363f]/50 text-[#dae3f0]"
              : "text-[#4a4455] opacity-50 cursor-not-allowed"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">undo</span>
        </button>
        <button
          title="Redo"
          onClick={handleRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            canRedo
              ? "hover:bg-[#2c363f]/50 text-[#dae3f0]"
              : "text-[#4a4455] opacity-50 cursor-not-allowed"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">redo</span>
        </button>
      </div>

      <div className="h-4 w-px bg-[#4a4455]/40" />

      {/* Voice Chat Controls */}
      <div className="flex items-center gap-1">
        <button
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          onClick={toggleMute}
          className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
            !isMuted
              ? isSpeaking
                ? "bg-[#10b981]/20 text-[#10b981] ring-2 ring-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "bg-[#7c3aed]/20 text-[#d2bbff]"
              : "hover:bg-[#2c363f]/50 text-[#958da1]"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {!isMuted ? "mic" : "mic_off"}
          </span>
        </button>

        <button
          title={isDeafened ? "Undeafen Audio" : "Deafen Audio"}
          onClick={toggleDeafen}
          className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
            isDeafened
              ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
              : "hover:bg-[#2c363f]/50 text-[#ccc3d8]"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {!isDeafened ? "volume_up" : "volume_off"}
          </span>
        </button>
      </div>

      <div className="h-4 w-px bg-[#4a4455]/40" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          title="Zoom out"
          onClick={zoomOut}
          className="p-1 rounded hover:bg-[#2c363f]/50 text-[#ccc3d8] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
        <span className="text-sm font-medium text-[#dae3f0] min-w-[48px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          title="Zoom in"
          onClick={zoomIn}
          className="p-1 rounded hover:bg-[#2c363f]/50 text-[#ccc3d8] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>

      <div className="h-4 w-px bg-[#4a4455]/40" />

      {/* Reset zoom */}
      <button
        title="Reset zoom and pan"
        onClick={resetZoom}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#2c363f]/50 text-[#ccc3d8] hover:text-[#d2bbff] transition-colors group cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
          center_focus_strong
        </span>
        <span className="text-xs font-medium">Fit</span>
      </button>
    </footer>
  );
}

