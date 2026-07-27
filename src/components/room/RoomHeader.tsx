"use client";

import PresenceBar from "./PresenceBar";
import { useUser, UserButton } from "@clerk/nextjs";

interface RoomHeaderProps {
  roomId: string;
}

export default function RoomHeader({ roomId }: RoomHeaderProps) {
  const { isSignedIn, isLoaded } = useUser();

  function handleShare() {
    navigator.clipboard?.writeText(roomId);
  }

  return (
    <header className="fixed top-6 left-6 right-6 h-14 glass-panel rounded-xl z-50 flex items-center justify-between px-6 shadow-2xl">
      {/* Left: logo + room name */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d2bbff] to-[#4cd7f6] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#3f008e] text-base leading-none">
            grid_view
          </span>
        </div>

        <h1
          className="text-base font-bold gradient-text leading-none"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Project Horizon
        </h1>

        <div className="h-4 w-px bg-[#4a4455]/30 mx-1" />

        <span className="text-sm text-[#ccc3d8]">
          Room:{" "}
          <span className="font-mono text-[#d2bbff]">{roomId}</span>
        </span>
      </div>

      {/* Right: avatars + share */}
      <div className="flex items-center gap-5">
        <PresenceBar roomId={roomId} />

        {isLoaded && isSignedIn && <UserButton />}

        <button
          onClick={handleShare}
          title="Copy room code"
          className="bg-[#d2bbff] hover:brightness-110 text-[#3f008e] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(210,187,255,0.3)]"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Share
        </button>
      </div>
    </header>
  );
}
