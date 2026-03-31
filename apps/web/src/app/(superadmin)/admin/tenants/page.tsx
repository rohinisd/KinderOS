import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'

export default async function TenantsPage() {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { students: true, staff: true } } },
  })

  return (
    <div>
      <PageHeader
        title="All Schools"
        description={`${schools.length} tenants on platform`}
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Tenant management table — coming soon
        </p>
      </div>
    </div>
  )
}
