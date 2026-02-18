'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'

export default function GridCell({ col, timeLabel, subjects = [] }) {
  const droppableId = `cell:${col.id}:${encodeURIComponent(timeLabel)}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  const cell = col.periods[timeLabel] || {}

  return (
    <div ref={setNodeRef} className={`bg-white p-3 border text-center min-h-[64px] ${isOver ? 'bg-primary/5' : ''}`}>
      <div className="text-sm font-medium">{cell.subject || '—'}</div>
      <div className="text-xs text-gray-600 mt-1">{cell.teacher || ''}</div>
      <div className="text-xs text-gray-500 mt-1">{cell.room || ''}</div>
    </div>
  )
}