"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SubHeader({ breadcrumb = [], className = "" }) {
  const router = useRouter();

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
          {breadcrumb.map((bc, id) => (
            <span key={bc.id || id} className="inline-flex items-center">
              <Link href={bc.link}>{bc.name}</Link>
              {id < breadcrumb.length - 1 && (
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
