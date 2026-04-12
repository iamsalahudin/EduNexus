"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { capitalizeFirstLetter } from "@/tools/functions/string";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
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

  const segments = raw.split('/').filter(Boolean);
  const leaf = segments[segments.length - 1] || raw;
  return toTitle(leaf);
}

export default function Sidebar({ isHidden, onNavigate }) {
  const pathname = usePathname();
  const [expandedModules, setExpandedModules] = useState({});

  const role = useMemo(() => {
    if (!pathname) return "";
    return `${pathname.split("/")[1] || ""}`;
  }, [pathname]);

  const groupedRoutes = useMemo(() => {
    const roleRoutes = routes?.[role] || {};
    const grouped = {};

    Object.entries(roleRoutes).forEach(([label, href]) => {
      if (label === 'dashboard') {
        if (!grouped['overview']) grouped['overview'] = [];
        grouped['overview'].push({ label: 'overview', href });
      } else {
        const mainModule = label.split('/')[0];
        if (!grouped[mainModule]) grouped[mainModule] = [];
        grouped[mainModule].push({ label, href });
      }
    });

    return grouped;
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

  function toggleModule(module) {
    setExpandedModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  }

  function handleModuleClick(e, module, mainHref) {
    if (e.detail === 2) {
      // Double click - navigate to main page
      window.location.href = mainHref;
    } else {
      // Single click - toggle dropdown
      toggleModule(module);
    }
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
        <nav className="mt-4 flex flex-col gap-1">
          {Object.entries(groupedRoutes).map(([module, items]) => {
            const isExpanded = expandedModules[module];
            const mainHref = items[0]?.href || '/';
            const hasSubRoutes = items.length > 1;
            
            return (
              <div key={module}>
                {hasSubRoutes ? (
                  <div
                    onClick={(e) => handleModuleClick(e, module, mainHref)}
                    onDoubleClick={() => {}}
                    className="px-3 py-2 rounded nav-item cursor-pointer flex items-center justify-between select-none hover:opacity-80 transition-opacity"
                  >
                    <span className="font-medium">{capitalizeFirstLetter(module)}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                ) : (
                  <Link
                    href={mainHref}
                    onClick={() => {
                      if (typeof window === 'undefined') return;
                      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
                      if (!isDesktop) onNavigate?.();
                    }}
                    className={`px-3 py-2 rounded nav-item flex items-center justify-between ${
                      isActive(mainHref) ? "font-semibold" : ""
                    }`}
                    aria-current={isActive(mainHref) ? "page" : undefined}
                    style={
                      isActive(mainHref)
                        ? {
                            backgroundColor: "var(--color-primary)",
                            color: "var(--color-text-light)",
                          }
                        : undefined
                    }
                  >
                    <span className="font-medium">{capitalizeFirstLetter(module)}</span>
                  </Link>
                )}

                {hasSubRoutes && isExpanded && items.length > 0 && (
                  <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-[color:var(--input-border)] pl-2">
                    {items.map(({ label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => {
                          if (typeof window === 'undefined') return;
                          const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
                          if (!isDesktop) onNavigate?.();
                        }}
                        className={`px-3 py-2 rounded nav-item text-sm ${
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
                        {label.includes('/') || label.includes('_') || label.includes('-') 
                          ? formatSidebarLabel(label) 
                          : capitalizeFirstLetter(label)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
