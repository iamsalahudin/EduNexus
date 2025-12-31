'use client';

import ChatLayout from '@/components/chat/ChatLayout';

export default function ChatPage() {
  return (
    <div className="h-screen bg-gray-50">
      <header className="shrink-0 border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">Institute Assistant</h1>
        <p className="text-sm text-gray-500">Attendance, academics, reports & insights</p>
      </header>

      {/* Full page ChatLayout (mode='full') */}
      <main className="flex-1 min-h-0">
        <ChatLayout mode="full" />
      </main>
    </div>
  );
}
