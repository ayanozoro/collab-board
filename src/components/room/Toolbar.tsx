"use client";

import { useState } from "react";

const TOOLS = [
  { id: "select", icon: "arrow_selector_tool", label: "Select (V)" },
  { id: "pen",    icon: "edit",                label: "Pen (P)" },
  { id: "shapes", icon: "category",            label: "Shapes (S)" },
  { id: "text",   icon: "text_fields",         label: "Text (T)" },
  { id: "note",   icon: "sticky_note_2",       label: "Sticky Note (N)" },
  { id: "image",  icon: "image",               label: "Image" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

export default function Toolbar() {
  const [active, setActive] = useState<ToolId>("select");

  return (
    <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40">
      <div className="glass-panel rounded-2xl p-2 flex flex-col gap-1 shadow-2xl">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            id={`tool-${t.id}`}
            title={t.label}
            onClick={() => setActive(t.id)}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
              active === t.id
                ? "bg-[#d2bbff]/20 text-[#d2bbff] border border-[#d2bbff]/30 shadow-[0_0_12px_rgba(210,187,255,0.25)]"
                : "text-[#ccc3d8] hover:bg-[#2c363f]/60 hover:text-[#dae3f0]"
            }`}
          >
            {/* Active indicator bar */}
            {active === t.id && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#d2bbff] rounded-r-full" />
            )}
            <span className="material-symbols-outlined text-[20px]">
              {t.icon}
            </span>
          </button>
        ))}

        {/* Divider */}
        <div className="w-7 h-px bg-[#4a4455]/50 mx-auto my-1" />

        {/* Eraser */}
        <button
          id="tool-eraser"
          title="Eraser"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#ccc3d8] hover:bg-[#93000a]/30 hover:text-[#ffb4ab] transition-all duration-150"
        >
          <span className="material-symbols-outlined text-[20px]">ink_eraser</span>
        </button>
      </div>
    </aside>
  );
}
