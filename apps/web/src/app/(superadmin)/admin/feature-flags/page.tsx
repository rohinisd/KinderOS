import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'

export default async function FeatureFlagsPage() {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: 'asc' },
  })

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Toggle features per plan or per school"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Feature flag editor — coming soon
        </p>
      </div>
    </div>
  )
}
