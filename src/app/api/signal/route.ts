import { NextRequest, NextResponse } from "next/server";

// WebRTC signalling relay — forwards SDP offer/answer and ICE candidates
// between peers via the REST fallback (primary path is the WS server).
export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: relay via WebSocket server in Phase 4
  return NextResponse.json({ ok: true, echo: body });
}
