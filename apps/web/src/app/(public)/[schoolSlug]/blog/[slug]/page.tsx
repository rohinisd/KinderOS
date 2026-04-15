import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href={`/${schoolSlug}`} className="hover:text-foreground">{school.name}</Link>
        <span className="mx-2">/</span>
        <Link href={`/${schoolSlug}/blog`} className="hover:text-foreground">Blog</Link>
      </nav>
      <h1 className="text-4xl font-bold">{post.title}</h1>
      {post.excerpt && (
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
      )}
      <div className="prose mt-10 max-w-none">
        <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {post.content}
        </div>
      </div>
    </article>
  )
}
