export default function ActionButtons({ actions, onNavigate }) {
  if (!actions?.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {actions.map((action, i) => {
        if (action.type === 'download') {
          return (
            <a
              key={i}
              href={action.url}
              download
              className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50"
            >
              📥 {action.label}
            </a>
          );
        }

        if (action.type === 'navigate') {
          return (
            <button
              key={i}
              onClick={() => onNavigate(action.path)}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-white"
            >
              ➡️ {action.label}
            </button>
          );
        }

        return null;
      })}
    </div>
  );
}
