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
            className={`relative flex h-8 w-8 -ml-2 first:ml-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-[#0a141d] hover:-translate-y-1 hover:z-30 transition-all duration-200 cursor-default select-none`}
            style={{ backgroundColor: u.color }}
          >
            {getInitials(u.name)}
            
            {/* Visual self/host indicator indicator */}
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
