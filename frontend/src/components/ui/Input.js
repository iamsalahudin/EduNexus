"use client"

import { forwardRef } from 'react'

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
    ...rest
  },
  ref
) {
  const isChoiceInput = type === 'checkbox' || type === 'radio'

  const inputProps = {
    id: id || name,
    name,
    type,
    onChange,
    placeholder,
    autoComplete,
    className: `${isChoiceInput ? '' : 'input'} ${label ? 'mt-2' : ''} ${inputClassName}`.trim(),
    ref,
    ...rest,
  }

  // Avoid accidentally controlling file inputs, and avoid forcing controlled mode
  // when a consumer intends to use `defaultValue`.
  if (type !== 'file' && value !== undefined) inputProps.value = value

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
})

Input.displayName = 'Input'

export default Input
