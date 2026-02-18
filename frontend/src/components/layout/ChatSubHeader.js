"use client";

import { PanelLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function ChatSubHeader() {
  const pathname = usePathname()
  const role = (pathname || '').split('/').filter(Boolean)[0] || 'dashboard'

  return (
    <div
      className="fixed top-14 left-0 right-0 z-40 h-12 border-b flex items-center"
      style={{ backgroundColor: 'var(--card-bg)' }}
    >
      <div className="w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (typeof window === 'undefined') return
              window.dispatchEvent(new Event('chat-toggle-conversations'))
            }}
            className="px-2 py-1 border rounded nav-item inline-flex items-center gap-2"
            aria-label="Toggle chats list"
          >
            <PanelLeft className="w-4 h-4" />
            <span className="text-sm">Chats</span>
          </button>

          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Institute Assistant</div>
            <div className="text-xs text-gray-600 dark:text-gray-300 truncate">/{role}/chat</div>
          </div>
        </div>

        <div />
      </div>
    </div>
  )
}
