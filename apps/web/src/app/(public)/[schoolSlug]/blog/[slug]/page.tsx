import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; slug: string }>
}) {
  const { schoolSlug, slug } = await params
  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug, isActive: true },
  })
  if (!school) notFound()

  const post = await prisma.blogPost.findUnique({
    where: {
      schoolId_slug: { schoolId: school.id, slug },
      status: 'PUBLISHED',
    },
  })
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold">{post.title}</h1>
      {post.excerpt && (
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
      )}
      <div className="prose mt-10 max-w-none">
        <p className="text-sm text-muted-foreground">
          Blog content renderer — coming soon
        </p>
      </div>
    </article>
  )
}
