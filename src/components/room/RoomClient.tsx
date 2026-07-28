"use client";

import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import { useCanvasStore } from "@/store/canvasStore";
import { useWebSocket, sendCursorMove } from "@/hooks/useWebSocket";
import Canvas, { type CanvasHandle } from "./Canvas";
import Toolbar from "./Toolbar";
import RoomHeader from "./RoomHeader";
import BottomBar from "./BottomBar";
import CursorOverlay from "./CursorOverlay";
import LaserOverlay from "./LaserOverlay";


const GUEST_NAMES = [
  "Creative Panda",
  "Sketching Koala",
  "Pixel Fox",
  "Design Badger",
  "Drawing Owl",
  "Artistic Cat",
  "Vibrant Rabbit",
  "Neon Tiger",
];

const CURATED_COLORS = [
  "#d2bbff", // Lavender
  "#4cd7f6", // Cyan
  "#10b981", // Emerald
  "#eab308", // Yellow
  "#ff7b00", // Orange
  "#ffffff", // White
];

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const canvasRef = useRef<CanvasHandle>(null);
  const { currentUser, setCurrentUser, setRoomId, zoom, pan } = useCanvasStore();
  const { user, isLoaded } = useUser();

  // 1. Establish session profile (Clerk or Guest fallback)
  useEffect(() => {
    setRoomId(roomId);
    if (!isLoaded) return;

    if (user) {
      // Use authenticated Clerk identity
      const displayName = user.fullName || user.firstName || user.username || "Creator";
      const charCodeSum = user.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const userColor = CURATED_COLORS[charCodeSum % CURATED_COLORS.length];

      setCurrentUser({
        id: user.id,
        name: displayName,
        color: userColor,
      });
    } else {
      // Guest fallback identity
      if (typeof window === "undefined") return;
      let userSession = sessionStorage.getItem("collab-user");
      let parsedUser = null;

      if (userSession) {
        try {
          parsedUser = JSON.parse(userSession);
        } catch {
          parsedUser = null;
        }
      }

      if (!parsedUser) {
        const randomName = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
        const randomColor = CURATED_COLORS[Math.floor(Math.random() * CURATED_COLORS.length)];
        parsedUser = {
          id: uuidv4(),
          name: `${randomName} #${Math.floor(100 + Math.random() * 900)}`,
          color: randomColor,
        };
        sessionStorage.setItem("collab-user", JSON.stringify(parsedUser));
      }

      setCurrentUser(parsedUser);
    }
  }, [roomId, user, isLoaded, setCurrentUser, setRoomId]);

  // 2. Initialize WebSocket sync
  useWebSocket(roomId);

  // 3. Track and emit local cursor movements in World Coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentUser) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldX = (screenX - pan.x) / zoom;
    const worldY = (screenY - pan.y) / zoom;

    sendCursorMove(
      roomId,
      currentUser.id,
      worldX,
      worldY,
      currentUser.name,
      currentUser.color
    );
  };

  const handleMouseLeave = () => {
    if (!currentUser) return;
    // Move out-of-bounds to hide from other users
    sendCursorMove(
      roomId,
      currentUser.id,
      -9999,
      -9999,
      currentUser.name,
      currentUser.color
    );
  };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden select-none"
      style={{ backgroundColor: "#060f17" }}
    >
      {/* Dynamic dot grid canvas background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(149,141,161,0.14) 1px, transparent 0)",
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />


      {/* Atmospheric violet glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-40 bg-[#7c3aed]/10 blur-[100px] pointer-events-none z-10" />

      {/* Floating top bar */}
      <RoomHeader roomId={roomId} />

      {/* Main canvas area — padded below top bar */}
      <main className="absolute inset-0 pt-[88px] overflow-hidden">
        <div
          className="relative w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Canvas ref={canvasRef} roomId={roomId} />
          <LaserOverlay />
          <CursorOverlay />
        </div>
      </main>

      {/* Floating left toolbar */}
      <Toolbar onClear={() => canvasRef.current?.clearCanvas()} />

      {/* Floating bottom controls */}
      <BottomBar />
    </div>
  );
}
