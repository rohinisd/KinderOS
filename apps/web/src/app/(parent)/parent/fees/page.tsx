import { PageHeader } from '@/components/layout/page-header'

export default function ParentFeesPage() {
  return (
    <div>
      <PageHeader
        title="Fee Payments"
        description="View invoices and pay fees online"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Razorpay checkout — coming soon
        </p>
      </div>
    </div>
  )
}
