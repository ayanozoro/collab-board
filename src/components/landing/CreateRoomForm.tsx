"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRoomForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const res = await fetch("/api/rooms", { method: "POST" });
    const { room } = await res.json();
    router.push(`/room/${room.id}`);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (roomCode.trim()) router.push(`/room/${roomCode.trim()}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <button
        id="create-room-btn"
        onClick={handleCreate}
        disabled={loading}
        className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Room"}
      </button>

      <form onSubmit={handleJoin} className="flex gap-2">
        <input
          id="join-room-input"
          type="text"
          placeholder="Enter room code…"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 backdrop-blur focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          id="join-room-btn"
          type="submit"
          className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-violet-500 hover:text-violet-400"
        >
          Join
        </button>
      </form>
    </div>
  );
}
