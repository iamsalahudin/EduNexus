'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'

export default function DraggableItem({ id, label, disabled = false }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`px-3 py-2 border rounded bg-white text-sm flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab'}`}
      aria-disabled={disabled}
    >
      <span className="font-medium">{label}</span>
    </div>
  )
}
