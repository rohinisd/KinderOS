import { requireTeacher } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function AssignmentsPage() {
  await requireTeacher()

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Create assignments and track submissions"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Assignment manager — coming soon
        </p>
      </div>
    </div>
  )
}
