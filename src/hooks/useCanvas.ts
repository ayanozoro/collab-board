import React, { useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useCanvasStore } from "@/store/canvasStore";
import { Point, Stroke, Tool, LaserPoint } from "@/types/drawing";
import { sendWSMessage, sendLaserPoints } from "./useWebSocket";

interface UseCanvasOptions {
  tool: Tool;
  color: string;
  size: number;
}

export function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseCanvasOptions
) {
  const isDrawing = useRef(false);
  const currentPoints = useRef<Point[]>([]);
  const {
    strokes,
    addStroke,
    undo,
    redo,
    clearCanvas,
    roomId,
    history,
    historyIndex,
    currentUser,
    addLaserPoints,
  } = useCanvasStore();

  const { tool, color, size } = options;

  // Redraw helper
  const drawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas cleanly
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Redraw completed strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });
  };

  // Redraw when strokes change
  useEffect(() => {
    drawAll();
  }, [strokes]);

  // Translate screen events to canvas coordinates
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      if (e.touches.length === 0) {
        if (e.changedTouches.length > 0) {
          return {
            x: e.changedTouches[0].clientX - rect.left,
            y: e.changedTouches[0].clientY - rect.top,
          };
        }
        return { x: 0, y: 0 };
      }
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const emitLaserPoint = (p: Point) => {
    if (!currentUser) return;
    const laserPt: LaserPoint = {
      x: p.x,
      y: p.y,
      timestamp: Date.now(),
      color: color || currentUser.color,
      size: Math.max(8, size * 2.2),
    };
    addLaserPoints(currentUser.id, [laserPt]);
    if (roomId) {
      sendLaserPoints(roomId, currentUser.id, [laserPt]);
    }
  };


  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (tool === "select") return;
    
    const p = getCanvasCoords(e);
    isDrawing.current = true;
    currentPoints.current = [p];

    if (tool === "laser") {
      emitLaserPoint(p);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "pen" || tool === "eraser") {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.lineWidth = size;

      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, size / 2, 0, 2 * Math.PI);
      ctx.fillStyle = tool === "eraser" ? "rgba(0,0,0,0)" : color;
      ctx.fill();
      ctx.restore();
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing.current || tool === "select") return;

    const p = getCanvasCoords(e);

    if (tool === "laser") {
      emitLaserPoint(p);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "pen" || tool === "eraser") {
      const lastPoint = currentPoints.current[currentPoints.current.length - 1];
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.lineWidth = size;

      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();

      currentPoints.current.push(p);
    } else {
      // Shapes preview redraw
      drawAll();

      // Draw preview shape
      const tempStroke: Stroke = {
        id: "preview",
        tool,
        color,
        size,
        points: [currentPoints.current[0], p],
      };
      drawStroke(ctx, tempStroke);
    }
  };

  const stopDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing.current || tool === "select") return;
    isDrawing.current = false;

    if (tool === "laser") {
      currentPoints.current = [];
      return;
    }

    const p = getCanvasCoords(e);

    
    if (tool !== "pen" && tool !== "eraser") {
      currentPoints.current.push(p);
    } else if (currentPoints.current.length > 0) {
      const last = currentPoints.current[currentPoints.current.length - 1];
      if (last.x !== p.x || last.y !== p.y) {
        currentPoints.current.push(p);
      }
    }

    if (currentPoints.current.length > 0) {
      const newStroke: Stroke = {
        id: uuidv4(),
        tool,
        color: tool === "eraser" ? "#000000" : color,
        size,
        points: [...currentPoints.current],
      };
      addStroke(newStroke);
      if (roomId) {
        sendWSMessage({
          type: "draw-stroke",
          roomId,
          stroke: newStroke,
        });
      }
    }

    currentPoints.current = [];
  };

  const handleUndo = () => {
    if (strokes.length > 0 && roomId) {
      const removed = strokes[strokes.length - 1];
      undo();
      sendWSMessage({
        type: "undo",
        roomId,
        strokeId: removed.id,
      });
    }
  };

  const handleRedo = () => {
    const canRedo = historyIndex < history.length - 1;
    if (canRedo && roomId) {
      const nextState = history[historyIndex + 1];
      if (nextState.length > 0) {
        const added = nextState[nextState.length - 1];
        redo();
        sendWSMessage({
          type: "draw-stroke",
          roomId,
          stroke: added,
        });
      }
    }
  };

  const handleClear = () => {
    if (strokes.length > 0) {
      clearCanvas();
      if (roomId) {
        sendWSMessage({
          type: "clear-canvas",
          roomId,
        });
      }
    }
  };

  return {
    startDrawing,
    draw,
    stopDrawing,
    undo: handleUndo,
    redo: handleRedo,
    clearCanvas: handleClear,
  };
}

// Drawing helper
function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;

  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  const points = stroke.points;

  if (stroke.tool === "pen" || stroke.tool === "eraser") {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  } else if (stroke.tool === "line") {
    if (points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    }
  } else if (stroke.tool === "rect") {
    if (points.length >= 2) {
      const p1 = points[0];
      const p2 = points[points.length - 1];
      ctx.beginPath();
      ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      ctx.stroke();
    }
  } else if (stroke.tool === "circle") {
    if (points.length >= 2) {
      const p1 = points[0];
      const p2 = points[points.length - 1];
      const rx = (p2.x - p1.x) / 2;
      const ry = (p2.y - p1.y) / 2;
      const cx = p1.x + rx;
      const cy = p1.y + ry;
      const r = Math.sqrt(rx * rx + ry * ry);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  ctx.restore();
}
