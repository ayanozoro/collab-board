import HeroActions from "./HeroActions";

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 text-center mb-24">
      {/* Live badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel mb-8">
        <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
        <span
          className="text-xs font-bold tracking-wider uppercase text-[#ccc3d8]"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Live Collaboration Enabled
        </span>
      </div>

      {/* Headline */}
      <h1
        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-tight"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        Draw, Plan &amp; Collaborate in{" "}
        <span className="gradient-text">Real Time</span>
      </h1>

      {/* Subheading */}
      <p className="text-lg text-[#ccc3d8] max-w-2xl mx-auto mb-12 leading-relaxed">
        The ultra-fast canvas for creative teams. Brainstorm, wireframe, and
        build together on a high-performance workspace — no sign-up needed.
      </p>

      {/* CTA buttons */}
      <HeroActions />

      {/* Hero image mockup */}
      <div className="relative group mt-16 px-4 max-w-5xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
        <div className="relative glass-panel rounded-2xl overflow-hidden aspect-video shadow-2xl">
          {/* Canvas grid simulation */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(149,141,161,0.12) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Mock SVG flowchart */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 600 280"
              className="w-full max-w-lg opacity-80"
              fill="none"
            >
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d2bbff" />
                  <stop offset="100%" stopColor="#4cd7f6" />
                </linearGradient>
              </defs>
              <rect
                x="20"
                y="100"
                width="140"
                height="60"
                rx="12"
                stroke="url(#grad)"
                strokeWidth="2"
              />
              <text
                x="90"
                y="135"
                textAnchor="middle"
                fill="#dae3f0"
                fontSize="14"
              >
                Concept
              </text>
              <path
                d="M 160 130 L 240 130"
                stroke="url(#grad)"
                strokeWidth="2"
                strokeDasharray="4"
              />
              <rect
                x="240"
                y="100"
                width="140"
                height="60"
                rx="12"
                stroke="url(#grad)"
                strokeWidth="2"
              />
              <text
                x="310"
                y="135"
                textAnchor="middle"
                fill="#dae3f0"
                fontSize="14"
              >
                Prototype
              </text>
              <path
                d="M 380 130 L 460 130"
                stroke="url(#grad)"
                strokeWidth="2"
                strokeDasharray="4"
              />
              <rect
                x="460"
                y="100"
                width="120"
                height="60"
                rx="12"
                stroke="url(#grad)"
                strokeWidth="2"
              />
              <text
                x="520"
                y="135"
                textAnchor="middle"
                fill="#dae3f0"
                fontSize="14"
              >
                Launch
              </text>
            </svg>
          </div>
          {/* Mock cursors */}
          <div className="absolute top-[30%] left-[35%] pointer-events-none flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] rotate-[-25deg] text-xl cursor-trail">
              near_me
            </span>
            <span className="bg-[#4cd7f6] text-[#003640] px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
              Alex K.
            </span>
          </div>
          <div className="absolute top-[55%] left-[60%] pointer-events-none flex items-center gap-2">
            <span className="material-symbols-outlined text-[#d2bbff] rotate-[-25deg] text-xl cursor-trail">
              near_me
            </span>
            <span className="bg-[#d2bbff] text-[#3f008e] px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
              Sarah J.
            </span>
          </div>
          {/* Live avatars */}
          <div className="absolute bottom-4 left-4 flex -space-x-2">
            {["A", "S", "+4"].map((u, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#0a141d] flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: i === 0 ? "#7c3aed" : i === 1 ? "#03b5d3" : "#2c363f",
                }}
              >
                {u}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
