import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { StudentsClient } from './students-client'

export default async function StudentsPage() {
  const { schoolId } = await requireSchoolAuth()

  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        class: { select: { id: true, name: true } },
        parents: {
          select: { id: true, firstName: true, lastName: true, phone: true, relation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const serialized = students.map((s) => ({
    ...s,
    dateOfBirth: s.dateOfBirth?.toISOString() ?? null,
    createdAt: undefined,
    updatedAt: undefined,
    deletedAt: undefined,
    admissionDate: undefined,
  }))

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${students.length} students enrolled`}
      />
      <div className="mt-6">
        <StudentsClient students={serialized as never} classes={classes} />
      </div>
    </div>
  )
}
