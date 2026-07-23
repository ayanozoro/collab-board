import { ReactNode, useState } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
}

// Lightweight tooltip — wraps any element.
// Replace with @radix-ui/react-tooltip in Phase 5 for full accessibility.
export default function Tooltip({ label, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg">
          {label}
        </div>
      )}
    </div>
  );
}
