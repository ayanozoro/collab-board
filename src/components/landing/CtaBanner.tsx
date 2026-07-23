import HeroActions from "./HeroActions";

export default function CtaBanner() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-24">
      <div className="glass-panel p-16 rounded-[48px] text-center relative overflow-hidden">
        {/* Gradient tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/10 to-[#06b6d4]/10 pointer-events-none" />

        <h2
          className="text-5xl font-bold mb-6 text-[#dae3f0] relative z-10"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Ready to start collaborating?
        </h2>
        <p className="text-lg text-[#ccc3d8] mb-12 max-w-xl mx-auto leading-relaxed relative z-10">
          Join thousands of teams using CollabBoard to turn ideas into reality
          faster than ever.
        </p>
        <div className="relative z-10">
          <HeroActions />
        </div>
      </div>
    </section>
  );
}
