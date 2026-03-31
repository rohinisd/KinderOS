import { PageHeader } from '@/components/layout/page-header'

export default function GalleryPage() {
  return (
    <div>
      <PageHeader
        title="Photo Gallery"
        description="School events and class photos"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Photo gallery — coming soon
        </p>
      </div>
    </div>
  )
}
