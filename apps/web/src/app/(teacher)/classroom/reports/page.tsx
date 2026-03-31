import { requireTeacher } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function ProgressReportsPage() {
  await requireTeacher()

  return (
    <div>
      <PageHeader
        title="Progress Reports"
        description="AI-powered student progress reports"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          AI report generator — coming soon
        </p>
      </div>
    </div>
  )
}
