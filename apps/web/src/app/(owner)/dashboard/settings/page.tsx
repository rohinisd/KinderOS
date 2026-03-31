import { requireOwner } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function SettingsPage() {
  await requireOwner()

  return (
    <div>
      <PageHeader
        title="Settings"
        description="School configuration, academic year, GST"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          School settings — coming soon
        </p>
      </div>
    </div>
  )
}
