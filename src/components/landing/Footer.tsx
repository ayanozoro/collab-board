const links = ["Privacy Policy", "Terms of Service", "Contact", "GitHub"];

export default function Footer() {
  return (
    <footer className="border-t border-[#4a4455]/20 py-16 w-full bg-[#0a141d]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#d2bbff]">
              grid_view
            </span>
            <span
              className="text-xl font-bold gradient-text"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              CollabBoard
            </span>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap justify-center gap-8">
            {links.map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-[#ccc3d8] hover:text-[#4cd7f6] transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-[#4a4455]/10 pt-8 text-center">
          <p className="text-sm text-[#ccc3d8]/60">
            © 2024 CollabBoard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
