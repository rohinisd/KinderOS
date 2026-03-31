import { requireTeacher } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function ClassroomPage() {
  await requireTeacher()

  return (
    <div>
      <PageHeader
        title="My Classroom"
        description="Today's schedule and student overview"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Classroom dashboard — coming soon
        </p>
      </div>
    </div>
  )
}
