export type Tool = "select" | "pen" | "eraser" | "rect" | "circle" | "line" | "text" | "note" | "image";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
}

export interface DrawingEvent {
  type: "draw-stroke" | "clear-canvas" | "undo" | "cursor-move";
  userId: string;
  roomId: string;
  strokeId?: string;
  tool?: Tool;
  color?: string;
  size?: number;
  points?: Point[];
  cursor?: Point;
}
