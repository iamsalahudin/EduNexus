"use client"

export default function ToggleBox({ active, onToggle, children, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        onToggle?.(!active)
      }}
      className={
        (active
          ? 'btn-primary px-3 py-2 rounded text-sm'
          : 'px-3 py-2 border rounded text-sm hover:bg-gray-50') +
        (disabled ? ' opacity-60 cursor-not-allowed' : '') +
        (className ? ` ${className}` : '')
      }
    >
      {children}
    </button>
  )
}
