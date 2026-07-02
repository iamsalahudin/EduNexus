export default function ConversationList({
  conversations = [],
  currentId,
  onSelect,
  variant = 'desktop',
  widthClass = 'w-64',
  className = '',
}) {
  const visibility = variant === 'drawer' ? 'block' : 'hidden md:block'

  return (
    <aside className={`${visibility} ${widthClass} border-r bg-gray-50 overflow-auto ${className}`}>
      <div className="p-3 font-medium">Chats</div>
      <div className="p-3 space-y-2">
        {conversations.length === 0 && (
          <div className="text-xs text-gray-500">No conversations yet</div>
        )}
        {conversations.map((c) => (
          <button
            key={c.sessionKey}
            onClick={() => onSelect(c.sessionKey)}
            className={`w-full text-left p-2 rounded-md ${
              c.sessionKey === currentId ? 'bg-white shadow' : 'hover:bg-gray-100'
            }`}
          >
            <div className="text-sm font-medium truncate">{c.title || 'Chat'}</div>
            <div className="text-xs text-gray-400">{new Date(c.lastMessageAt || c.createdAt || c.updatedAt).toLocaleString()}</div>
            {c.lastMessagePreview && (
              <div className="text-xs text-gray-500 truncate">{c.lastMessagePreview}</div>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
