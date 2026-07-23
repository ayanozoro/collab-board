"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasStore } from "@/store/canvasStore";

export interface CanvasHandle {
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
}

interface CanvasProps {
  roomId: string;
}

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
      
      // Trigger redraw via store update/re-trigger
      // (The hook handles redraw automatically on strokes change,
      // but resizing clears the canvas, so calling direct redraw is handled by the hook's drawAll if exposed,
      // or we can let the hook handle it since it redraws on mount/dimensions).
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="collab-canvas"
      className="touch-none flex-1"
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
