interface AvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md";
}

export default function Avatar({ name, color, size = "md" }: AvatarProps) {
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div
      title={name}
      className={`flex items-center justify-center rounded-full font-bold text-white ring-2 ring-slate-900 ${dim}`}
      style={{ backgroundColor: color }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}
