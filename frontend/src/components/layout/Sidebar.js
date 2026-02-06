"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { capitalizeFirstLetter } from "@/tools/functions/string";
import { useMemo } from "react";
import routes from "@/components/layout/routes/routes";

export default function Sidebar({ isHidden }) {
  const pathname = usePathname();

  const role = useMemo(() => {
    if (!pathname) return "";
    return `${pathname.split("/")[1] || ""}`;
  }, [pathname]);

  const routeEntries = useMemo(() => {
    const roleRoutes = routes?.[role] || {};
    return Object.entries(roleRoutes);
  }, [role]);

  function isActive(href) {
    if (!pathname) return false;
    return pathname === href;
  }

  return (
    <aside
      className={`w-64 border-r border-[var(--color-text)]/100 fixed left-0 top-0 h-screen z-20 overflow-auto bg-[--card-bg] transform transition-transform duration-300 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
        isHidden ? "-translate-x-full" : "translate-x-0"
      }`}
    >
      <div className="p-4">
        <div className="text-lg font-semibold">
          {capitalizeFirstLetter(role)}
        </div>
        <nav className="mt-4 flex flex-col gap-2">
          {routeEntries.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded nav-item ${
                isActive(href) ? "font-semibold" : ""
              }`}
              aria-current={isActive(href) ? "page" : undefined}
              style={
                isActive(href)
                  ? {
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-text-light)",
                    }
                  : undefined
              }
            >
              {capitalizeFirstLetter(label)}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
