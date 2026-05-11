"use client"

import { forwardRef } from 'react'

function sizeClass(size) {
  if (size === 'sm') return 'px-2 py-1 text-xs'
  if (size === 'lg') return 'px-4 py-2'
  return 'px-3 py-2'
}

function variantClass(variant) {
  if (variant === 'primary') return 'btn-primary'
  if (variant === 'outline') return 'btn-outline'
  if (variant === 'secondary') return 'btn-secondary'
  return ''
}

const Button = forwardRef(function Button(
  { children, variant = 'secondary', size = 'md', className = '', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded ${sizeClass(size)} disabled:opacity-60 ${variantClass(variant)} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
