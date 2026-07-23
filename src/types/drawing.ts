export type Tool = "pen" | "eraser" | "rect" | "circle" | "line";

export interface Point {
  x: number;
  y: number;
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
