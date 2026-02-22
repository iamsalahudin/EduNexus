"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { capitalizeFirstLetter } from "@/tools/functions/string";
import { useMemo } from "react";
import routes from "@/components/layout/routes/routes";

function formatSidebarLabel(label) {
  const raw = String(label || '').trim();
  if (!raw) return '';

  const toTitle = (s) =>
    String(s || '')
      .split(/[\s_-]+/g)
      .filter(Boolean)
      .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ''))
      .join(' ');

  // Preserve explicit '/' as a separator between groups.
  const groups = raw.split('/').map((g) => toTitle(g));
  return groups.filter(Boolean).join('/');
}

export default function Sidebar({ isHidden, onNavigate }) {
  const pathname = usePathname();

  const role = useMemo(() => {
    if (!pathname) return "";
    return `${pathname.split("/")[1] || ""}`;
  }, [pathname]);

  const routeEntries = useMemo(() => {
    const roleRoutes = routes?.[role] || {};
    return Object.entries(roleRoutes);
  }, [role]);

  function normalizePath(path) {
    if (!path) return '';
    if (path === '/') return '/';
    return String(path).replace(/\/+$/, '');
  }

  function isActive(href) {
    if (!pathname) return false;
    const current = normalizePath(pathname);
    const target = normalizePath(href);
    return current === target;
  }

  return (
    <aside
      className={`w-64 border-r border-[color:var(--input-border)] fixed left-0 top-0 h-screen z-50 overflow-auto bg-[var(--card-bg)] transform transition-transform duration-300 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
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
              onClick={() => {
                if (typeof window === 'undefined') return
                const isDesktop = window.matchMedia('(min-width: 1024px)').matches
                if (!isDesktop) onNavigate?.()
              }}
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
              {label.includes('/') || label.includes('_') || label.includes('-') ? formatSidebarLabel(label) : capitalizeFirstLetter(label)}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
