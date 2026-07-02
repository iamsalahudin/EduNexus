import { useDroppable } from "@dnd-kit/core"

export default function ClassHeader({ col, activeDragId }) {
  const { setNodeRef, isOver } = useDroppable({ id: `header:${col.id}` })

  const highlightInvalid = isOver && activeDragId && activeDragId.startsWith("subject:")
  // subject cannot be dropped on header; highlight normal for teacher/room
  return (
    <th ref={setNodeRef} className={`border p-3 text-center ${isOver ? 'bg-theme-primary/10' : ''} ${highlightInvalid ? 'ring-2 ring-red-400' : ''}`}>
      <div className="font-semibold">{col.name}</div>
      <div className="text-xs mt-2 space-y-1">
        <div>👨‍🏫 {col.headerTeacher || "Drop Teacher (header)"}</div>
        <div>🏫 {col.headerRoom || "Drop Room (header)"}</div>
      </div>
    </th>
  )
}
