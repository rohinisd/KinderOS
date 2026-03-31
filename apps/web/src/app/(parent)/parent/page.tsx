import { PageHeader } from '@/components/layout/page-header'

export default function ParentDashboard() {
  return (
    <div>
      <PageHeader
        title="My Child's Day"
        description="Attendance, homework, photos, and updates"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Daily feed — coming soon
        </p>
      </div>
    </div>
  )
}
