"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { sendWSMessage, addSignalingListener } from "@/hooks/useWebSocket";

export function useAudio() {
  const {
    roomId,
    currentUser,
    users,
    cursors,
    isMuted,
  } = useCanvasStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const panners = useRef<Map<string, PannerNode>>(new Map());
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map());
  const iceQueues = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteAudioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Local user's last known cursor position (default to middle of screen)
  const localCursor = useRef({ x: 960, y: 540 });

  // 1. Capture local microphone stream on mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initLocalStream() {
      try {
        if (typeof window === "undefined") return;
        if (!navigator.mediaDevices) {
          console.warn("navigator.mediaDevices is undefined. WebRTC microphone access requires a Secure Context (localhost or HTTPS).");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        activeStream = stream;

        // Match initial mute state from store
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });

        setLocalStream(stream);
        console.log("Local audio stream initialized successfully.");
      } catch (err) {
        console.error("Failed to get local microphone stream:", err);
      }
    }

    initLocalStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // User interaction listener to resume AudioContext (bypassing browser autoplay restriction)
  useEffect(() => {
    const resumeAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().then(() => {
          console.log("AudioContext resumed successfully via user gesture");
        });
      }
    };
    window.addEventListener("click", resumeAudio);
    window.addEventListener("touchstart", resumeAudio);
    return () => {
      window.removeEventListener("click", resumeAudio);
      window.removeEventListener("touchstart", resumeAudio);
    };
  }, []);

  // Sync mute state with stream tracks
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      // Resume audio context on unmute
      if (!isMuted && audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    }
  }, [isMuted, localStream]);

  // 2. Track local user's own cursor movement to adjust relative spatial panning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      localCursor.current = { x: e.clientX, y: e.clientY };
      updateSpatialPanning();
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursors]);

  // 3. Web Audio API setup for self-speaking voice detection
  useEffect(() => {
    if (!localStream || !currentUser || !roomId) return;

    let audioContext: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let intervalId: any = null;
    let isSpeaking = false;
    let silentFrames = 0;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      source = audioContext.createMediaStreamSource(localStream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      intervalId = setInterval(() => {
        if (isMuted) {
          if (isSpeaking) {
            isSpeaking = false;
            sendWSMessage({ type: "user-speaking", roomId, isSpeaking: false });
          }
          return;
        }

        analyser!.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Amplitude threshold for voice detection
        if (average > 15) {
          silentFrames = 0;
          if (!isSpeaking) {
            isSpeaking = true;
            sendWSMessage({ type: "user-speaking", roomId, isSpeaking: true });
          }
        } else {
          silentFrames++;
          if (silentFrames > 5 && isSpeaking) {
            isSpeaking = false;
            sendWSMessage({ type: "user-speaking", roomId, isSpeaking: false });
          }
        }
      }, 100);
    } catch (err) {
      console.error("Error setting up self voice analyser:", err);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [localStream, isMuted, currentUser, roomId]);

  // 4. Spatial Panning Updater
  const updateSpatialPanning = () => {
    if (!audioCtxRef.current) return;
    const audioCtx = audioCtxRef.current;

    pappersMapIterator:
    for (const [peerId, panner] of panners.current.entries()) {
      const peerCursor = cursors[peerId];
      if (!peerCursor) {
        // If collaborator cursor position is unknown, center their sound
        panner.positionX.setValueAtTime(0, audioCtx.currentTime);
        panner.positionY.setValueAtTime(0, audioCtx.currentTime);
        panner.positionZ.setValueAtTime(-1, audioCtx.currentTime);
        continue;
      }

      // Compute relative distance offsets
      const dx = peerCursor.x - localCursor.current.x;
      const dy = peerCursor.y - localCursor.current.y;

      // Scale factor to translate screen pixels into 3D audio space
      const scaleFactor = 120;
      const px = dx / scaleFactor;
      const py = -dy / scaleFactor; // invert Y axis for standard 3D coordinate mapping

      panner.positionX.setValueAtTime(px, audioCtx.currentTime);
      panner.positionY.setValueAtTime(py, audioCtx.currentTime);
      panner.positionZ.setValueAtTime(-1, audioCtx.currentTime);
    }
  };

  // Helper to establish spatial node pipeline for incoming streams
  const setupSpatialAudio = (peerId: string, stream: MediaStream) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;

      // Auto-resume if suspended (may be blocked by browser autoplay policy until user gesture)
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch((err) => console.log("Failed to auto-resume AudioContext on track:", err));
      }

      // Clean up previous elements if any
      if (panners.current.has(peerId)) {
        panners.current.get(peerId)?.disconnect();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const panner = audioCtx.createPanner();

      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1.5;

      // Connect source node -> panner node -> global speaker output
      source.connect(panner);
      panner.connect(audioCtx.destination);

      // Chrome/Chromium workaround: WebRTC streams in Web Audio API require an active playing audio element
      if (remoteAudioElements.current.has(peerId)) {
        const oldAudio = remoteAudioElements.current.get(peerId);
        oldAudio?.pause();
        oldAudio?.remove();
      }
      const audio = document.createElement("audio");
      audio.srcObject = stream;
      audio.volume = 0; // set volume to 0 (instead of muted=true to prevent WebAudio muting)
      audio.play().catch((err) => console.log("Chromium audio element play started", err));
      remoteAudioElements.current.set(peerId, audio);

      panners.current.set(peerId, panner);
      remoteStreams.current.set(peerId, stream);

      // Run position update immediately
      updateSpatialPanning();

      console.log(`Spatial audio output pipeline established for collaborator: ${peerId}`);
    } catch (err) {
      console.error("Error setting up spatial audio pipeline:", err);
    }
  };

  // 5. Native RTCPeerConnection Mesh Coordination
  useEffect(() => {
    if (!currentUser || !roomId || !localStream) return;

    // A helper to initialize RTCPeerConnection for a collaborator
    const getOrCreatePeerConnection = (peerId: string, isInitiator: boolean) => {
      if (pcs.current.has(peerId)) {
        return pcs.current.get(peerId)!;
      }

      console.log(`Setting up RTCPeerConnection for ${peerId} (Initiator: ${isInitiator})`);
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Add local audio tracks to the peer connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Handle ICE Candidate gathering
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWSMessage({
            type: "rtc-ice",
            roomId,
            targetUserId: peerId,
            fromUserId: currentUser.id,
            candidate: event.candidate,
          });
        }
      };

      // Handle incoming streams
      pc.ontrack = (event) => {
        console.log(`Received remote audio stream track from peer ${peerId}`);
        if (event.streams && event.streams[0]) {
          setupSpatialAudio(peerId, event.streams[0]);
        }
      };

      // Initiator creates and sends the SDP offer on negotiation
      if (isInitiator) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendWSMessage({
              type: "rtc-offer",
              roomId,
              targetUserId: peerId,
              fromUserId: currentUser.id,
              sdp: offer.sdp,
            });
          } catch (err) {
            console.error(`Error generating RTC offer for ${peerId}:`, err);
          }
        };
      }

      pcs.current.set(peerId, pc);
      return pc;
    };

    // Helper to process any queued ICE candidates once remote description is set
    const processIceQueue = async (peerId: string, pc: RTCPeerConnection) => {
      const queue = iceQueues.current.get(peerId);
      if (queue && queue.length > 0) {
        console.log(`Processing ${queue.length} queued ICE candidates for ${peerId}`);
        for (const candidate of queue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error(`Error adding queued ICE candidate from ${peerId}:`, err);
          }
        }
        iceQueues.current.set(peerId, []);
      }
    };

    // Listen to user list changes to detect additions/removals
    const collaboratorIds = new Set(
      users.map((u) => u.id).filter((id) => id !== currentUser.id)
    );

    // Close connections for disconnected collaborators
    for (const [peerId, pc] of pcs.current.entries()) {
      if (!collaboratorIds.has(peerId)) {
        console.log(`Cleaning up connection for disconnected collaborator: ${peerId}`);
        pc.close();
        pcs.current.delete(peerId);
        panners.current.get(peerId)?.disconnect();
        panners.current.delete(peerId);
        remoteStreams.current.delete(peerId);

        // Clean up Chrome audio element
        const audio = remoteAudioElements.current.get(peerId);
        audio?.pause();
        audio?.remove();
        remoteAudioElements.current.delete(peerId);
      }
    }

    // Spawn peer connections for new collaborators
    collaboratorIds.forEach((peerId) => {
      if (!pcs.current.has(peerId)) {
        // Tie breaker rule: Lower Lexicographical ID initiates the connection
        const isInitiator = currentUser.id < peerId;
        getOrCreatePeerConnection(peerId, isInitiator);
      }
    });

    // Subscribe to WebSocket WebRTC signals
    const unsubscribe = addSignalingListener(async (data) => {
      const { type, fromUserId, sdp, candidate } = data;

      switch (type) {
        case "rtc-offer": {
          console.log(`Received SDP Offer from collaborator ${fromUserId}`);
          const pc = getOrCreatePeerConnection(fromUserId, false);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendWSMessage({
              type: "rtc-answer",
              roomId,
              targetUserId: fromUserId,
              fromUserId: currentUser.id,
              sdp: answer.sdp,
            });
            await processIceQueue(fromUserId, pc);
          } catch (err) {
            console.error(`Error resolving SDP Offer for ${fromUserId}:`, err);
          }
          break;
        }

        case "rtc-answer": {
          console.log(`Received SDP Answer from collaborator ${fromUserId}`);
          const pc = pcs.current.get(fromUserId);
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
              await processIceQueue(fromUserId, pc);
            } catch (err) {
              console.error(`Error resolving SDP Answer for ${fromUserId}:`, err);
            }
          }
          break;
        }

        case "rtc-ice": {
          const pc = pcs.current.get(fromUserId);
          if (pc && candidate) {
            if (pc.remoteDescription) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (err) {
                console.error(`Error adding ICE candidate from ${fromUserId}:`, err);
              }
            } else {
              // Queue candidate until remote description is set
              if (!iceQueues.current.has(fromUserId)) {
                iceQueues.current.set(fromUserId, []);
              }
              iceQueues.current.get(fromUserId)!.push(candidate);
              console.log(`Queued ICE candidate from ${fromUserId} (remoteDescription is null)`);
            }
          }
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, roomId, users, localStream]);

  // Clean up all connections on unmount
  useEffect(() => {
    return () => {
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
      panners.current.forEach((p) => p.disconnect());
      panners.current.clear();
      remoteStreams.current.clear();
      remoteAudioElements.current.forEach((audio) => {
        audio.pause();
        audio.remove();
      });
      remoteAudioElements.current.clear();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return {
    localStream,
    isMuted,
  };
}
