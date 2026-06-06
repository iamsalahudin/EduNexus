"use client";

import { useEffect, useState } from "react";
import ChatLayout from "./ChatLayout";
import { usePathname } from "next/navigation";
import { Sparkle } from "lucide-react";
import Link from "next/link";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    function onMinimize() {
      setOpen(false);
    }
    window.addEventListener("minimize-chat", onMinimize);
    return () => window.removeEventListener("minimize-chat", onMinimize);
  }, []);

  return (
    <>
      {/* Floating button (small view) */}
      <button
        onClick={() => setOpen(!open)}
        className={`${path.includes("/chat") ? "hidden" : "fixed"} bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--color-primary)] text-white shadow-lg text-center flex items-center justify-center group hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] transition`}
      >
        <Sparkle />
        <Sparkle className="hidden absolute group-hover:bottom-1 group-hover:right-2 group-hover:block transition w-2.5" />
        <Sparkle className="hidden absolute group-hover:top-1 group-hover:left-2 group-hover:block transition w-2.5" />
      </button>

      {/* Compact panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[360px] md:w-[420px] h-[64vh] md:h-[70vh] rounded-2xl shadow-xl border bg-white overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <div className="text-sm font-semibold">Institute Assistant</div>
              <div className="text-xs text-gray-500">
                Ask attendance, timetables...
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-xs px-2 py-1 rounded-md border"
                onClick={() => window.dispatchEvent(new Event("chat-new"))}
              >
                New
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 text-sm"
              >
                Close
              </button>
            </div>
          </div>

          {/* Panel content uses ChatLayout in 'panel' mode */}
          <div className="relative h-[calc(100%-56px)]">
            {" "}
            {/* leave header height -> content height */}
            <ChatLayout mode="panel" />
          </div>
          <div className="flex justify-center items-center text-[color:var(--color-primary)] text-sm py-2">
            <Link href={`/${path.split("/")[1]}/chat`} onClick={() => setOpen(false)}>Full Page View</Link>
          </div>
        </div>
      )}
    </>
  );
}
