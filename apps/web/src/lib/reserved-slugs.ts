/** URL segments reserved for the app — cannot be used as a school slug. */
export const RESERVED_SCHOOL_SLUGS = new Set([
  'admissions',
  'blog',
  'sign-in',
  'sign-up',
  'dashboard',
  'office',
  'classroom',
  'admin',
  'parent',
  'no-access',
  'api',
])

export function isReservedSchoolSlug(slug: string): boolean {
  return RESERVED_SCHOOL_SLUGS.has(slug.toLowerCase())
}
