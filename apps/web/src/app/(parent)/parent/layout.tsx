import { TopBar } from '@/components/layout/topbar'
import { requireAuth, getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  const user = await getAuthUser()

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar schoolName={user?.school.name} />
      <main className="flex-1 bg-gray-50 p-4 sm:p-6">{children}</main>
    </div>
  )
}
