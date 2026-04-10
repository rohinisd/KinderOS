import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const ADMIN_ROLES = ['OWNER', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT']

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect('/no-access')
  if (!ADMIN_ROLES.includes(user.role)) redirect('/no-access')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar portal="admin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar schoolName={user.school.name} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
