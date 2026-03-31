import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const { userId, orgRole } = await auth()

  if (userId) {
    if (orgRole === 'org:admin') redirect('/dashboard')
    if (orgRole === 'org:teacher') redirect('/classroom')
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-500 via-accent-500 to-brand-700">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          KinderOS
        </h1>
        <p className="mt-4 text-xl text-white/80">
          Give every kindergarten their own digital school
        </p>
        <p className="mt-2 text-lg text-white/60">
          Multi-tenant school management for India
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/sign-in"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-600 shadow-lg transition hover:bg-white/90"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
