"use client";

import { useRef, useEffect } from "react";

interface CanvasProps {
  roomId: string;
}

export default function Canvas({ roomId: _roomId }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="collab-canvas"
      className="flex-1 cursor-crosshair touch-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
