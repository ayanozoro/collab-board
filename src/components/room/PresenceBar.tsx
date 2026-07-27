"use client";

import { usePresence } from "@/hooks/usePresence";
import { useCanvasStore } from "@/store/canvasStore";

interface PresenceBarProps {
  roomId: string;
}

export default function PresenceBar({ roomId }: PresenceBarProps) {
  const users = usePresence(roomId);
  const currentUser = useCanvasStore((state) => state.currentUser);

  // Helper to get initials
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div id="presence-bar" className="flex items-center">
      {users.map((u) => {
        const isSelf = u.id === currentUser?.id;
        return (
          <div
            key={u.id}
            title={isSelf ? `${u.name} (You)` : u.name}
            className={`relative flex h-8 w-8 -ml-2 first:ml-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 hover:-translate-y-1 hover:z-30 transition-all duration-200 cursor-default select-none ${
              u.isSpeaking
                ? "ring-[#10b981] scale-105 shadow-[0_0_12px_rgba(16,185,129,0.6)] z-20"
                : "ring-[#0a141d]"
            }`}
            style={{ backgroundColor: u.color }}
          >
            {getInitials(u.name)}

            {/* Muted mic badge indicator */}
            {u.isMuted && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#172129] border border-[#4a4455] text-[10px] text-[#958da1]">
                <span className="material-symbols-outlined text-[10px]">mic_off</span>
              </span>
            )}

            {/* Visual self indicator */}
            {isSelf && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            )}
          </div>
        );
      })}

      {users.length > 5 && (
        <div
          title={`${users.length - 5} more users`}
          className="flex h-8 w-8 -ml-2 items-center justify-center rounded-full text-[10px] font-bold text-[#ccc3d8] bg-[#2c363f]/80 ring-2 ring-[#0a141d] select-none"
        >
          +{users.length - 5}
        </div>
      )}
    </div>
  );
}
