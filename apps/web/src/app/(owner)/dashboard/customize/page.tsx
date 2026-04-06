import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { CustomizeClient } from './customize-client'

export default async function CustomizePage() {
  const { schoolId } = await requireOwner()

  const school = await prisma.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      slug: true,
      brandColor: true,
      accentColor: true,
      logoUrl: true,
      heroImageUrl: true,
      pageConfig: true,
    },
  })

  return (
    <div>
      <PageHeader
        title="Customization Studio"
        description="Brand your school's public page"
      />
      <div className="mt-6">
        <CustomizeClient school={school} />
      </div>
    </div>
  )
}
