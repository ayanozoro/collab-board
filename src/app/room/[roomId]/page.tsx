import { Metadata } from "next";
import RoomClient from "@/components/room/RoomClient";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Room ${roomId} — CollabBoard`,
    description: "Real-time collaborative whiteboard for sketching and brainstorming.",
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  return <RoomClient roomId={roomId} />;
}
