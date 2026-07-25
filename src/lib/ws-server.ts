import { WebSocketServer, WebSocket } from "ws";
import { Stroke } from "../types/drawing";
import { User } from "../types/user";

interface UserSession {
  user: User;
  ws: WebSocket;
}

// In-memory room states
const roomUsers = new Map<string, Map<string, UserSession>>(); // roomId -> (userId -> UserSession)
const roomStrokes = new Map<string, Stroke[]>(); // roomId -> Stroke[]

const PORT = parseInt(process.env.PORT || "3001", 10);
const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

console.log(`> Standalone WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  ws.on("message", (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage);
      const { type, roomId, userId } = data;

      if (!roomId) return;

      switch (type) {
        case "join-room": {
          const { name, color } = data;
          currentRoomId = roomId;
          currentUserId = userId;

          // 1. Initialize room maps if they don't exist
          if (!roomUsers.has(roomId)) {
            roomUsers.set(roomId, new Map());
          }
          if (!roomStrokes.has(roomId)) {
            roomStrokes.set(roomId, []);
          }

          // 2. Add user session
          const user: User = { id: userId, name, color };
          roomUsers.get(roomId)!.set(userId, { user, ws });

          // 3. Send existing strokes in this room to the newly joined client
          ws.send(
            JSON.stringify({
              type: "room-state",
              strokes: roomStrokes.get(roomId) || [],
            })
          );

          // 4. Broadcast updated user list to everyone in the room
          broadcastUserList(roomId);
          break;
        }

        case "draw-stroke": {
          const { stroke } = data;
          if (!stroke) return;

          // Save stroke to in-memory history
          const strokes = roomStrokes.get(roomId) || [];
          strokes.push(stroke);
          roomStrokes.set(roomId, strokes);

          // Broadcast the stroke to other clients
          broadcastToRoom(roomId, ws, {
            type: "draw-stroke",
            stroke,
          });
          break;
        }

        case "clear-canvas": {
          // Clear history
          roomStrokes.set(roomId, []);

          // Broadcast clear to other clients
          broadcastToRoom(roomId, ws, {
            type: "clear-canvas",
          });
          break;
        }

        case "undo": {
          const { strokeId } = data;
          if (!strokeId) return;

          // Remove the stroke from history
          const strokes = roomStrokes.get(roomId) || [];
          const updatedStrokes = strokes.filter((s) => s.id !== strokeId);
          roomStrokes.set(roomId, updatedStrokes);

          // Broadcast undo to other clients
          broadcastToRoom(roomId, ws, {
            type: "undo",
            strokeId,
          });
          break;
        }

        case "cursor-move": {
          const { cursor } = data;
          if (!cursor) return;

          // Broadcast cursor position to other clients
          broadcastToRoom(roomId, ws, {
            type: "cursor-move",
            userId,
            cursor,
          });
          break;
        }

        case "rtc-offer":
        case "rtc-answer":
        case "rtc-ice": {
          const { targetUserId } = data;
          if (!targetUserId) return;
          const targetSession = roomUsers.get(roomId)?.get(targetUserId);
          if (targetSession && targetSession.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify(data));
          }
          break;
        }

        case "user-speaking": {
          const { isSpeaking } = data;
          broadcastToRoom(roomId, ws, {
            type: "user-speaking",
            userId,
            isSpeaking,
          });
          break;
        }

        default:
          console.warn(`Unknown message type: ${type}`);
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  ws.on("close", () => {
    handleDisconnect(currentRoomId, currentUserId);
  });

  ws.on("error", (err) => {
    console.error(`Socket error for user ${currentUserId} in room ${currentRoomId}:`, err);
    handleDisconnect(currentRoomId, currentUserId);
  });
});

function handleDisconnect(roomId: string | null, userId: string | null) {
  if (!roomId || !userId) return;

  const usersMap = roomUsers.get(roomId);
  if (usersMap) {
    usersMap.delete(userId);

    // If room is empty, clean it up from memory
    if (usersMap.size === 0) {
      roomUsers.delete(roomId);
      roomStrokes.delete(roomId);
      console.log(`Room ${roomId} is empty. Cleared strokes and sessions.`);
    } else {
      // Broadcast updated user list to remaining users
      broadcastUserList(roomId);
    }
  }
}

// Broadcasts the current room's users list to all connections in that room
function broadcastUserList(roomId: string) {
  const usersMap = roomUsers.get(roomId);
  if (!usersMap) return;

  const usersList: User[] = Array.from(usersMap.values()).map((s) => s.user);
  const payload = JSON.stringify({
    type: "user-list",
    users: usersList,
  });

  usersMap.forEach((session) => {
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(payload);
    }
  });
}

// Broadcasts a message to all users in the room EXCEPT the sender
function broadcastToRoom(roomId: string, senderWs: WebSocket, messageObj: unknown) {
  const usersMap = roomUsers.get(roomId);
  if (!usersMap) return;

  const payload = JSON.stringify(messageObj);
  usersMap.forEach((session) => {
    if (session.ws !== senderWs && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(payload);
    }
  });
}
