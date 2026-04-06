import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { requireAuth, getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  const user = await getAuthUser()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar portal="admin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar schoolName={user?.school.name} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
