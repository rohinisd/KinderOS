import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function OfficeFees() {
  await requireSchoolAuth()

  return (
    <div>
      <PageHeader
        title="Fee Collection"
        description="Record payments and manage invoices"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Fee collection desk — coming soon
        </p>
      </div>
    </div>
  )
}
