import { TopBar } from '@/components/layout/topbar'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect('/no-access')

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar schoolName={user.school.name} />
      <main className="flex-1 bg-gray-50 p-4 sm:p-6">{children}</main>
    </div>
  )
}
