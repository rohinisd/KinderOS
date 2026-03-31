import { requireOwner } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function AnalyticsPage() {
  await requireOwner()

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Enrollment, fees, attendance trends"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Charts and analytics — coming soon
        </p>
      </div>
    </div>
  )
}
