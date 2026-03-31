import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function AnnouncementsPage() {
  await requireSchoolAuth()

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Broadcast to parents, teachers, and staff"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Announcement composer — coming soon
        </p>
      </div>
    </div>
  )
}
