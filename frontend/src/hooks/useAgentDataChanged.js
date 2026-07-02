"use client";
import { useEffect } from "react";

/**
 * Run `handler({operation, collections})` whenever the chat agent reports a successful write.
 * Pass `interestedCollections` (array of lowercase names like 'attendances') to filter,
 * or null/undefined to fire for every write.
 */
export function useAgentDataChanged(handler, interestedCollections) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof handler !== "function") return;
    const filter = Array.isArray(interestedCollections)
      ? new Set(interestedCollections.map((c) => String(c).toLowerCase()))
      : null;
    function onEvt(e) {
      const detail = e.detail || {};
      if (!filter) return handler(detail);
      const cols = detail.collections || [];
      if (cols.some((c) => filter.has(String(c).toLowerCase()))) handler(detail);
    }
    window.addEventListener("edunexus:data-changed", onEvt);
    return () => window.removeEventListener("edunexus:data-changed", onEvt);
  }, [handler, interestedCollections?.join(",")]);
}

export default useAgentDataChanged;
