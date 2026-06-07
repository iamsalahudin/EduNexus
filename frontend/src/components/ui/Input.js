"use client"

import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useMemo, useState } from 'react'

const Input = forwardRef(function Input(
  {
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    autoComplete,
    className = '',
    inputClassName = '',
    allowReveal = true,
    ...rest
  },
  ref
) {
  const isChoiceInput = type === 'checkbox' || type === 'radio'
  const isPassword = type === 'password'

  const [revealed, setRevealed] = useState(false)
  const effectiveType = isPassword && allowReveal ? (revealed ? 'text' : 'password') : type

  const inputProps = {
    id: id || name,
    name,
    type: effectiveType,
    onChange,
    placeholder,
    autoComplete,
    className: `${isChoiceInput ? '' : 'input'} ${label ? 'mt-2' : ''} ${isPassword && allowReveal ? 'pr-10' : ''} ${inputClassName}`.trim(),
    ref,
    ...rest,
  }

  // Avoid accidentally controlling file inputs, and avoid forcing controlled mode
  // when a consumer intends to use `defaultValue`.
  if (type !== 'file' && value !== undefined) inputProps.value = value

  // Plain input for non-password (or when reveal not allowed)
  if (!isPassword || !allowReveal) {
    return (
      <div className={className}>
        {label ? (
          <label htmlFor={id || name} className="text-sm font-medium">
            {label}
          </label>
        ) : null}
        <input {...inputProps} />
      </div>
    )
  }

  // Password input with show/hide toggle
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id || name} className="text-sm font-medium">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input {...inputProps} />
        <button
          type="button"
          aria-label={revealed ? 'Hide password' : 'Show password'}
          aria-pressed={revealed}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-900"
          onClick={() => setRevealed((v) => !v)}
          tabIndex={0}
        >
          {revealed ? <EyeOff className="h-4 w-4 opacity-50" /> : <Eye className="h-4 w-4 opacity-50" />}
        </button>
      </div>
    </div>
  )
})

Input.displayName = 'Input'

export default Input
