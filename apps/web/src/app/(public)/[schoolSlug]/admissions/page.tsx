import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function AdmissionFormPage({
  params,
}: {
  params: { schoolSlug: string }
}) {
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug, isActive: true },
  })

  if (!school) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{school.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Admission Enquiry Form
          </p>
        </div>

        <div className="mt-10 rounded-lg border bg-white p-8 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Admission enquiry form — coming soon
          </p>
        </div>
      </div>
    </div>
  )
}
