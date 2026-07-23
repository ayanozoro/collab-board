export interface Room {
  id: string;
  createdAt: string;
  hostId: string;
  userCount: number;
  locked?: boolean; // host can lock the canvas
}
