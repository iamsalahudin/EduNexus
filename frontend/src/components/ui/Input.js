'use client';

export default function Input({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  className = '',
  ...rest
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id || name} className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
          {label}
        </label>
      )}
      <input
        id={id || name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] transition"
        {...rest}
      />
    </div>
  );
}
