import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { OfficeAdmissionsClient } from './office-admissions-client'

export const dynamic = 'force-dynamic'

const STAGE_ORDER = [
  'NEW_ENQUIRY',
  'CONTACTED',
  'VISIT_SCHEDULED',
  'INTERVIEW_DONE',
  'DOCS_PENDING',
  'ADMITTED',
  'REJECTED',
  'DROPPED',
] as const

export default async function OfficeAdmissionsPage() {
  const { schoolId } = await requireSchoolAuth()

  const [leads, stageAgg] = await Promise.all([
    prisma.admissionLead.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        childName: true,
        gradeApplying: true,
        parentName: true,
        phone: true,
        email: true,
        stage: true,
        source: true,
        createdAt: true,
      },
    }),
    prisma.admissionLead.groupBy({
      by: ['stage'],
      where: { schoolId },
      _count: true,
    }),
  ])

  const stageCounts: Record<string, number> = {}
  for (const s of STAGE_ORDER) {
    stageCounts[s] = 0
  }
  for (const row of stageAgg) {
    stageCounts[row.stage] = row._count
  }

  const serialized = leads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <div>
      <PageHeader
        title="Admission enquiries"
        description="Track pipeline stages and follow-ups"
      />
      <div className="mt-6">
        <OfficeAdmissionsClient leads={serialized} stageCounts={stageCounts} />
      </div>
    </div>
  )
}
