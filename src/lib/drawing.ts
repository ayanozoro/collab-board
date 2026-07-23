import type { DrawingEvent } from "@/types/drawing";

// Serialise a drawing event to JSON for WebSocket transmission.
export function serialiseEvent(event: DrawingEvent): string {
  return JSON.stringify(event);
}

// Parse an incoming WebSocket message into a DrawingEvent.
export function parseEvent(raw: string): DrawingEvent | null {
  try {
    return JSON.parse(raw) as DrawingEvent;
  } catch {
    return null;
  }
}
