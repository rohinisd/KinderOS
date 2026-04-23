/**
 * Hosts that show the SchoolOS SaaS marketing home — not a school custom domain.
 * Set PLATFORM_HOSTS in Vercel (comma-separated), e.g. `kinderos.vercel.app,www.kinderos.in`
 */
export function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/:\d+$/, '')
}

function platformHostsList(): string[] {
  const raw = process.env.PLATFORM_HOSTS ?? 'localhost,127.0.0.1,kinderos.vercel.app'
  return raw
    .split(',')
    .map((s) => normalizeHost(s.trim()))
    .filter(Boolean)
}

/** True when this request should show the platform landing at `/`, not a tenant site. */
export function isPlatformHost(host: string): boolean {
  const h = normalizeHost(host)
  const list = platformHostsList()
  if (list.includes(h)) return true
  // Preview / default Vercel deployments (not a school vanity domain)
  if (h.endsWith('.vercel.app')) return true
  return false
}

/** Variants to match `School.customDomain` (hostname only, no protocol). */
export function hostLookupVariants(host: string): string[] {
  const h = normalizeHost(host)
  const noWww = h.replace(/^www\./, '')
  const withWww = noWww.startsWith('www.') ? noWww : `www.${noWww}`
  return Array.from(new Set([h, noWww, withWww].filter(Boolean)))
}
