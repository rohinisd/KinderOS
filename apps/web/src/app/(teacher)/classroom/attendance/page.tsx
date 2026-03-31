import { requireTeacher } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function TeacherAttendancePage() {
  await requireTeacher()

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark daily attendance for your class"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Chip-based attendance marking — coming soon
        </p>
      </div>
    </div>
  )
}
