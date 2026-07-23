# 🖊️ CollabBoard — Whiteboard & Audio Collaboration App

## Overview

CollabBoard is a **real-time collaborative whiteboard** with built-in **voice/audio communication**.
Multiple users join a shared room, draw on a shared canvas together, and talk to each other — all inside the browser, no plugins required.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · WebSockets · WebRTC · Canvas API

---

## 🎯 Core Features

| Feature | Description |
|---|---|
| **Rooms** | Create / join a room via a shareable URL |
| **Whiteboard** | Freehand draw, shapes, text, eraser, undo/redo |
| **Multiplayer cursor** | See other users' cursors in real time |
| **Audio chat** | Push-to-talk or open-mic voice communication |
| **Toolbar** | Pen, eraser, shapes, color/stroke picker, clear canvas |
| **Presence** | Avatar list showing who is in the room |
| **Permissions** | Host can lock/unlock canvas for participants |

---

## 🏗️ Architecture

```
Browser (Client)
│
├── Next.js App (React 19 + App Router)
│   ├── Landing page  → /
│   ├── Room page     → /room/[roomId]   (Canvas + Audio UI)
│   └── API routes    → /api/...
│
├── WebSocket server  (real-time drawing sync + cursor + events)
│   └── Runs as a custom Next.js server or a separate Node.js process
│
└── WebRTC (audio)
    └── Peer-to-peer audio via SimplePeer or native RTCPeerConnection
        signalled through the WebSocket server
```

### Component Rendering Strategy (Next.js 16 rules)
- **Server Components** (default): Landing page, room layout, metadata, SEO
- **Client Components** (`"use client"`): Canvas, toolbar, audio controls, presence list
  — anything that uses `useState`, `useEffect`, Canvas API, `getUserMedia`, WebSocket, WebRTC

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (fonts, global meta)
│   ├── page.tsx                    # Landing page (Server Component)
│   ├── globals.css                 # Tailwind base + design tokens
│   │
│   ├── room/
│   │   └── [roomId]/
│   │       ├── page.tsx            # Room page shell (Server Component)
│   │       └── loading.tsx         # Loading skeleton
│   │
│   └── api/
│       ├── rooms/
│       │   └── route.ts            # POST: create room, GET: list rooms
│       └── signal/
│           └── route.ts            # WebRTC signalling (offer/answer/ice)
│
├── components/
│   ├── landing/
│   │   ├── Hero.tsx                # Hero section with CTA
│   │   └── CreateRoomForm.tsx      # "Create / Join Room" form (Client)
│   │
│   ├── room/
│   │   ├── RoomClient.tsx          # Root Client Component for room
│   │   ├── Canvas.tsx              # <canvas> drawing surface (Client)
│   │   ├── Toolbar.tsx             # Tool picker, colors, stroke (Client)
│   │   ├── PresenceBar.tsx         # Online user avatars (Client)
│   │   └── AudioControls.tsx       # Mic toggle, mute, volume (Client)
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Avatar.tsx
│       └── Tooltip.tsx
│
├── hooks/
│   ├── useCanvas.ts                # Drawing logic, tool state, history
│   ├── useWebSocket.ts             # WS connection, event pub/sub
│   ├── useAudio.ts                 # getUserMedia, WebRTC peer management
│   └── usePresence.ts              # Track online users in room
│
├── lib/
│   ├── ws-server.ts                # WebSocket server bootstrap (Node.js)
│   ├── rooms.ts                    # In-memory / Redis room registry
│   ├── drawing.ts                  # Drawing event types & serialisation
│   └── webrtc.ts                   # RTCPeerConnection helpers
│
└── types/
    ├── room.ts
    ├── drawing.ts
    └── user.ts
```

---

## 🔄 Real-time Protocol (WebSocket Events)

| Event | Direction | Payload |
|---|---|---|
| `join-room` | Client → Server | `{ roomId, userId, name, color }` |
| `leave-room` | Client → Server | `{ roomId, userId }` |
| `draw-stroke` | Client → Server → All | `{ points[], color, size, tool }` |
| `cursor-move` | Client → Server → All | `{ userId, x, y }` |
| `clear-canvas` | Client → Server → All | `{ roomId }` |
| `undo` | Client → Server → All | `{ userId, strokeId }` |
| `user-list` | Server → Client | `{ users[] }` |
| `rtc-offer` | Client → Server → Peer | SDP offer |
| `rtc-answer` | Client → Server → Peer | SDP answer |
| `rtc-ice` | Client → Server → Peer | ICE candidate |

---

## 🎨 UI / Design System

- **Theme**: Dark mode first, deep navy/slate background, neon accent (#7C3AED → #06B6D4 gradient)
- **Typography**: `Geist` (already in Next.js default) + `JetBrains Mono` for room codes
- **Glassmorphism**: Toolbar and sidebar panels with `backdrop-blur`
- **Animations**: Framer Motion for panel transitions, cursor trails, tool selection
- **Canvas cursor**: Custom SVG cursor matching selected tool

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `ws` | WebSocket server |
| `simple-peer` | WebRTC peer abstraction for audio |
| `uuid` | Room & user ID generation |
| `zustand` | Client-side state (tool, users, canvas history) |
| `framer-motion` | UI animations |
| `nanoid` | Short shareable room codes |
| `@radix-ui/react-tooltip` | Accessible tooltips for toolbar |

---

## 🗺️ Implementation Phases

### Phase 1 — Foundation & Landing Page
- [ ] Clean up default Next.js boilerplate
- [ ] Set up design tokens in `globals.css` (colors, fonts, spacing)
- [ ] Build landing page: Hero, Create Room form, feature highlights
- [ ] API route: `POST /api/rooms` → generate room ID, return join URL
- [ ] Navigate to `/room/[roomId]` on form submit

### Phase 2 — Whiteboard (Single User)
- [ ] Install `zustand` for tool/canvas state
- [ ] `Canvas.tsx` — set up `<canvas>` with proper DPI scaling
- [ ] `useCanvas.ts` — freehand draw (mouse + touch events)
- [ ] `Toolbar.tsx` — pen, eraser, shapes (rect, circle, line), color picker, stroke size
- [ ] Undo/redo stack (local)
- [ ] Clear canvas button

### Phase 3 — WebSocket Server & Multiplayer Drawing
- [ ] Set up custom server (`server.ts`) integrating `ws` with Next.js 16
- [ ] Room registry (in-memory Map, upgrade to Redis later)
- [ ] Broadcast draw-stroke, clear, undo events to all room members
- [ ] `useWebSocket.ts` hook — connect on room mount, handle reconnect
- [ ] Render remote strokes on canvas from WS events
- [ ] Multiplayer cursor overlay (SVG layer above canvas)
- [ ] Presence bar — show all users in room with color-coded avatars

### Phase 4 — Audio Communication (WebRTC)
- [ ] `useAudio.ts` — `getUserMedia` for microphone access
- [ ] WebRTC signalling via existing WebSocket server
- [ ] `simple-peer` mesh: each user creates a peer connection to every other user
- [ ] `AudioControls.tsx` — mic toggle (push-to-talk / open mic), mute all, volume per user
- [ ] Visual speaking indicator on user avatar (Web Audio API analyser)

### Phase 5 — Polish & Advanced Features
- [ ] Host controls: lock canvas, kick user
- [ ] Sticky notes (text boxes draggable on canvas)
- [ ] Export canvas as PNG / SVG
- [ ] Room expiry / cleanup (inactive rooms auto-deleted after 1 hour)
- [ ] Responsive layout (tablet support)
- [ ] Loading skeletons, error boundaries, offline banner
- [ ] SEO meta tags and OG image for room share links

---

## 🔐 Security Considerations

- Room IDs use `nanoid` (collision-resistant, URL-safe)
- No auth required for MVP; optional password-protect rooms in Phase 5
- WebSocket messages validated server-side before broadcast
- Audio streams are peer-to-peer (server never receives audio data)
- Canvas state stored only in memory — no PII persisted

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start dev server (Next.js + WebSocket)
npm run dev

# Build for production
npm run build && npm run start
```

**Environment variables (`.env.local`):**
```
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## 📌 Open Questions / Decisions

| # | Question | Default Choice |
|---|---|---|
| 1 | Use a managed WS service (Ably / Pusher) or self-hosted `ws`? | Self-hosted `ws` for MVP |
| 2 | Store canvas snapshot in DB for late joiners? | Yes — serialize & broadcast on `join-room` |
| 3 | Audio: full mesh WebRTC or SFU (e.g. mediasoup)? | Mesh for ≤8 users, SFU later |
| 4 | Auth provider for named users? | None for MVP, Clerk/NextAuth later |
| 5 | Deploy target? | Vercel (Next.js) + Railway (WS server) |
