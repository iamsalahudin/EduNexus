"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from 'react'

export default function SubHeader({ breadcrumb = [], className = "" }) {
  const router = useRouter();
  const pathname = usePathname()

  const autoBreadcrumb = useMemo(() => {
    if (!pathname) return []
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return []

    // parts: [role, ...segments]
    // For subpages, we want breadcrumbs to start at the sidebar main section
    // e.g. /admin/fees/defaulters => Fee > Defaulters (no "Overview" prefix)
    if (parts.length <= 1) return []

    const role = parts[0]
    const crumbs = []

    function titleize(seg) {
      const clean = String(seg).replace(/-/g, ' ')
      return clean.replace(/\b\w/g, (c) => c.toUpperCase())
    }

    for (let i = 1; i < parts.length; i++) {
      const link = `/${parts.slice(0, i + 1).join('/')}`
      crumbs.push({ id: i, name: titleize(parts[i]), link })
    }
    return crumbs
  }, [pathname])

  const finalBreadcrumb = breadcrumb && breadcrumb.length ? breadcrumb : autoBreadcrumb

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="px-2 py-1 border rounded flex items-center gap-2"
          style={{ color: "var(--color-text)" }}
        >
          <ChevronLeft />
        </button>

        <div
          className="text-sm flex items-center justify-center text-center text-gray-500"
          style={{ color: "var(--color-text)" }}
        >
          {finalBreadcrumb.map((bc, id) => (
            <span key={bc.id || id} className="inline-flex items-center">
              <Link href={bc.link} prefetch={false}>{bc.name}</Link>
              {id < finalBreadcrumb.length - 1 && (
                <ChevronRight className="mx-1 w-4 h-4" />
              )}
            </span>
          ))}
        </div>
      </div>
      <div></div>
    </div>
  );
}
