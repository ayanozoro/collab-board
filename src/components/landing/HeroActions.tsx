"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroActions() {
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
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-xl mx-auto">
      {/* Create Room */}
      <button
        id="create-room-btn"
        onClick={handleCreate}
        disabled={loading}
        className="btn-primary flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white shadow-xl disabled:opacity-50 w-full md:w-auto justify-center"
      >
        <span className="material-symbols-outlined text-[20px]">add_circle</span>
        {loading ? "Creating…" : "Create Room"}
      </button>

      {/* Join Room */}
      <form
        onSubmit={handleJoin}
        className="flex items-center glass-panel p-1 rounded-xl w-full md:w-auto"
      >
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#958da1] text-[20px]">
            vpn_key
          </span>
          <input
            id="join-room-input"
            type="text"
            placeholder="Enter room code..."
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="bg-transparent border-none outline-none focus:ring-0 pl-10 pr-4 py-3 text-[#dae3f0] w-full md:w-56 placeholder:text-[#958da1] text-sm"
          />
        </div>
        <button
          id="join-room-btn"
          type="submit"
          className="px-5 py-3 bg-[#212b34] rounded-lg text-sm font-bold text-[#d2bbff] hover:bg-[#d2bbff] hover:text-[#3f008e] transition-all"
        >
          Join
        </button>
      </form>
    </div>
  );
}
