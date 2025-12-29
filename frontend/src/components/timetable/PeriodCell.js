import { useDroppable } from "@dnd-kit/core"

export default function PeriodCell({ col, time, activeDragId }) {
  const droppableId = `cell:${col.id}:${time}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  const cell = col.periods[time] || {}
  const isSubjectDragging = activeDragId && activeDragId.startsWith("subject:")
  const invalidDropVisual = isOver && activeDragId && activeDragId.startsWith("teacher:") && cell.teacher

  return (
    <td ref={setNodeRef} className={`border p-2 text-xs text-center ${isOver ? 'bg-primary/5' : ''} ${invalidDropVisual ? 'ring-2 ring-red-400' : ''}`}>
      <div className="text-sm font-medium">{cell.subject || "—"}</div>
      <div className="text-xs text-gray-600 mt-1">{cell.teacher || ""}</div>
      <div className="text-xs text-gray-500">{cell.room || ""}</div>
    </td>
  )
}
