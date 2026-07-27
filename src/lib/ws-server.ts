import { WebSocketServer, WebSocket } from "ws";
import { Stroke } from "../types/drawing";
import { User } from "../types/user";
import { createServer as createHttpsServer } from "https";
import { readFileSync, existsSync } from "fs";
import path from "path";

interface UserSession {
  user: User;
  ws: WebSocket;
}

// In-memory room states
const roomUsers = new Map<string, Map<string, UserSession>>(); // roomId -> (userId -> UserSession)
const roomStrokes = new Map<string, Stroke[]>(); // roomId -> Stroke[]

const PORT = parseInt(process.env.PORT || "3001", 10);

let wss: WebSocketServer;
const certPath = path.join(process.cwd(), "certificates/localhost.pem");
const keyPath = path.join(process.cwd(), "certificates/localhost-key.pem");
const envPath = path.join(process.cwd(), ".env.local");

let wantsSecure = false;
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  if (envContent.includes("NEXT_PUBLIC_WS_URL=wss://")) {
    wantsSecure = true;
  }
}

if (wantsSecure && existsSync(certPath) && existsSync(keyPath)) {
  const server = createHttpsServer({
    cert: readFileSync(certPath),
    key: readFileSync(keyPath),
  }, (req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CollabBoard WebSocket Server</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #060f17; color: #d2bbff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { border: 1px solid rgba(124,58,237,0.2); background: #0b1521; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(124,58,237,0.1); text-align: center; max-width: 420px; }
            h1 { color: #4cd7f6; margin-top: 0; font-size: 1.5rem; }
            p { color: #a0aec0; line-height: 1.5; font-size: 0.95rem; }
            .badge { display: inline-block; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 1.25rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">SSL Certificate Trusted</span>
            <h1>Secure Connection Established</h1>
            <p>Your browser has successfully accepted the self-signed SSL/TLS certificate for the WebSocket server.</p>
            <p style="color: #64748b; margin-top: 1.5rem; font-size: 0.85rem;">You can now close this tab and return to the whiteboard app.</p>
          </div>
        </body>
      </html>
    `);
  });
  wss = new WebSocketServer({ server });
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`> Standalone WebSocket server running on wss://0.0.0.0:${PORT} (Secure HTTPS)`);
  });
} else {
  if (wantsSecure) {
    console.warn("> WARNING: SSL certificates not found at certificates/localhost.pem or localhost-key.pem. Falling back to HTTP.");
  }
  wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });
  console.log(`> Standalone WebSocket server running on ws://0.0.0.0:${PORT} (Insecure HTTP)`);
}

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
