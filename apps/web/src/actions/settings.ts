'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireSchoolAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'

const UpdateSchoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tagline: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  gstin: z.string().max(20).optional(),
  brandColor: z.string().optional(),
  accentColor: z.string().optional(),
})

export async function updateSchoolSettings(
  input: z.infer<typeof UpdateSchoolSchema>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId } = await requireOwner()
    const data = UpdateSchoolSchema.parse(input)

    await prisma.school.update({
      where: { id: schoolId },
      data,
    })

    const s = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { slug: true },
    })
    if (s?.slug) {
      revalidatePath(`/${s.slug}`)
      revalidatePath(`/${s.slug}/admissions`)
      revalidatePath(`/${s.slug}/blog`)
    }
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/customize')
    return ok({ success: true })
  } catch (error) {
    console.error('[updateSchoolSettings]', error)
    return err('Failed to update school settings')
  }
}

const CreateClassSchema = z.object({
  name: z.string().min(1).max(100),
  section: z.string().max(10).optional(),
  capacity: z.number().int().positive().default(30),
  roomNumber: z.string().max(20).optional(),
  classTeacherId: z.string().cuid().optional(),
})

export async function createClass(
  input: z.infer<typeof CreateClassSchema>
): Promise<ActionResult<{ classId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()

    const academicYear = await prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    })

    if (!academicYear) {
      const ay = await prisma.academicYear.create({
        data: {
          schoolId,
          label: '2025-26',
          startDate: new Date('2025-04-01'),
          endDate: new Date('2026-03-31'),
          isCurrent: true,
        },
      })
      const data = CreateClassSchema.parse(input)
      const cls = await prisma.class.create({
        data: {
          schoolId,
          academicYearId: ay.id,
          name: data.name,
          section: data.section,
          capacity: data.capacity,
          roomNumber: data.roomNumber,
          classTeacherId: data.classTeacherId,
        },
      })
      revalidatePath('/dashboard/settings')
      return ok({ classId: cls.id })
    }

    const data = CreateClassSchema.parse(input)
    const cls = await prisma.class.create({
      data: {
        schoolId,
        academicYearId: academicYear.id,
        name: data.name,
        section: data.section,
        capacity: data.capacity,
        roomNumber: data.roomNumber,
        classTeacherId: data.classTeacherId,
      },
    })

    revalidatePath('/dashboard/settings')
    return ok({ classId: cls.id })
  } catch (error) {
    console.error('[createClass]', error)
    return err('Failed to create class')
  }
}

export async function deleteClass(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId } = await requireSchoolAuth()

    const cls = await prisma.class.findFirst({
      where: { id, schoolId },
      include: { _count: { select: { students: true } } },
    })
    if (!cls) return err('Class not found')
    if (cls._count.students > 0) return err('Cannot delete class with students')

    await prisma.class.delete({ where: { id } })
    revalidatePath('/dashboard/settings')
    return ok({ success: true })
  } catch (error) {
    console.error('[deleteClass]', error)
    return err('Failed to delete class')
  }
}
