// Minimal message list with simple bubble layout.
// It also supports structured 'data', 'chart', and 'actions' fields if present.
import React from 'react';

function TableRenderer({ columns = [], rows = [] }) {
  return (
    <div className="mt-3 overflow-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarChart({ labels = [], values = [] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-3 space-y-3">
      {labels.map((label, i) => (
        <div key={label} className="text-sm">
          <div className="flex justify-between text-xs mb-1">
            <span className="truncate">{label}</span>
            <span className="text-gray-500">{values[i]}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-indigo-600 rounded"
              style={{ width: `${(values[i] / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MessageList({ messages = [], onNavigate = () => {} }) {
  return (
    <div className="space-y-4">
      {messages.map(m => (
        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] text-sm rounded-xl p-5 ${m.role === 'user' ? 'bg-[--color-primary] text-white' : 'bg-[--card-bg] text-[--color-text]'}`}>
            <div className="whitespace-pre-wrap">{m.text}</div>

            {/* structured table */}
            {m.data?.type === 'table' && <TableRenderer {...m.data} />}

            {/* chart */}
            {m.chart?.type === 'bar' && <BarChart {...m.chart} />}

            {/* actions */}
            {Array.isArray(m.actions) && m.actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.actions.map((a, i) => {
                  if (a.type === 'download') {
                    return (
                      <a
                        key={i}
                        href={a.url}
                        download
                        className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50"
                      >
                        📥 {a.label}
                      </a>
                    );
                  }
                  if (a.type === 'navigate') {
                    return (
                      <button
                        key={i}
                        onClick={() => onNavigate(a.path)}
                        className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white"
                      >
                        ➡️ {a.label}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
