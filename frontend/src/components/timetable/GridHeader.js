'use client'

import { useDroppable } from '@dnd-kit/core'

export default function GridHeader({ col }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `header|${encodeURIComponent(col.id)}`
  })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white p-3 border-b font-medium text-center
        ${isOver ? 'ring-2 ring-theme-primary' : ''}
      `}
    >
      {col.name}
    </div>
  )
}
