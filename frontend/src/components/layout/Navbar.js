"use client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Navbar({ isHidden, setIsHidden }) {
  const { user } = useAuth();
  const { toggleDark } = useTheme();

  return (
    <header
      className={`fixed top-0 right-0 h-14 flex items-center justify-between px-6 border-b z-20
        transition-all duration-300
        ${isHidden ? 'left-0' : 'left-64'}
      `}
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      <div className="flex items-center gap-4">
        <button
          className="px-2 py-1 border rounded nav-item"
          onClick={() => setIsHidden(prev => !prev)}
        >
          ☰
        </button>

        <span
          className="text-xl font-bold"
          style={{ color: "var(--color-primary)" }}
        >
          EduNexus
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDark}
          className="px-3 py-1 border rounded nav-item"
        >
          Toggle theme
        </button>

        <div className="text-sm">{user?.name || "Guest"}</div>
      </div>
    </header>
  );
}
