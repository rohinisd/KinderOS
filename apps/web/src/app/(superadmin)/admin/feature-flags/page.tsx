import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { DEFAULT_FEATURE_FLAG_DEFINITIONS } from '@/lib/default-feature-flags'
import { FeatureFlagsClient, type FlagRow } from './feature-flags-client'

export const dynamic = 'force-dynamic'

export default async function FeatureFlagsPage() {
  await requireSuperAdmin()

  for (const def of DEFAULT_FEATURE_FLAG_DEFINITIONS) {
    await prisma.featureFlag.upsert({
      where: { key: def.key },
      create: { key: def.key, isEnabled: false, schoolIds: [] },
      update: {},
    })
  }

  const [flags, schools] = await Promise.all([
    prisma.featureFlag.findMany({ orderBy: { key: 'asc' } }),
    prisma.school.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const rows: FlagRow[] = flags.map((f) => ({
    id: f.id,
    key: f.key,
    isEnabled: f.isEnabled,
    planGating: f.planGating,
    schoolIds: f.schoolIds,
  }))

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Toggle features, set minimum plan tier, or run a pilot on specific schools"
      />
      <div className="mt-6">
        <FeatureFlagsClient flags={rows} schools={schools} />
      </div>
    </div>
  )
}
