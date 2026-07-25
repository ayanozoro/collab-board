"use client";
import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasStore } from "@/store/canvasStore";

export interface CanvasHandle {
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
}

interface CanvasProps { roomId: string; }

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  { roomId: _roomId }, ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tool, color, size } = useCanvasStore();

  const { startDrawing, draw, stopDrawing, undo, redo, clearCanvas } =
    useCanvas(canvasRef, { tool, color, size });

  useImperativeHandle(ref, () => ({ undo, redo, clearCanvas }));

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="collab-canvas"
      className="touch-none"
      style={{ width: "100%", height: "100%", display: "block" }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
});

export default Canvas;
