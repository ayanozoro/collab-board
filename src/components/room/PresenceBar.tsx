"use client";

// Placeholder — populated via usePresence hook in Phase 3
interface PresenceBarProps {
  roomId: string;
}

export default function PresenceBar({ roomId: _roomId }: PresenceBarProps) {
  // TODO: wire usePresence hook
  const mockUsers = [
    { id: "1", name: "You", color: "#7C3AED" },
  ];

  return (
    <div id="presence-bar" className="flex items-center gap-1">
      {mockUsers.map((u) => (
        <div
          key={u.id}
          title={u.name}
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-slate-900"
          style={{ backgroundColor: u.color }}
        >
          {u.name[0].toUpperCase()}
        </div>
      ))}
    </div>
  );
}
