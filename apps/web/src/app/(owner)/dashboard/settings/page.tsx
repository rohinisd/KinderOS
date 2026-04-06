import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const { schoolId } = await requireOwner()

  const [school, classes] = await Promise.all([
    prisma.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        tagline: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        gstin: true,
        currentAcademicYear: true,
      },
    }),
    prisma.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        section: true,
        capacity: true,
        roomNumber: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const classData = classes.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
    capacity: c.capacity,
    roomNumber: c.roomNumber,
    studentCount: c._count.students,
  }))

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your school profile and classes"
      />
      <div className="mt-6">
        <SettingsClient school={school} classes={classData} />
      </div>
    </div>
  )
}
