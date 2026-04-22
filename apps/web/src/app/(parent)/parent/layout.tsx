import { TopBar } from '@/components/layout/topbar'
import { getParentPortalUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const parent = await getParentPortalUser()
  if (!parent) redirect('/no-access')
  if (!parent.school.isActive) redirect('/no-access')

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar schoolName={parent.school.name} />
      <main className="flex-1 bg-gray-50 p-4 sm:p-6">{children}</main>
    </div>
  )
}
