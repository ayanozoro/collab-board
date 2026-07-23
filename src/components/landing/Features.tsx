const features = [
  {
    icon: "bolt",
    accentColor: "text-[#d2bbff]",
    title: "Instant Rooms",
    desc: "Zero setup time. Spawn a global high-performance workspace in less than 200ms anywhere in the world.",
    decorIcon: "dynamic_form",
  },
  {
    icon: "draw",
    accentColor: "text-[#4cd7f6]",
    title: "Real-time Canvas",
    desc: "Vector-perfect drawing with infinite zoom. Experience the smooth feel of a local app with the power of the cloud.",
    decorIcon: "gesture",
  },
  {
    icon: "key",
    accentColor: "text-[#ede0ff]",
    title: "Share via Code",
    desc: "Simple 6-digit codes for instant entry. Enterprise-grade security with room passwords and expiration timers.",
    decorIcon: "lock",
  },
];

export default function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24">
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
        <div>
          <span
            className="text-sm font-bold tracking-widest uppercase text-[#d2bbff]"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Built for Velocity
          </span>
          <h2
            className="text-5xl font-bold mt-2 text-[#dae3f0]"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Powering remote creativity
          </h2>
        </div>
        <button className="flex items-center gap-2 text-[#dae3f0] hover:text-[#d2bbff] transition-colors group text-sm font-medium">
          Explore all features
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>

      {/* Feature cards bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((f) => (
          <div
            key={f.title}
            className="glass-panel p-8 rounded-3xl relative overflow-hidden h-96 flex flex-col justify-end group hover:border-[#d2bbff]/30 border border-transparent transition-all duration-300"
          >
            {/* Icon top-left */}
            <span
              className={`material-symbols-outlined text-6xl absolute top-8 left-8 ${f.accentColor}`}
            >
              {f.icon}
            </span>

            {/* Decorative ghost icon */}
            <span className="material-symbols-outlined absolute top-[-20px] right-[-20px] text-[220px] opacity-[0.06] text-[#dae3f0] pointer-events-none select-none">
              {f.decorIcon}
            </span>

            {/* Text */}
            <div className="relative z-10">
              <h4
                className="text-xl font-bold mb-3 text-[#dae3f0]"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                {f.title}
              </h4>
              <p className="text-[#ccc3d8] leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
