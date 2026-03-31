import { requireTeacher } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function ParentMessagingPage() {
  await requireTeacher()

  return (
    <div>
      <PageHeader
        title="Parent Communication"
        description="Message parents and share updates"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Parent messaging — coming soon
        </p>
      </div>
    </div>
  )
}
