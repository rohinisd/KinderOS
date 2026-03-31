import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function AdmissionsPage() {
  const { schoolId } = await requireSchoolAuth()

  const leads = await prisma.admissionLead.findMany({
    where: { schoolId },
    include: { activities: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <PageHeader
        title="Admissions CRM"
        description={`${leads.length} enquiries in pipeline`}
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Admissions pipeline — coming soon
        </p>
      </div>
    </div>
  )
}
