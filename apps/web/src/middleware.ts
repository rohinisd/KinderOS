import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/razorpay/webhook',
  '/api/cron(.*)',
  // School public pages: /[schoolSlug], /[schoolSlug]/admissions, etc.
  '/[^/]+',
  '/[^/]+/admissions',
  '/[^/]+/blog(.*)',
])

const isOwnerRoute = createRouteMatcher(['/dashboard(.*)'])
const isTeacherRoute = createRouteMatcher(['/classroom(.*)'])
const isAdminRoute = createRouteMatcher(['/office(.*)'])
const isParentRoute = createRouteMatcher(['/parent(.*)'])
const isSuperAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  // School public pages (slug-based) are always accessible
  if (isPublicRoute(request)) {
    return NextResponse.next()
  }

  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Require org selection for all authenticated portal routes
  if (!orgId && !isSuperAdminRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Role-based routing
  if (isOwnerRoute(request) && orgRole !== 'org:admin') {
    return NextResponse.redirect(new URL('/classroom', request.url))
  }

  if (isSuperAdminRoute(request)) {
    const superAdminIds = (process.env.SUPER_ADMIN_CLERK_IDS ?? '').split(',')
    if (!superAdminIds.includes(userId)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
