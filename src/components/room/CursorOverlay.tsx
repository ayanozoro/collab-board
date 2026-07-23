"use client";

import { useCanvasStore } from "@/store/canvasStore";

export default function CursorOverlay() {
  const cursors = useCanvasStore((state) => state.cursors);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {Object.entries(cursors).map(([userId, c]) => {
        if (c.x === undefined || c.y === undefined) return null;

        return (
          <div
            key={userId}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: `${c.x}px`,
              top: `${c.y}px`,
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-md"
              style={{ color: c.color }}
            >
              <path
                d="M5.65376 12.3963L15.9392 2.11082C16.3297 1.7203 16.9629 1.7203 17.3534 2.11082L21.8892 6.6466C22.2797 7.03712 22.2797 7.67029 21.8892 8.06081L11.6037 18.3463"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M3 3L10.07 20.07L13.07 13.07L20.07 10.07L3 3Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Username Badge */}
            <div
              className="ml-4 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: c.color,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {c.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
