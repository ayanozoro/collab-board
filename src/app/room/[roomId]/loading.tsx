export default function RoomLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0d0f1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Connecting to room…</p>
      </div>
    </div>
  );
}
