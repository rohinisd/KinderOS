import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'OWNER') redirect('/sign-in')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar portal="owner" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar schoolName={user.school.name} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
