import { getParentPortalUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageIcon } from 'lucide-react'
import type { Prisma } from '@kinderos/db'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const user = await getParentPortalUser()
  if (!user) redirect('/no-access')

  const childClassIds: string[] = []
  {
    const parentRows = await prisma.parent.findMany({
      where: { email: { equals: user.email, mode: 'insensitive' } },
      include: {
        students: {
          where: { schoolId: user.schoolId, deletedAt: null },
          select: { classId: true },
        },
      },
    })
    for (const p of parentRows) {
      for (const s of p.students) {
        if (s.classId) childClassIds.push(s.classId)
      }
    }
  }
  const uniqueClassIds = [...new Set(childClassIds)]

  const albumWhere: Prisma.GalleryAlbumWhereInput = {
    schoolId: user.schoolId,
    isPublic: true,
    OR:
      uniqueClassIds.length > 0
        ? [{ classIds: { isEmpty: true } }, { classIds: { hasSome: uniqueClassIds } }]
        : [{ classIds: { isEmpty: true } }],
  }

  const albums = await prisma.galleryAlbum.findMany({
    where: albumWhere,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { photos: true } } },
  })

  const emptyMessage = 'No photos yet. Your school will share photos here.'

  return (
    <div className="space-y-8">
      <PageHeader
        title="Photo Gallery"
        description="Smiles, celebrations, and everyday magic from school"
      />

      {albums.length === 0 ? (
        <Card className="border-sky-100 bg-sky-50/50 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <ImageIcon className="h-7 w-7" aria-hidden />
            </div>
            <CardTitle className="mt-4 text-lg text-sky-950">Albums are on their way</CardTitle>
            <CardDescription className="text-base text-sky-900/75">{emptyMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {albums.map((album) => (
            <Card
              key={album.id}
              className="overflow-hidden border-orange-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-50">
                {album.coverUrl ? (
                  <Image
                    src={album.coverUrl}
                    alt={`Cover for ${album.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-orange-300">
                    <ImageIcon className="h-16 w-16" strokeWidth={1.25} aria-hidden />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg text-orange-950">{album.title}</CardTitle>
                  <Badge variant={album.classIds.length > 0 ? 'info' : 'secondary'}>
                    {album.classIds.length > 0 ? 'Class event' : 'School event'}
                  </Badge>
                </div>
                <CardDescription className="text-orange-900/70">
                  {album._count.photos === 1 ? '1 photo' : `${album._count.photos} photos`}
                  {album.eventDate ? ` · ${new Date(album.eventDate).toLocaleDateString('en-IN')}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {album.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{album.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Shared by {user.school.name} — thank you for being part of our community.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
