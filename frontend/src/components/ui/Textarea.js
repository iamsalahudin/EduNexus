"use client"

import { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea(
  {
    id,
    name,
    label,
    value,
    onChange,
    className = '',
    textareaClassName = '',
    ...rest
  },
  ref
) {
  const textareaProps = {
    id: id || name,
    name,
    onChange,
    className: `input ${label ? 'mt-2' : ''} ${textareaClassName}`,
    ref,
    ...rest,
  }

  if (value !== undefined) textareaProps.value = value

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id || name} className="text-sm font-medium">
          {label}
        </label>
      ) : null}
      <textarea {...textareaProps} />
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
