import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function SchoolBlogIndexPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug, isActive: true },
  })
  if (!school) notFound()

  const posts = await prisma.blogPost.findMany({
    where: { schoolId: school.id, status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="border-b bg-white px-6 py-8"
        style={{
          borderBottomColor: `${school.brandColor}33`,
        }}
      >
        <div className="mx-auto max-w-3xl">
          <Link href={`/${schoolSlug}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← {school.name}
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Blog</h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No articles yet.</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/${schoolSlug}/blog/${p.slug}`}
                  className="block rounded-xl border bg-white p-6 shadow-sm transition hover:border-gray-300"
                >
                  <h2 className="text-xl font-semibold">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 text-muted-foreground">{p.excerpt}</p>}
                  {p.publishedAt && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {p.publishedAt.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
