// Minimal message list with simple bubble layout.
// It also supports structured 'data', 'chart', and 'actions' fields if present.
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
  p: ({ children, ...props }) => (
    <p {...props} className="whitespace-pre-wrap">
      {children}
    </p>
  ),
  li: ({ children, ...props }) => (
    <li {...props} className="whitespace-pre-wrap">
      {children}
    </li>
  ),
  a: ({ children, ...props }) => (
    <a
      {...props}
      className="underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  pre: ({ children, ...props }) => (
    <pre
      {...props}
      className="mt-2 overflow-auto rounded-md bg-neutral-200 p-3 text-xs"
    >
      {children}
    </pre>
  ),
  code: ({ inline, children, ...props }) => {
    if (inline) {
      return (
        <code {...props} className="rounded bg-neutral-200 px-1 py-0.5 text-xs">
          {children}
        </code>
      );
    }
    return <code {...props}>{children}</code>;
  },
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-auto rounded-lg border border-neutral-500">
      <table
        {...props}
        className="min-w-full text-sm border-separate border-spacing-0"
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead {...props} className="bg-gray-100">
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      {...props}
      className="px-3 py-2 text-left font-medium border-b border-r border-neutral-500 last:border-r-0"
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      {...props}
      className="px-3 py-2 border-b border-r border-neutral-500 last:border-r-0"
    >
      {children}
    </td>
  ),
};

function TableRenderer({ columns = [], rows = [] }) {
  return (
    <div className="mt-3 overflow-auto rounded-lg border border-neutral-500">
      <table className="min-w-full text-sm border-separate border-spacing-0">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="px-3 py-2 text-left font-medium border-b border-r border-neutral-500 last:border-r-0"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 border-b border-r border-neutral-500 last:border-r-0"
                >
                  {cell}
                </td>
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
      {messages.map((m, idx) => (
        <div
          key={m.id ?? `${m.role || "msg"}-${idx}`}
          className={`flex ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[85%] text-sm rounded-xl p-5 ${
              m.role === "user"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--card-bg)] text-[var(--color-text)]"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {typeof m.text === "string" 
                ? (() => {
                    try {
                      const parsed = JSON.parse(m.text);
                      return parsed.reply || m.text;
                    } catch {
                      return m.text;
                    }
                  })()
                : ""}
            </ReactMarkdown>

            {/* structured table */}
            {m.data?.type === "table" && <TableRenderer {...m.data} />}

            {/* chart */}
            {m.chart?.type === "bar" && <BarChart {...m.chart} />}

            {/* attachments */}
            {Array.isArray(m.attachments) && m.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    download={att.name}
                    className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span aria-hidden>📎</span>
                    <span className="truncate max-w-[180px]">{att.name || 'Download file'}</span>
                    {att.size ? <span className="text-xs text-gray-500">{Math.ceil(att.size / 1024)} KB</span> : null}
                  </a>
                ))}
              </div>
            )}

            {/* actions */}
            {Array.isArray(m.actions) && m.actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.actions.map((a, i) => {
                  if (a.type === "download") {
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
                  if (a.type === "navigate") {
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
