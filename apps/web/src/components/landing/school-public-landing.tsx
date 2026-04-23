import Link from 'next/link'

type Spotlight = {
  id: string
  title: string
  body: string
  imageUrl: string | null
  videoUrl: string | null
}

type SchoolPublic = {
  name: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  heroImageUrl: string | null
  brandColor: string
  accentColor: string
  address: string | null
  phone: string | null
  email: string | null
  spotlights: Spotlight[]
}

/**
 * @param basePath - Path prefix for links: `/${slug}` on the platform, or `""` on a school custom domain.
 */
export function SchoolPublicLanding({ school, basePath }: { school: SchoolPublic; basePath: string }) {
  const p = (path: string) => (basePath ? `${basePath}${path}` : path)
  const heroBackground = school.heroImageUrl
    ? `linear-gradient(135deg, ${school.brandColor}CC, ${school.accentColor}CC), url(${school.heroImageUrl})`
    : `linear-gradient(135deg, ${school.brandColor}, ${school.accentColor})`

  return (
    <div className="min-h-screen">
      <section
        className="relative flex min-h-[60vh] items-center justify-center bg-cover bg-center"
        style={{
          background: heroBackground,
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
          {school.tagline && <p className="mt-3 text-xl text-white/80">{school.tagline}</p>}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={p('/admissions')}
              className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-gray-900 shadow-lg transition hover:bg-white/90"
            >
              Apply for Admission
            </Link>
            <Link
              href={p('/blog')}
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
                <article key={s.id} className="overflow-hidden rounded-2xl border bg-gray-50/80 shadow-sm">
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt="" className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{s.body}</p>
                    {s.videoUrl && (
                      <p className="mt-3 text-sm">
                        <a
                          href={s.videoUrl}
                          className="font-medium text-brand-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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

      {school.description && (
        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">About Us</h2>
          <p className="mt-4 text-lg text-muted-foreground">{school.description}</p>
        </section>
      )}

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

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {school.name}</p>
        <p className="mt-1 text-xs">Powered by KinderOS</p>
      </footer>
    </div>
  )
}
