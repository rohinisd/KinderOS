'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClassEventStory, createSchoolEventStory } from '@/actions/events-gallery'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type AlbumItem = {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  eventDate: string | null
  photoCount: number
  classIds: string[]
}

function parsePhotoUrls(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function EventStoriesClient({
  mode,
  albums,
}: {
  mode: 'class' | 'school'
  albums: AlbumItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function submitStory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const title = (form.get('title') as string) || ''
    const description = (form.get('description') as string) || ''
    const eventDateRaw = (form.get('eventDate') as string) || ''
    const coverUrl = (form.get('coverUrl') as string) || ''
    const photoUrlsText = (form.get('photoUrls') as string) || ''
    const photoUrls = parsePhotoUrls(photoUrlsText)

    startTransition(async () => {
      const payload = {
        title,
        description,
        eventDate: eventDateRaw ? new Date(`${eventDateRaw}T00:00:00.000Z`) : undefined,
        coverUrl: coverUrl || undefined,
        photoUrls,
      }

      const result =
        mode === 'class'
          ? await createClassEventStory(payload)
          : await createSchoolEventStory(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(mode === 'class' ? 'Class event story published' : 'School event story published')
      ;(e.currentTarget as HTMLFormElement).reset()
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'class' ? 'Class Event Stories' : 'School Event Stories'}
        description={
          mode === 'class'
            ? 'Post class-level event updates with photos for parents'
            : 'Post school-level event updates with photos for all parents'
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Create new story</CardTitle>
          <CardDescription>
            Add title, event date, and photo URLs (one per line). Parents see these in their Gallery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitStory}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required placeholder="Annual Day Celebration" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input id="eventDate" name="eventDate" type="date" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} placeholder="Write a short story about the event..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coverUrl">Cover Image URL</Label>
              <Input id="coverUrl" name="coverUrl" placeholder="https://..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photoUrls">Photo URLs (one per line)</Label>
              <Textarea
                id="photoUrls"
                name="photoUrls"
                rows={6}
                placeholder={'https://...\nhttps://...\nhttps://...'}
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Publishing...' : 'Publish Story'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent stories</CardTitle>
          <CardDescription>Latest stories posted to parents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {albums.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stories yet.</p>
          ) : (
            albums.map((album) => (
              <div key={album.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{album.title}</h3>
                  <div className="flex items-center gap-2">
                    {mode === 'class' ? (
                      <Badge variant="info">Class level</Badge>
                    ) : (
                      <Badge variant="secondary">School level</Badge>
                    )}
                    <Badge variant="outline">{album.photoCount} photos</Badge>
                  </div>
                </div>
                {album.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{album.description}</p>
                ) : null}
                {album.eventDate ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Event date: {new Date(album.eventDate).toLocaleDateString('en-IN')}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
