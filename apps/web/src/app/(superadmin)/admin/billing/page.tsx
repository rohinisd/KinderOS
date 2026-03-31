import { PageHeader } from '@/components/layout/page-header'

export default function BillingPage() {
  return (
    <div>
      <PageHeader
        title="Platform Billing"
        description="Subscription management and MRR tracking"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Billing dashboard — coming soon
        </p>
      </div>
    </div>
  )
}
