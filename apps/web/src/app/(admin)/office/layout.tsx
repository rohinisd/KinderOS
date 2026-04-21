import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { getAuthUser, isPlatformSuperAdminSession } from '@/lib/auth'
import type { OfficePortalVariant } from '@/lib/portal-variants'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Anyone who uses `/office` day-to-day (includes support/driver roles linked from home). */
const OFFICE_ACCESS_ROLES = [
  'OWNER',
  'PRINCIPAL',
  'ADMIN',
  'ACCOUNTANT',
  'SUPPORT_STAFF',
  'DRIVER',
] as const

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) {
    if (await isPlatformSuperAdminSession()) redirect('/admin/tenants')
    redirect('/no-access')
  }
  const officeAllowed = new Set<string>(OFFICE_ACCESS_ROLES)
  if (!officeAllowed.has(user.role)) redirect('/no-access')

  const officeVariant: OfficePortalVariant = user.role === 'ADMIN' ? 'admin' : 'staff'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar portal="admin" officeVariant={officeVariant} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar schoolName={user.school.name} portal="admin" officeVariant={officeVariant} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
