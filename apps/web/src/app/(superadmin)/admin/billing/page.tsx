import type { Plan } from '@kinderos/db'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { PLAN_MONTHLY_INR } from '@/lib/plan-pricing'
import { BillingClient, type BillingSchoolRow } from './billing-client'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  await requireSuperAdmin()

  const schools = await prisma.school.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      planExpiresAt: true,
      isActive: true,
    },
  })

  const now = new Date()
  const horizon = new Date(now)
  horizon.setDate(horizon.getDate() + 30)

  let mrrInr = 0
  const byPlan: Record<Plan, number> = {
    STARTER: 0,
    GROWTH: 0,
    ACADEMY: 0,
  }

  let expiringWithinDays = 0

  for (const s of schools) {
    const tier = s.plan
    byPlan[tier] = byPlan[tier] + 1
    if (s.isActive) {
      mrrInr += PLAN_MONTHLY_INR[tier]
    }
    if (s.planExpiresAt && s.planExpiresAt >= now && s.planExpiresAt <= horizon) {
      expiringWithinDays += 1
    }
  }

  const activeSchools = schools.filter((s) => s.isActive).length

  const rows: BillingSchoolRow[] = schools.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    plan: s.plan,
    planExpiresAt: s.planExpiresAt ? s.planExpiresAt.toISOString() : null,
    isActive: s.isActive,
  }))

  return (
    <div>
      <PageHeader
        title="Platform Billing"
        description="Subscription plans, indicative MRR, and renewal dates per school"
      />
      <div className="mt-6">
        <BillingClient
          schools={rows}
          summary={{
            mrrInr,
            activeSchools,
            expiringWithinDays,
            byPlan,
          }}
        />
      </div>
    </div>
  )
}
