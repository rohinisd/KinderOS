import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { TenantsClient } from './tenants-client'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
  await requireSuperAdmin()

  const schools = await prisma.school.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { students: true, staff: true } },
      staff: {
        where: { role: 'OWNER' },
        select: { firstName: true, lastName: true, email: true, phone: true },
        take: 1,
      },
    },
  })

  const serialized = schools.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    city: s.city,
    state: s.state,
    plan: s.plan,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    studentCount: s._count.students,
    staffCount: s._count.staff,
    owner: s.staff[0] ?? null,
  }))

  return (
    <div>
      <PageHeader
        title="Schools"
        description={`${schools.length} school${schools.length === 1 ? '' : 's'} on the platform`}
      />
      <div className="mt-6">
        <TenantsClient schools={serialized} />
      </div>
    </div>
  )
}
