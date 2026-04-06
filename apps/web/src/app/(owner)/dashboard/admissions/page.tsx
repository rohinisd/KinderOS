import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { AdmissionsClient } from './admissions-client'

export default async function AdmissionsPage() {
  const { schoolId } = await requireSchoolAuth()

  const leads = await prisma.admissionLead.findMany({
    where: { schoolId },
    include: {
      activities: {
        select: { id: true, type: true, note: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = leads.map((l) => ({
    id: l.id,
    childName: l.childName,
    gradeApplying: l.gradeApplying,
    parentName: l.parentName,
    phone: l.phone,
    email: l.email,
    stage: l.stage,
    source: l.source,
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
    activities: l.activities.map((a) => ({
      id: a.id,
      type: a.type,
      note: a.note,
      createdAt: a.createdAt.toISOString(),
    })),
  }))

  return (
    <div>
      <PageHeader
        title="Admissions"
        description="Track and manage admission enquiries"
      />
      <div className="mt-6">
        <AdmissionsClient leads={serialized} />
      </div>
    </div>
  )
}
