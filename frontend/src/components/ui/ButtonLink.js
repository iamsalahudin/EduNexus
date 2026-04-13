"use client"

import Link from 'next/link'

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

export default function ButtonLink({
  href,
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...rest
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded ${sizeClass(size)} ${variantClass(variant)} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  )
}
