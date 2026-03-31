import { requireOwner } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function CustomizePage() {
  await requireOwner()

  return (
    <div>
      <PageHeader
        title="Customization Studio"
        description="Brand your school's website and app"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Logo, colors, sections, domain — coming soon
        </p>
      </div>
    </div>
  )
}
