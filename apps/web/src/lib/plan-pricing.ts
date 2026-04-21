import type { Plan } from '@kinderos/db'

/** Indicative monthly list price per plan (INR) — edit to match your commercial terms. */
export const PLAN_MONTHLY_INR: Record<Plan, number> = {
  STARTER: 2999,
  GROWTH: 5999,
  ACADEMY: 9999,
}

export const PLAN_LABEL: Record<Plan, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',
  ACADEMY: 'Academy',
}

/** Minimum plan tier for gating (STARTER < GROWTH < ACADEMY). */
export const PLAN_ORDER: Record<Plan, number> = {
  STARTER: 0,
  GROWTH: 1,
  ACADEMY: 2,
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
