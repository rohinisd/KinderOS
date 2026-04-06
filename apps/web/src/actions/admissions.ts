'use server'

import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import { normalizePhone } from '@kinderos/utils'

const CreateLeadSchema = z.object({
  childName: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date().optional(),
  gradeApplying: z.string().min(1),
  parentName: z.string().min(1).max(100),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  source: z.string().optional(),
  notes: z.string().optional(),
})

export async function createAdmissionLead(
  input: z.infer<typeof CreateLeadSchema>
): Promise<ActionResult<{ leadId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()
    const data = CreateLeadSchema.parse(input)

    const lead = await prisma.admissionLead.create({
      data: {
        schoolId,
        childName: data.childName,
        dateOfBirth: data.dateOfBirth,
        gradeApplying: data.gradeApplying,
        parentName: data.parentName,
        phone: normalizePhone(data.phone),
        email: data.email || null,
        source: data.source,
        notes: data.notes,
        stage: 'NEW_ENQUIRY',
      },
    })

    revalidatePath('/dashboard/admissions')
    return ok({ leadId: lead.id })
  } catch (error) {
    console.error('[createAdmissionLead]', error)
    return err('Failed to create admission lead')
  }
}

export async function updateLeadStage(
  id: string,
  stage: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, userId } = await requireSchoolAuth()

    const lead = await prisma.admissionLead.findFirst({ where: { id, schoolId } })
    if (!lead) return err('Lead not found')

    await prisma.$transaction([
      prisma.admissionLead.update({
        where: { id },
        data: { stage: stage as 'NEW_ENQUIRY' | 'CONTACTED' | 'VISIT_SCHEDULED' | 'INTERVIEW_DONE' | 'DOCS_PENDING' | 'ADMITTED' | 'REJECTED' | 'DROPPED' },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: id,
          type: 'stage_change',
          note: `Stage changed from ${lead.stage} to ${stage}`,
          by: userId,
        },
      }),
    ])

    revalidatePath('/dashboard/admissions')
    return ok({ success: true })
  } catch (error) {
    console.error('[updateLeadStage]', error)
    return err('Failed to update lead stage')
  }
}

export async function addLeadNote(
  leadId: string,
  note: string,
  type: string = 'note'
): Promise<ActionResult<{ activityId: string }>> {
  try {
    const { schoolId, userId } = await requireSchoolAuth()

    const lead = await prisma.admissionLead.findFirst({ where: { id: leadId, schoolId } })
    if (!lead) return err('Lead not found')

    const activity = await prisma.leadActivity.create({
      data: { leadId, type, note, by: userId },
    })

    revalidatePath('/dashboard/admissions')
    return ok({ activityId: activity.id })
  } catch (error) {
    console.error('[addLeadNote]', error)
    return err('Failed to add note')
  }
}
