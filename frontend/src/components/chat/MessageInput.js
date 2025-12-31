import { useState } from 'react';

/**
 * MessageInput
 * - Height is controlled by the parent (input container).
 * - Keep the internal textarea flexible.
 */
export default function MessageInput({ onSend }) {
  const [value, setValue] = useState('');

  function submit() {
    const v = value.trim();
    if (!v) return;
    onSend(v);
    setValue('');
  }

  return (
    <div className="h-full p-4 flex flex-col justify-center">
      <div className="flex gap-3 items-end">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask about attendance, marks, reports..."
          className="flex-1 resize-none h-12 border rounded-md p-2 focus:outline-none focus:ring focus:ring-indigo-200"
        />
        <button
          onClick={submit}
          className="h-12 px-5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Send
        </button>
      </div>
      <div className="text-xs text-gray-400 mt-2">Enter to send • Shift+Enter for new line</div>
    </div>
  );
}
