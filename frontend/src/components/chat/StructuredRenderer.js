export function TableRenderer({ columns, rows }) {
  return (
    <div className="overflow-auto border rounded-lg mt-3">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            {columns.map(col => (
              <th key={col} className="px-3 py-2 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
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

export function BarChart({ labels, values }) {
  const max = Math.max(...values);

  return (
    <div className="mt-4 space-y-2">
      {labels.map((label, i) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span>{label}</span>
            <span>{values[i]}</span>
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
