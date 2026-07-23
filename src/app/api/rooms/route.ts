import { NextRequest, NextResponse } from "next/server";
import { createRoom, getRooms } from "@/lib/rooms";

export async function POST(_req: NextRequest) {
  const room = createRoom();
  return NextResponse.json({ room }, { status: 201 });
}

export async function GET() {
  const rooms = getRooms();
  return NextResponse.json({ rooms });
}
