import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SpotlightStatus } from '@kinderos/db'

export default async function SchoolPublicPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug, isActive: true },
    include: {
      announcements: {
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      },
      gallery: {
        where: { isPublic: true },
        orderBy: { eventDate: 'desc' },
        take: 4,
        include: { photos: { take: 1 } },
      },
      spotlights: {
        where: { status: SpotlightStatus.LIVE },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, body: true, imageUrl: true, videoUrl: true },
      },
    },
  })

  if (!school) notFound()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative flex min-h-[60vh] items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${school.brandColor}, ${school.accentColor})`,
        }}
      >
        <div className="text-center text-white">
          {school.logoUrl && (
            <img
              src={school.logoUrl}
              alt={school.name}
              className="mx-auto mb-6 h-24 w-24 rounded-full bg-white/20 object-contain p-2"
            />
          )}
          <h1 className="text-4xl font-bold sm:text-5xl">{school.name}</h1>
          {school.tagline && (
            <p className="mt-3 text-xl text-white/80">{school.tagline}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${schoolSlug}/admissions`}
              className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-gray-900 shadow-lg transition hover:bg-white/90"
            >
              Apply for Admission
            </Link>
            <Link
              href={`/${schoolSlug}/blog`}
              className="inline-block rounded-lg border-2 border-white/80 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Blog
            </Link>
          </div>
        </div>
      </section>

      {school.spotlights.length > 0 && (
        <section className="border-t bg-white px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold">Why families choose us</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {school.spotlights.map((s) => (
                <article
                  key={s.id}
                  className="overflow-hidden rounded-2xl border bg-gray-50/80 shadow-sm"
                >
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt="" className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{s.body}</p>
                    {s.videoUrl && (
                      <p className="mt-3 text-sm">
                        <a href={s.videoUrl} className="font-medium text-brand-600 underline" target="_blank" rel="noopener noreferrer">
                          Watch video
                        </a>
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {school.description && (
        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">About Us</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {school.description}
          </p>
        </section>
      )}

      {/* Contact */}
      <section className="border-t bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Contact Us</h2>
          <div className="mt-6 space-y-2 text-muted-foreground">
            {school.address && <p>{school.address}</p>}
            {school.phone && <p>Phone: {school.phone}</p>}
            {school.email && <p>Email: {school.email}</p>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {school.name}</p>
        <p className="mt-1 text-xs">Powered by KinderOS</p>
      </footer>
    </div>
  )
}
