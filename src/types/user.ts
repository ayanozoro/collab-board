export interface User {
  id: string;
  name: string;
  color: string; // hex color assigned on join
  isHost?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
}
