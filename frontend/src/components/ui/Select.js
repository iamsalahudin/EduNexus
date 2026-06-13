"use client"

import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  {
    id,
    name,
    label,
    value,
    onChange,
    className = '',
    selectClassName = '',
    options,
    children,
    ...rest
  },
  ref
) {
  const selectProps = {
    id: id || name,
    name,
    onChange,
    className: `input ${label ? 'mt-2' : ''} ${selectClassName}`,
    ref,
    ...rest,
  }

  if (value !== undefined) selectProps.value = value

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id || name} className="text-sm font-medium">
          {label}
        </label>
      ) : null}
      <select {...selectProps}>
        {options
          ? options.map((opt) => {
              if (typeof opt === 'string') {
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                )
              }
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              )
            })
          : children}
      </select>
    </div>
  )
})

Select.displayName = 'Select'

export default Select
