// usePresence — Phase 3
// Tracks which users are currently in the room via WebSocket events.
import { useCanvasStore } from "@/store/canvasStore";
import type { User } from "@/types/user";

export function usePresence(_roomId: string): User[] {
  return useCanvasStore((state) => state.users);
}
