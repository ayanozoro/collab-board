"use client";

import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import RoomHeader from "./RoomHeader";
import BottomBar from "./BottomBar";
import AudioControls from "./AudioControls";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  return (
    <div
      className="relative h-screen w-screen overflow-hidden select-none"
      style={{ backgroundColor: "#060f17" }}
    >
      {/* Dot grid canvas background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(149,141,161,0.12) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Atmospheric violet glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-40 bg-[#7c3aed]/10 blur-[100px] pointer-events-none z-10" />

      {/* Floating top bar */}
      <RoomHeader roomId={roomId} />

      {/* Main canvas area — padded below top bar */}
      <main className="absolute inset-0 pt-[88px] cursor-crosshair overflow-hidden">
        <Canvas roomId={roomId} />
      </main>

      {/* Floating left toolbar */}
      <Toolbar />

      {/* Floating bottom controls */}
      <BottomBar />

      {/* Audio controls — keep existing functionality */}
      <div className="fixed top-6 right-[180px] z-50">
        <AudioControls />
      </div>
    </div>
  );
}
