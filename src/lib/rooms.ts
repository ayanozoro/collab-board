import { nanoid } from "nanoid";
import type { Room } from "@/types/room";

// In-memory room registry — Phase 5 upgrades this to Redis.
const rooms = new Map<string, Room>();

export function createRoom(): Room {
  const id = nanoid(8);
  const room: Room = {
    id,
    createdAt: new Date().toISOString(),
    hostId: "",
    userCount: 0,
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function getRooms(): Room[] {
  return Array.from(rooms.values());
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
}
