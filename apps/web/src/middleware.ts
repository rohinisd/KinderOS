import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isPlatformHost, normalizeHost } from '@/lib/platform-host'
import { RESERVED_SCHOOL_SLUGS } from '@/lib/reserved-slugs'

/** App routes at the first URL segment — not school public marketing pages (path-based). */
const RESERVED_ROOT_SEGMENTS = new Set([
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

function isPublicSchoolMarketingPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return false
  const first = segments[0]
  if (!first || RESERVED_ROOT_SEGMENTS.has(first)) return false
  if (RESERVED_SCHOOL_SLUGS.has(first)) return false
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(first)) return false
  if (segments.length === 1) return true
  if (segments.length === 2 && segments[1] === 'admissions') return true
  if (segments.length === 2 && segments[1] === 'blog') return true
  if (segments.length === 3 && segments[1] === 'blog') return true
  return false
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/api/health(.*)',
  '/no-access',
  '/parent(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const url = new URL(request.url)
  const pathname = url.pathname
  const host = normalizeHost(request.headers.get('host') ?? '')

  // Avoid DB access inside middleware runtime.
  // Custom-domain blog/admissions can be resolved at page level.
  if (!isPlatformHost(host) && (pathname === '/admissions' || pathname === '/blog' || pathname.startsWith('/blog/'))) {
    return NextResponse.next()
  }

  if (isPublicSchoolMarketingPath(pathname)) return NextResponse.next()
  if (isPublicRoute(request)) return NextResponse.next()

  const { userId } = await auth()
  if (!userId) {
    const signInUrl = new URL('/', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
