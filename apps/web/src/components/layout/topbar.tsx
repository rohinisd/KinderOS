'use client'

import { UserButton } from '@clerk/nextjs'
import { Bell } from 'lucide-react'

export function TopBar({ schoolName }: { schoolName?: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-3">
        {schoolName && (
          <span className="text-sm font-medium text-gray-700">{schoolName}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  )
}
