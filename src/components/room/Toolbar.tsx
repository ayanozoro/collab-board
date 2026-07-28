"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { Tool } from "@/types/drawing";
import { sendWSMessage } from "@/hooks/useWebSocket";

const TOOLS = [
  { id: "select", icon: "arrow_selector_tool", label: "Select (V)", key: "v" },
  { id: "laser",  icon: "flare",               label: "Laser Pointer (K)", key: "k" },
  { id: "pen",    icon: "edit",                label: "Pen (P)", key: "p" },
  { id: "eraser", icon: "ink_eraser",          label: "Eraser (E)", key: "e" },
  { id: "rect",   icon: "crop_square",         label: "Rectangle (R)", key: "r" },
  { id: "circle", icon: "circle",              label: "Circle (C)", key: "c" },
  { id: "line",   icon: "horizontal_rule",     label: "Line (L)", key: "l" },
] as const;

const COLORS = [
  { value: "#d2bbff", label: "Lavender" },
  { value: "#4cd7f6", label: "Cyan" },
  { value: "#10b981", label: "Green" },
  { value: "#eab308", label: "Yellow" },
  { value: "#ff7b00", label: "Orange" },
  { value: "#ffffff", label: "White" },
];

const SIZES = [
  { value: 2, label: "Thin" },
  { value: 5, label: "Medium" },
  { value: 10, label: "Thick" },
  { value: 20, label: "Extra Thick" },
];

interface ToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
}

export default function Toolbar({ onUndo: _onUndo, onRedo: _onRedo, onClear }: ToolbarProps) {
  const {
    tool,
    color,
    size,
    setTool,
    setColor,
    setSize,
    clearCanvas,
    strokes,
    roomId,
  } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const matched = TOOLS.find((t) => t.key === key);
      if (matched) {
        setTool(matched.id as Tool);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTool]);


  return (
    <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
      {/* Tools Panel */}
      <div className="glass-panel rounded-2xl p-2 flex flex-col gap-1 shadow-2xl">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            id={`tool-${t.id}`}
            title={t.label}
            onClick={() => setTool(t.id as Tool)}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              tool === t.id
                ? "bg-[#d2bbff]/20 text-[#d2bbff] border border-[#d2bbff]/30 shadow-[0_0_12px_rgba(210,187,255,0.25)]"
                : "text-[#ccc3d8] hover:bg-[#2c363f]/60 hover:text-[#dae3f0]"
            }`}
          >
            {/* Active indicator bar */}
            {tool === t.id && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#d2bbff] rounded-r-full" />
            )}
            <span className="material-symbols-outlined text-[20px]">
              {t.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Styles Panel */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col gap-4 shadow-2xl w-[120px] transition-all duration-200">
        {/* Colors */}
        <div className={`flex flex-col gap-1.5 transition-opacity duration-200 ${tool === "eraser" ? "opacity-30 pointer-events-none" : ""}`}>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#958da1]">Colors</span>
          <div className="grid grid-cols-3 gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                title={c.label}
                className={`w-6 h-6 rounded-md border transition-all duration-150 relative cursor-pointer ${
                  color === c.value
                    ? "scale-110 shadow-md border-white/50"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
              >
                {color === c.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0a141d]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-[#4a4455]/40" />

        {/* Sizes */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#958da1]">Size</span>
          <div className="flex justify-between items-center px-1">
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                title={`${s.label} (${s.value}px)`}
                className={`flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer ${
                  size === s.value
                    ? "bg-[#d2bbff]/20 text-[#d2bbff] border border-[#d2bbff]/30 shadow-[0_0_12px_rgba(210,187,255,0.25)]"
                    : "text-[#ccc3d8] hover:bg-[#2c363f]/60 hover:text-[#dae3f0]"
                }`}
                style={{ width: "20px", height: "20px" }}
              >
                <div
                  className="rounded-full bg-current"
                  style={{
                    width: `${Math.max(3, Math.min(12, s.value / 1.5))}px`,
                    height: `${Math.max(3, Math.min(12, s.value / 1.5))}px`,
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Canvas Action */}
      <div className="glass-panel rounded-2xl p-2 flex flex-col gap-1 shadow-2xl">
        <button
          onClick={() => {
            if (strokes.length > 0 && confirm("Are you sure you want to clear the canvas?")) {
              if (onClear) {
                onClear();
              } else {
                clearCanvas();
              }
            }
          }}
          disabled={strokes.length === 0}
          title="Clear Canvas"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
            strokes.length === 0
              ? "text-[#4a4455] opacity-50 cursor-not-allowed"
              : "text-[#ffb4ab] hover:bg-[#93000a]/30 hover:text-[#ffdad6]"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </aside>
  );
}
