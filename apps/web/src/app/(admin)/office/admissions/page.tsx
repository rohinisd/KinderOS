import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function OfficeAdmissions() {
  await requireSchoolAuth()

  return (
    <div>
      <PageHeader
        title="Admission Enquiries"
        description="Manage incoming enquiries from parents"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Enquiry list — coming soon
        </p>
      </div>
    </div>
  )
}
