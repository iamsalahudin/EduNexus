export default function ConversationList({ conversations = [], currentId, onSelect }) {
  return (
    <aside className="hidden md:block w-64 border-r bg-gray-50 overflow-auto">
      <div className="p-3 font-medium">Chats</div>
      <div className="p-3 space-y-2">
        {conversations.length === 0 && (
          <div className="text-xs text-gray-500">No conversations yet</div>
        )}
        {conversations.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left p-2 rounded-md ${
              c.id === currentId ? 'bg-white shadow' : 'hover:bg-gray-100'
            }`}
          >
            <div className="text-sm font-medium truncate">{c.title || 'Chat'}</div>
            <div className="text-xs text-gray-400">{new Date(c.updatedAt).toLocaleString()}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
