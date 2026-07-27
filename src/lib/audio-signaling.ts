import { WebSocket } from "ws";

export interface UserSession {
  user: { id: string; name: string; color: string };
  ws: WebSocket;
}

export function handleAudioSignaling(
  ws: WebSocket,
  data: any,
  roomUsers: Map<string, Map<string, UserSession>>
): boolean {
  const { type, roomId, userId, targetUserId } = data;

  if (!roomId || !userId) return false;

  const usersMap = roomUsers.get(roomId);
  if (!usersMap) return false;

  switch (type) {
    case "audio-offer": {
      const targetSession = usersMap.get(targetUserId);
      if (targetSession && targetSession.ws.readyState === WebSocket.OPEN) {
        targetSession.ws.send(
          JSON.stringify({
            type: "audio-offer",
            senderId: userId,
            sdp: data.sdp,
          })
        );
      }
      return true;
    }

    case "audio-answer": {
      const targetSession = usersMap.get(targetUserId);
      if (targetSession && targetSession.ws.readyState === WebSocket.OPEN) {
        targetSession.ws.send(
          JSON.stringify({
            type: "audio-answer",
            senderId: userId,
            sdp: data.sdp,
          })
        );
      }
      return true;
    }

    case "audio-ice-candidate": {
      const targetSession = usersMap.get(targetUserId);
      if (targetSession && targetSession.ws.readyState === WebSocket.OPEN) {
        targetSession.ws.send(
          JSON.stringify({
            type: "audio-ice-candidate",
            senderId: userId,
            candidate: data.candidate,
          })
        );
      }
      return true;
    }

    case "audio-state": {
      // Broadcast mute/unmute and live speaking state to all users in the room
      const payload = JSON.stringify({
        type: "audio-state",
        userId,
        isMuted: data.isMuted,
        isSpeaking: data.isSpeaking,
      });

      usersMap.forEach((session) => {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(payload);
        }
      });
      return true;
    }

    default:
      return false;
  }
}
