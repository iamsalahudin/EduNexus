"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/context/theme.context";
import { PALETTES } from "@/constants/palettes";

/* ---------------------------------------------
   Constants
----------------------------------------------*/
const THEME_KEYS = Object.keys(PALETTES);

/* ---------------------------------------------
   Floating Controls
----------------------------------------------*/
function FloatingControls({ themeIndex, setThemeIndex, mode, setMode }) {
  return (
    <div className="fixed top-1/5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-10 rounded-full bg-white/70 dark:bg-black/70 px-4 py-2 backdrop-blur shadow-lg">

      {/* Previous Theme */}
      <button
        onClick={() =>
          setThemeIndex((i) =>
            i === 0 ? THEME_KEYS.length - 1 : i - 1
          )
        }
        className="rounded-full border px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        ←
      </button>

      {/* Theme Name */}
      <span className="min-w-[50px] text-center text-sm font-medium">
        {THEME_KEYS[themeIndex]}
      </span>

      {/* Next Theme */}
      <button
        onClick={() =>
          setThemeIndex((i) =>
            i === THEME_KEYS.length - 1 ? 0 : i + 1
          )
        }
        className="rounded-full border px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        →
      </button>

      {/* Divider */}
      <div className="mx-2 h-5 w-px bg-zinc-300 dark:bg-zinc-600" />

      {/* Light / Dark Toggle */}
      <button
        onClick={() => setMode(mode === "light" ? "dark" : "light")}
        className="rounded-full border px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {mode === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </div>
  );
}

/* ---------------------------------------------
   Main Page
----------------------------------------------*/
export default function FullScreenThemeShowcase() {
  const { setPalette, mode, setMode } = useTheme();
  const [themeIndex, setThemeIndex] = useState(0);

  const activePalette = useMemo(
    () => PALETTES[THEME_KEYS[themeIndex]],
    [themeIndex]
  );

  /* Apply palette globally */
  useEffect(() => {
    setPalette(activePalette);
  }, [activePalette, setPalette]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg text-fg transition-colors duration-500">

      {/* Center Content (Live App Preview) */}
      <section className="text-center px-6">
        <h1
          className="mb-6 text-5xl font-extrabold tracking-tight"
          style={{
            backgroundImage:
              "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--cta)))",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          EduNexus
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg opacity-80">
          A smart institute management system designed for modern education.
          Experience how each theme transforms the entire application.
        </p>

        <div className="flex justify-center gap-4">
          <button className="rounded-lg bg-[hsl(var(--primary))] px-6 py-3 font-medium text-[hsl(var(--text-dark-bg))] dark:text-[hsl(var(--text-light-bg))] shadow-lg">
            Primary Action
          </button>

          <button className="rounded-lg border px-6 py-3 font-medium">
            Secondary Action
          </button>
        </div>
      </section>

      {/* Floating Theme Controls */}
      <FloatingControls
        themeIndex={themeIndex}
        setThemeIndex={setThemeIndex}
        mode={mode}
        setMode={setMode}
      />
    </main>
  );
}
