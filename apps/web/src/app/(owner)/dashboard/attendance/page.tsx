import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function AttendancePage() {
  await requireSchoolAuth()

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Student and staff attendance overview"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Attendance dashboard — coming soon
        </p>
      </div>
    </div>
  )
}
