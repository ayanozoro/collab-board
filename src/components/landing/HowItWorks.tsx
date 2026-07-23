const steps = [
  {
    num: "1",
    title: "Create",
    icon: "rocket_launch",
    accentColor: "text-[#d2bbff]",
    bgColor: "bg-[#d2bbff]/10 group-hover:bg-[#d2bbff]/20",
    hoverBorder: "hover:border-[#d2bbff]/50",
    desc: "Launch a new room instantly without registration. One click and your workspace is live.",
  },
  {
    num: "2",
    title: "Share",
    icon: "share",
    accentColor: "text-[#4cd7f6]",
    bgColor: "bg-[#4cd7f6]/10 group-hover:bg-[#4cd7f6]/20",
    hoverBorder: "hover:border-[#4cd7f6]/50",
    desc: "Copy your secure room code and invite teammates to join the live session.",
  },
  {
    num: "3",
    title: "Collaborate",
    icon: "groups",
    accentColor: "text-[#d2bbff]",
    bgColor: "bg-[#d2bbff]/10 group-hover:bg-[#d2bbff]/20",
    hoverBorder: "hover:border-[#d2bbff]/50",
    desc: "See cursors in real-time. Annotate, design, and plan together with sub-millisecond latency.",
  },
];

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <h2
        className="text-4xl font-bold text-center mb-16 text-[#dae3f0]"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        Workflow Redefined
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`glass-panel p-10 rounded-3xl flex flex-col items-center text-center group border border-transparent ${s.hoverBorder} transition-all duration-300`}
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${s.bgColor}`}
            >
              <span
                className={`material-symbols-outlined text-4xl ${s.accentColor}`}
              >
                {s.icon}
              </span>
            </div>
            <h3
              className="text-xl font-bold mb-4 text-[#dae3f0]"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              {s.num}. {s.title}
            </h3>
            <p className="text-[#ccc3d8] leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
