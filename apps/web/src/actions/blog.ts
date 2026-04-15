'use server'

import { prisma } from '@/lib/prisma'
import { requireMarketingEditor } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import { ContentStatus } from '@kinderos/db'

const BlogUpsertSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1).max(200),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).max(50000),
  coverImageUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
  tags: z.array(z.string().max(40)).max(20).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})

function revalidateBlog(slug: string) {
  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/blog`)
  revalidatePath('/office/website')
}

export async function upsertBlogPost(
  input: z.infer<typeof BlogUpsertSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const { schoolId, staffId, schoolSlug } = await requireMarketingEditor()
    const data = BlogUpsertSchema.parse(input)
    const tags = data.tags ?? []
    const cover = data.coverImageUrl === '' || data.coverImageUrl === undefined ? null : data.coverImageUrl

    if (data.id) {
      const existing = await prisma.blogPost.findFirst({
        where: { id: data.id, schoolId },
      })
      if (!existing) return err('Post not found')

      const slugTaken = await prisma.blogPost.findFirst({
        where: {
          schoolId,
          slug: data.slug,
          NOT: { id: data.id },
        },
      })
      if (slugTaken) return err('Another post already uses this slug')

      const row = await prisma.blogPost.update({
        where: { id: data.id },
        data: {
          title: data.title.trim(),
          slug: data.slug.trim(),
          excerpt: data.excerpt?.trim() || null,
          content: data.content,
          coverImageUrl: cover,
          tags,
          status: data.status as ContentStatus,
          publishedAt:
            data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED'
              ? new Date()
              : existing.publishedAt,
        },
      })
      revalidateBlog(schoolSlug)
      revalidatePath(`/${schoolSlug}/blog/${row.slug}`)
      return ok({ id: row.id })
    }

    const slugTaken = await prisma.blogPost.findUnique({
      where: { schoolId_slug: { schoolId, slug: data.slug } },
    })
    if (slugTaken) return err('This slug is already in use')

    const row = await prisma.blogPost.create({
      data: {
        schoolId,
        title: data.title.trim(),
        slug: data.slug.trim(),
        excerpt: data.excerpt?.trim() || null,
        content: data.content,
        coverImageUrl: cover,
        tags,
        status: data.status as ContentStatus,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        createdBy: staffId,
      },
    })
    revalidateBlog(schoolSlug)
    revalidatePath(`/${schoolSlug}/blog/${row.slug}`)
    return ok({ id: row.id })
  } catch (error) {
    if (error instanceof z.ZodError) return err(error.issues.map((e) => e.message).join(', '))
    console.error('[upsertBlogPost]', error)
    return err('Failed to save blog post')
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, schoolSlug } = await requireMarketingEditor()

    const existing = await prisma.blogPost.findFirst({
      where: { id, schoolId },
      select: { slug: true },
    })
    if (!existing) return err('Post not found')

    await prisma.blogPost.delete({ where: { id } })
    revalidateBlog(schoolSlug)
    revalidatePath(`/${schoolSlug}/blog/${existing.slug}`)
    return ok({ success: true })
  } catch (error) {
    console.error('[deleteBlogPost]', error)
    return err('Failed to delete post')
  }
}
