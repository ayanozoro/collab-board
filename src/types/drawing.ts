export type Tool = "select" | "pen" | "eraser" | "rect" | "circle" | "line" | "text" | "note" | "image" | "laser";

export interface Point {
  x: number;
  y: number;
}

export interface LaserPoint {
  x: number;
  y: number;
  timestamp: number;
  color: string;
  size: number;
}

export interface Stroke {
  id: string;
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
}

export interface DrawingEvent {
  type: "draw-stroke" | "clear-canvas" | "undo" | "cursor-move" | "laser-draw";
  userId: string;
  roomId: string;
  strokeId?: string;
  tool?: Tool;
  color?: string;
  size?: number;
  points?: Point[];
  laserPoints?: LaserPoint[];
  cursor?: Point;
}

