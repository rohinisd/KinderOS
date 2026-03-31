import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function ReceiptsPage() {
  await requireSchoolAuth()

  return (
    <div>
      <PageHeader
        title="Receipts"
        description="Generate and manage fee receipts"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Receipt management — coming soon
        </p>
      </div>
    </div>
  )
}
