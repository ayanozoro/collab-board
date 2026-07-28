"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/store/canvasStore";

const FADE_DURATION_MS = 1500; // 1.5 seconds fadeout

export default function LaserOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laserTrails = useCanvasStore((state) => state.laserTrails);
  const setLaserPoints = useCanvasStore((state) => state.setLaserPoints);
  const clearLaserTrail = useCanvasStore((state) => state.clearLaserTrail);

  // High DPI resize handler
  useEffect(() => {
    function handleResize() {
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

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dedicated 60 FPS animation loop for rendering laser trails
  useEffect(() => {
    let animationFrameId: number;

    function render() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const now = Date.now();
      const rect = canvas.getBoundingClientRect();

      // Clear overlay canvas
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      let stateHasExpiredPoints = false;

      // Render trails for all active users
      Object.entries(laserTrails).forEach(([userId, points]) => {
        if (!points || points.length === 0) return;

        // Filter valid unexpired points for rendering
        const validPoints = points.filter((p) => now - p.timestamp < FADE_DURATION_MS);

        if (validPoints.length !== points.length) {
          stateHasExpiredPoints = true;
          // Clean up store asynchronously if all points expired
          if (validPoints.length === 0) {
            setTimeout(() => clearLaserTrail(userId), 0);
            return;
          } else {
            setTimeout(() => setLaserPoints(userId, validPoints), 0);
          }
        }

        if (validPoints.length === 0) return;

        // 1. Draw connecting line segments with fading gradient alpha
        for (let i = 0; i < validPoints.length - 1; i++) {
          const p1 = validPoints[i];
          const p2 = validPoints[i + 1];

          const age1 = now - p1.timestamp;
          const age2 = now - p2.timestamp;
          const alpha1 = Math.max(0, 1 - age1 / FADE_DURATION_MS);
          const alpha2 = Math.max(0, 1 - age2 / FADE_DURATION_MS);
          const avgAlpha = (alpha1 + alpha2) / 2;

          if (avgAlpha <= 0) continue;

          ctx.save();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = p2.size;

          // Layer 1: Outer Neon Glow
          ctx.shadowColor = p2.color;
          ctx.shadowBlur = 14;
          ctx.strokeStyle = p2.color;
          ctx.globalAlpha = avgAlpha * 0.85;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Layer 2: Intense Hot Core (Bright White)
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#ffffff";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = Math.max(2, p2.size * 0.35);
          ctx.globalAlpha = avgAlpha;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          ctx.restore();
        }

        // 2. Draw glowing laser pointer tip at head (latest point)
        const head = validPoints[validPoints.length - 1];
        const headAge = now - head.timestamp;
        const headAlpha = Math.max(0, 1 - headAge / FADE_DURATION_MS);

        if (headAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = headAlpha;

          // Outer glowing aura
          ctx.shadowColor = head.color;
          ctx.shadowBlur = 20;
          ctx.fillStyle = head.color;
          ctx.beginPath();
          ctx.arc(head.x, head.y, head.size * 0.8, 0, Math.PI * 2);
          ctx.fill();

          // Inner white core
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#ffffff";
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(head.x, head.y, head.size * 0.35, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [laserTrails, clearLaserTrail, setLaserPoints]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
