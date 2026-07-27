"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-[#4a4455]/30 bg-[#0a141d]/80 backdrop-blur-md shadow-sm"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="flex justify-between items-center px-6 py-3 w-full max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#d2bbff] text-3xl">
            grid_view
          </span>
          <span
            className="text-xl font-bold gradient-text"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            CollabBoard
          </span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          {["Product", "Features", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-[#ccc3d8] hover:text-[#d2bbff] transition-colors"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          {isLoaded && !isSignedIn && (
            <>
              <SignInButton mode="modal">
                <button className="px-5 py-2 rounded-full text-sm font-semibold text-[#dae3f0] hover:bg-[#2c363f]/50 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary px-5 py-2 rounded-full text-sm font-semibold text-white">
                  Get Started
                </button>
              </SignUpButton>
            </>
          )}

          {isLoaded && isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border border-[#d2bbff]/40 shadow-md",
                },
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}
