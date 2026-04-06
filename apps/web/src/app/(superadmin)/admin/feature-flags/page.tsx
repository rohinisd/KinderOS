import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'

export const dynamic = 'force-dynamic'

export default async function FeatureFlagsPage() {
  const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } })

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Toggle features per plan or per school"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        {flags.length > 0 ? (
          <div className="space-y-2">
            {flags.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="font-mono text-sm">{f.key}</span>
                <span className={`text-sm font-medium ${f.isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {f.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No feature flags configured.</p>
        )}
      </div>
    </div>
  )
}
