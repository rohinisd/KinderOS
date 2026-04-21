import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { requireSuperAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireSuperAdmin()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar portal="superadmin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar schoolName={`Super Admin · ${admin.firstName}`} portal="superadmin" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
