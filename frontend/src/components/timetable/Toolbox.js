'use client'

import React from 'react'

export default function Toolbox({ title, children }) {
  return (
    <div className="card p-3 w-60">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}
