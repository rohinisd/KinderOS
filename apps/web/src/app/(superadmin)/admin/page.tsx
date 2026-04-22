import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** `/admin` → default super-admin screen (same layout; requireSuperAdmin runs in layout). */
export default function AdminIndexPage() {
  redirect('/admin/tenants')
}
