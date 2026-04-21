import type { Plan } from '@kinderos/db'
import { prisma } from './prisma'
import { PLAN_ORDER } from './plan-pricing'

/**
 * Resolve whether a feature is on for a school.
 * - Master switch: `isEnabled` on the flag row.
 * - If `schoolIds` is non-empty: only those school IDs get access (pilot allowlist).
 * - Else if `planGating` is set: school plan must be at or above that tier.
 * - Else: all schools (when enabled).
 */
export async function isSchoolFeatureEnabled(flagKey: string, schoolId: string): Promise<boolean> {
  const [flag, school] = await Promise.all([
    prisma.featureFlag.findUnique({ where: { key: flagKey } }),
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { plan: true, deletedAt: true, isActive: true },
    }),
  ])
  if (!flag?.isEnabled || !school || school.deletedAt || !school.isActive) return false
  if (flag.schoolIds.length > 0) return flag.schoolIds.includes(schoolId)
  const gating = flag.planGating as Plan | null
  if (!gating) return true
  const schoolTier = PLAN_ORDER[school.plan]
  const minTier = PLAN_ORDER[gating]
  if (schoolTier === undefined || minTier === undefined) return false
  return schoolTier >= minTier
}
