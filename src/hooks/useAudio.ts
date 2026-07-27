"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { sendWSMessage, addSignalingListener } from "./useWebSocket";

// STUN + Public TURN Relay servers for cross-network and desktop-mobile NAT traversal
const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export function useAudio(roomId?: string) {
  const currentUser = useCanvasStore((state) => state.currentUser);
  const users = useCanvasStore((state) => state.users);
  const storeRoomId = useCanvasStore((state) => state.roomId);

  const activeRoomId = roomId || storeRoomId || "";
  const roomIdRef = useRef(activeRoomId);

  useEffect(() => {
    roomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const iceQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteAudioCtxRef = useRef<AudioContext | null>(null);

  // 1. Initialize microphone stream on mount
  useEffect(() => {
    let isMounted = true;

    async function initMicrophone() {
      try {
        if (typeof window === "undefined" || !navigator.mediaDevices) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Mute tracks initially
        stream.getAudioTracks().forEach((track) => (track.enabled = false));
        localStreamRef.current = stream;
        console.log("[WebRTC] Microphone stream initialized successfully.");

        // Attach or replace tracks in existing peer connections
        peerConnectionsRef.current.forEach((pc) => {
          stream.getTracks().forEach((track) => {
            const senders = pc.getSenders();
            const sender = senders.find((s) => s.track?.kind === "audio");
            if (sender) {
              sender.replaceTrack(track).catch(() => {});
            } else {
              pc.addTrack(track, stream);
            }
          });
        });
      } catch (err) {
        console.error("[WebRTC] Error acquiring microphone stream:", err);
      }
    }

    initMicrophone();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 2. Synchronous helper to get or create a peer connection
  const getOrCreatePeerConnection = useCallback(
    (targetUserId: string) => {
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      console.log(`[WebRTC] Creating peer connection for ${targetUserId}`);
      const pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnectionsRef.current.set(targetUserId, pc);

      // Add local audio tracks if stream is ready
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // ICE connection monitoring & auto-restart for desktop NAT traversal
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE state with ${targetUserId}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === "failed") {
          console.warn(`[WebRTC] ICE failed with ${targetUserId}, restarting ICE...`);
          pc.restartIce();
        }
      };

      // Send local ICE candidates to peer
      pc.onicecandidate = (event) => {
        const currentRoom = roomIdRef.current;
        if (event.candidate && currentUser && currentRoom) {
          sendWSMessage({
            type: "audio-ice-candidate",
            roomId: currentRoom,
            userId: currentUser.id,
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      // Play incoming remote audio track via dual Web Audio API + HTML Audio element
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Received remote audio track from ${targetUserId}`);
        const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);

        // 1. HTML Audio element playback
        let audioEl = audioElementsRef.current.get(targetUserId);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioEl.volume = 1.0;
          audioEl.setAttribute("playsinline", "true");
          audioEl.style.display = "none";
          document.body.appendChild(audioEl);
          audioElementsRef.current.set(targetUserId, audioEl);
        }

        audioEl.srcObject = remoteStream;
        audioEl.muted = isDeafened;
        audioEl.play().catch((err) => {
          console.warn(`[WebRTC] Autoplay waiting for user gesture for ${targetUserId}:`, err);
        });

        // 2. Web Audio API destination routing (guarantees desktop laptop speaker output)
        try {
          if (!remoteAudioCtxRef.current) {
            remoteAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const ctx = remoteAudioCtxRef.current;
          if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
          }
          const source = ctx.createMediaStreamSource(remoteStream);
          source.connect(ctx.destination);
          console.log(`[WebRTC] Connected remote stream to Web Audio destination for ${targetUserId}`);
        } catch (e) {
          console.log(`[WebRTC] Web Audio destination notice:`, e);
        }
      };

      return pc;
    },
    [currentUser, isDeafened]
  );

  // Helper to create and send an SDP offer
  const createAndSendOffer = useCallback(
    async (targetUserId: string) => {
      const currentRoom = roomIdRef.current;
      if (!currentUser || !currentRoom) return;
      const pc = getOrCreatePeerConnection(targetUserId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log(`[WebRTC] Sending audio offer to ${targetUserId} in room ${currentRoom}`);
        sendWSMessage({
          type: "audio-offer",
          roomId: currentRoom,
          userId: currentUser.id,
          targetUserId,
          sdp: offer,
        });
      } catch (err) {
        console.error(`[WebRTC] Error creating offer for ${targetUserId}:`, err);
      }
    },
    [currentUser, getOrCreatePeerConnection]
  );

  // 3. User gesture unlock listener for browser audio autoplay restrictions
  useEffect(() => {
    const unlockAudio = () => {
      // Resume Web Audio API context
      if (remoteAudioCtxRef.current && remoteAudioCtxRef.current.state === "suspended") {
        remoteAudioCtxRef.current.resume().then(() => {
          console.log("[WebRTC] Remote Web Audio API context resumed");
        }).catch(() => {});
      }

      // Resume HTML Audio elements
      audioElementsRef.current.forEach((audioEl, peerId) => {
        if (audioEl.paused && audioEl.srcObject) {
          audioEl.play().then(() => {
            console.log(`[WebRTC] Audio playback unlocked for ${peerId}`);
          }).catch(() => {});
        }
      });
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // 4. Handle incoming signaling messages (offers, answers, ICE candidates)
  useEffect(() => {
    const handleSignaling = async (data: any) => {
      if (!currentUser) return;
      const { type, senderId, sdp, candidate } = data;
      if (!senderId || senderId === currentUser.id) return;

      const currentRoom = roomIdRef.current;

      switch (type) {
        case "audio-offer": {
          console.log(`[WebRTC] Received audio offer from ${senderId}`);
          const pc = getOrCreatePeerConnection(senderId);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            if (currentRoom) {
              console.log(`[WebRTC] Sending audio answer to ${senderId} in room ${currentRoom}`);
              sendWSMessage({
                type: "audio-answer",
                roomId: currentRoom,
                userId: currentUser.id,
                targetUserId: senderId,
                sdp: answer,
              });
            }

            // Flush queued ICE candidates
            const queue = iceQueuesRef.current.get(senderId) || [];
            for (const cand of queue) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {}
            }
            iceQueuesRef.current.delete(senderId);
          } catch (err) {
            console.error(`[WebRTC] Error handling offer from ${senderId}:`, err);
          }
          break;
        }

        case "audio-answer": {
          console.log(`[WebRTC] Received audio answer from ${senderId}`);
          const pc = peerConnectionsRef.current.get(senderId);
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
              const queue = iceQueuesRef.current.get(senderId) || [];
              for (const cand of queue) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {}
              }
              iceQueuesRef.current.delete(senderId);
            } catch (err) {
              console.error(`[WebRTC] Error handling answer from ${senderId}:`, err);
            }
          }
          break;
        }

        case "audio-ice-candidate": {
          const pc = peerConnectionsRef.current.get(senderId);
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {}
          } else {
            if (!iceQueuesRef.current.has(senderId)) {
              iceQueuesRef.current.set(senderId, []);
            }
            iceQueuesRef.current.get(senderId)!.push(candidate);
          }
          break;
        }
      }
    };

    const unsubscribe = addSignalingListener(handleSignaling);
    return () => unsubscribe();
  }, [currentUser, getOrCreatePeerConnection]);

  // 5. Sync P2P connections whenever user presence changes in room
  useEffect(() => {
    if (!currentUser || !activeRoomId) return;

    // Clean up peer connections for users who left
    const currentPeerIds = new Set(users.map((u) => u.id));
    peerConnectionsRef.current.forEach((pc, peerId) => {
      if (!currentPeerIds.has(peerId)) {
        console.log(`[WebRTC] Cleaning up peer connection for ${peerId}`);
        pc.close();
        peerConnectionsRef.current.delete(peerId);
        const audioEl = audioElementsRef.current.get(peerId);
        if (audioEl) {
          audioEl.pause();
          audioEl.remove();
          audioElementsRef.current.delete(peerId);
        }
      }
    });

    // Create connections and initiate offers for new users (Lexicographical tie-breaker)
    users.forEach((otherUser) => {
      if (
        otherUser.id !== currentUser.id &&
        !peerConnectionsRef.current.has(otherUser.id)
      ) {
        const isInitiator = currentUser.id < otherUser.id;
        getOrCreatePeerConnection(otherUser.id);
        if (isInitiator) {
          createAndSendOffer(otherUser.id);
        }
      }
    });
  }, [users, currentUser, activeRoomId, getOrCreatePeerConnection, createAndSendOffer]);

  // 6. Voice frequency volume analyzer (optimized for vocal range detection & smooth hold)
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let lastSpeakingState = false;

    if (!isMuted && localStreamRef.current) {
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }

        analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(localStreamRef.current);
        source.connect(analyser);
        analyser.fftSize = 256;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);

          // Focus on human vocal frequencies (bins 1 to 35, approx 100Hz - 3000Hz)
          let vocalSum = 0;
          let maxPeak = 0;
          const binsToCheck = Math.min(35, dataArray.length);

          for (let i = 1; i < binsToCheck; i++) {
            vocalSum += dataArray[i];
            if (dataArray[i] > maxPeak) maxPeak = dataArray[i];
          }

          const vocalAverage = vocalSum / (binsToCheck - 1);
          const isSpeechDetected = vocalAverage > 4 || maxPeak > 16;
          const currentRoom = roomIdRef.current;

          if (isSpeechDetected) {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }

            if (!lastSpeakingState) {
              lastSpeakingState = true;
              setIsSpeaking(true);
              if (currentUser && currentRoom) {
                sendWSMessage({
                  type: "audio-state",
                  roomId: currentRoom,
                  userId: currentUser.id,
                  isMuted,
                  isSpeaking: true,
                });
              }
            }
          } else {
            // Smooth 300ms hold delay before turning speaking indicator off
            if (lastSpeakingState && !silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                lastSpeakingState = false;
                setIsSpeaking(false);
                if (currentUser && currentRoom) {
                  sendWSMessage({
                    type: "audio-state",
                    roomId: currentRoom,
                    userId: currentUser.id,
                    isMuted,
                    isSpeaking: false,
                  });
                }
                silenceTimerRef.current = null;
              }, 300);
            }
          }

          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        console.error("AudioContext error:", err);
      }
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsSpeaking(false);
      const currentRoom = roomIdRef.current;
      if (currentUser && currentRoom) {
        sendWSMessage({
          type: "audio-state",
          roomId: currentRoom,
          userId: currentUser.id,
          isMuted: true,
          isSpeaking: false,
        });
      }
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioCtx) audioCtx.close();
    };
  }, [isMuted, currentUser]);

  // Toggle Mute with RTCRtpSender.replaceTrack
  const toggleMute = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
      } catch (e) {
        console.error("Error activating mic:", e);
        return;
      }
    }

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    // Update active senders across all peer connections
    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      const sender = senders.find((s) => s.track?.kind === "audio");
      if (sender && localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          sender.replaceTrack(audioTrack).catch(() => {});
        }
      }
    });

    setIsMuted(nextMuted);

    const currentRoom = roomIdRef.current;
    if (currentUser && currentRoom) {
      sendWSMessage({
        type: "audio-state",
        roomId: currentRoom,
        userId: currentUser.id,
        isMuted: nextMuted,
        isSpeaking: false,
      });
    }
  };

  // Toggle Deafen
  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);
    audioElementsRef.current.forEach((audioEl) => (audioEl.muted = nextDeafened));
  };

  return {
    isMuted,
    isDeafened,
    isSpeaking,
    toggleMute,
    toggleDeafen,
  };
}
