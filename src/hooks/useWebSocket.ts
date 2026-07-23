import { useEffect } from "react";
import { useCanvasStore } from "@/store/canvasStore";

let globalWs: WebSocket | null = null;

export function sendWSMessage(msg: any) {
  if (globalWs && globalWs.readyState === WebSocket.OPEN) {
    globalWs.send(JSON.stringify(msg));
  }
}

// Throttled cursor sender to prevent network flooding
let lastCursorTime = 0;
const THROTTLE_MS = 50;

export function sendCursorMove(
  roomId: string,
  userId: string,
  x: number,
  y: number,
  name: string,
  color: string
) {
  const now = Date.now();
  if (now - lastCursorTime >= THROTTLE_MS) {
    lastCursorTime = now;
    sendWSMessage({
      type: "cursor-move",
      roomId,
      userId,
      cursor: { x, y, name, color },
    });
  }
}

export function useWebSocket(roomId: string) {
  const {
    currentUser,
    setUsers,
    addRemoteStroke,
    removeRemoteStroke,
    clearRemoteCanvas,
    setStrokes,
    updateCursor,
    removeCursor,
  } = useCanvasStore();

  useEffect(() => {
    if (!currentUser) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    globalWs = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      sendWSMessage({
        type: "join-room",
        roomId,
        userId: currentUser.id,
        name: currentUser.name,
        color: currentUser.color,
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        switch (type) {
          case "room-state":
            setStrokes(data.strokes);
            break;
          case "user-list":
            setUsers(data.users);
            break;
          case "draw-stroke":
            addRemoteStroke(data.stroke);
            break;
          case "clear-canvas":
            clearRemoteCanvas();
            break;
          case "undo":
            removeRemoteStroke(data.strokeId);
            break;
          case "cursor-move":
            // Don't register cursor updates for self
            if (data.userId !== currentUser.id) {
              updateCursor(data.userId, {
                x: data.cursor.x,
                y: data.cursor.y,
                name: data.cursor.name,
                color: data.cursor.color,
              });
            }
            break;
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      globalWs = null;
      setUsers([]);
      useCanvasStore.setState({ cursors: {} });
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.close();
      globalWs = null;
    };
  }, [
    roomId,
    currentUser,
    setUsers,
    addRemoteStroke,
    removeRemoteStroke,
    clearRemoteCanvas,
    setStrokes,
    updateCursor,
    removeCursor,
  ]);

  return {
    send: sendWSMessage,
  };
}
export default useWebSocket;
