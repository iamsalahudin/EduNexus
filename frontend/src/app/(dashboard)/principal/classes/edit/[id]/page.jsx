'use client'

import ClassEditWorkspace from '@/components/classes/ClassEditWorkspace'

export default function PrincipalEditClassPage({ params }) {
  return <ClassEditWorkspace roleBase="/principal" classId={params?.id} />
}
