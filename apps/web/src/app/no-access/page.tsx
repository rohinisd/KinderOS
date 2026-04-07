import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { ShieldX } from 'lucide-react'

export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          No Access
        </h1>
        <p className="mt-3 text-gray-600">
          Your account is not linked to any school. Please ask your school
          owner or administrator to invite you using your email address.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Once invited, sign in again and you&apos;ll be automatically connected
          to your school with the correct role.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <SignOutButton>
            <button className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700">
              Sign Out &amp; Try Different Account
            </button>
          </SignOutButton>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
