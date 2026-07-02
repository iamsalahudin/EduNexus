import SyllabusWorkspace from '@/components/syllabus/SyllabusWorkspace'
import { ButtonLink, Card, PageHeader } from '@/components/ui'

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Syllabus"
        subtitle="Manage class-wise subject syllabi, chapters, and status."
        right={(
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/principal/classes" variant="outline">Classes</ButtonLink>
            <ButtonLink href="/principal/subjects" variant="outline">Subjects</ButtonLink>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-semibold text-gray-900">Plan chapters</h3>
          <p className="mt-2 text-sm text-gray-600">Capture one syllabus per class and subject pairing.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-gray-900">Track status</h3>
          <p className="mt-2 text-sm text-gray-600">Move drafts through active and completed stages.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-gray-900">Reuse subjects</h3>
          <p className="mt-2 text-sm text-gray-600">Pull subject lists from the class subject registry.</p>
        </Card>
      </div>

      <SyllabusWorkspace />
    </div>
  )
}
