'use client'

import ClassEditWorkspace from '@/components/classes/ClassEditWorkspace'

export default function EditClassPage({ params }) {
  return <ClassEditWorkspace roleBase="/admin" classId={params?.id} />
}
