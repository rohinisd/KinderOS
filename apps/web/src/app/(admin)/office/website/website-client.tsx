'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ExternalLink, Plus, Pencil, Trash2, Send, Check, X, RotateCcw } from 'lucide-react'
import { updateSchoolMarketing } from '@/actions/marketing'
import {
  createSchoolSpotlight,
  updateSchoolSpotlightDraft,
  submitSchoolSpotlightForReview,
  approveSchoolSpotlight,
  rejectSchoolSpotlight,
  withdrawSchoolSpotlightFromLive,
  deleteSchoolSpotlight,
} from '@/actions/spotlights'
import { upsertBlogPost, deleteBlogPost } from '@/actions/blog'
import { slugify } from '@/lib/slug'

type SchoolPayload = {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string
  pincode: string | null
  brandColor: string
  accentColor: string
  heroImageUrl: string | null
  logoUrl: string | null
  customDomain: string | null
}

type SpotlightRow = {
  id: string
  title: string
  body: string
  imageUrl: string | null
  videoUrl: string | null
  status: string
  rejectNote: string | null
  sortOrder: number
  createdByName: string
}

type BlogRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImageUrl: string | null
  tags: string[]
  status: string
  updatedAt: string
}

const spotlightStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  DRAFT: 'secondary',
  PENDING: 'warning',
  LIVE: 'success',
  REJECTED: 'destructive',
}

export function WebsiteClient({
  school,
  spotlights,
  blogPosts: posts,
  isOwner,
}: {
  school: SchoolPayload
  spotlights: SpotlightRow[]
  blogPosts: BlogRow[]
  isOwner: boolean
}) {
  const [isPending, startTransition] = useTransition()

  const [spotSheet, setSpotSheet] = useState<SpotlightRow | 'new' | null>(null)
  const [spotTitle, setSpotTitle] = useState('')
  const [spotBody, setSpotBody] = useState('')
  const [spotImage, setSpotImage] = useState('')
  const [spotVideo, setSpotVideo] = useState('')

  const [blogSheet, setBlogSheet] = useState<BlogRow | 'new' | null>(null)
  const [blogTitle, setBlogTitle] = useState('')
  const [blogSlug, setBlogSlug] = useState('')
  const [blogExcerpt, setBlogExcerpt] = useState('')
  const [blogContent, setBlogContent] = useState('')
  const [blogCover, setBlogCover] = useState('')
  const [blogStatus, setBlogStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT')

  const [rejectOpen, setRejectOpen] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const publicUrl = useMemo(() => `/${school.slug}`, [school.slug])
  const customBase = useMemo(
    () => (school.customDomain ? `https://${school.customDomain}` : null),
    [school.customDomain]
  )

  function openSpotlight(s: SpotlightRow | 'new') {
    setSpotSheet(s)
    if (s === 'new') {
      setSpotTitle('')
      setSpotBody('')
      setSpotImage('')
      setSpotVideo('')
    } else {
      setSpotTitle(s.title)
      setSpotBody(s.body)
      setSpotImage(s.imageUrl ?? '')
      setSpotVideo(s.videoUrl ?? '')
    }
  }

  function openBlog(p: BlogRow | 'new') {
    setBlogSheet(p)
    if (p === 'new') {
      setBlogTitle('')
      setBlogSlug('')
      setBlogExcerpt('')
      setBlogContent('')
      setBlogCover('')
      setBlogStatus('DRAFT')
    } else {
      setBlogTitle(p.title)
      setBlogSlug(p.slug)
      setBlogExcerpt(p.excerpt ?? '')
      setBlogContent(p.content)
      setBlogCover(p.coverImageUrl ?? '')
      setBlogStatus(p.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')
    }
  }

  function handleMarketingSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateSchoolMarketing({
        name: (form.get('name') as string) || undefined,
        tagline: (form.get('tagline') as string) || null,
        description: (form.get('description') as string) || null,
        phone: (form.get('phone') as string) || null,
        email: (form.get('email') as string) || null,
        address: (form.get('address') as string) || null,
        city: (form.get('city') as string) || null,
        state: (form.get('state') as string) || undefined,
        pincode: (form.get('pincode') as string) || null,
        brandColor: (form.get('brandColor') as string) || undefined,
        accentColor: (form.get('accentColor') as string) || undefined,
        heroImageUrl: (form.get('heroImageUrl') as string) || '',
        logoUrl: (form.get('logoUrl') as string) || '',
        ...(isOwner ? { customDomain: (form.get('customDomain') as string) || '' } : {}),
      })
      if (result.success) toast.success('Public site details saved')
      else toast.error(result.error)
    })
  }

  function saveSpotlight() {
    if (!spotSheet) return
    startTransition(async () => {
      if (spotSheet === 'new') {
        const r = await createSchoolSpotlight({
          title: spotTitle,
          body: spotBody,
          imageUrl: spotImage || null,
          videoUrl: spotVideo || null,
        })
        if (r.success) {
          toast.success('Spotlight created')
          setSpotSheet(null)
          window.location.reload()
        } else toast.error(r.error)
      } else {
        const r = await updateSchoolSpotlightDraft(spotSheet.id, {
          title: spotTitle,
          body: spotBody,
          imageUrl: spotImage || null,
          videoUrl: spotVideo || null,
        })
        if (r.success) {
          toast.success('Spotlight saved')
          setSpotSheet(null)
          window.location.reload()
        } else toast.error(r.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View public page
          </Link>
        </Button>
        {customBase && (
          <Button variant="outline" size="sm" asChild>
            <Link href={customBase} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open custom domain
            </Link>
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Path URL: <span className="font-mono text-foreground">{publicUrl}</span>
          {customBase && (
            <>
              {' '}
              · Custom: <span className="font-mono text-foreground">{customBase}</span>
            </>
          )}
        </span>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile &amp; branding</TabsTrigger>
          <TabsTrigger value="spotlights">USPs &amp; stories</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What appears on your school landing page</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMarketingSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">School name</Label>
                    <Input id="name" name="name" defaultValue={school.name} required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input id="tagline" name="tagline" defaultValue={school.tagline ?? ''} placeholder="Short line under the school name" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">About (shown on site)</Label>
                    <Textarea id="description" name="description" rows={4} defaultValue={school.description ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" defaultValue={school.phone ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Public email</Label>
                    <Input id="email" name="email" type="email" defaultValue={school.email ?? ''} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" defaultValue={school.address ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" defaultValue={school.city ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" defaultValue={school.state} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" name="pincode" defaultValue={school.pincode ?? ''} />
                  </div>
                  <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="brandColor">Brand color</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" id="brandColor" name="brandColor" defaultValue={school.brandColor} className="h-10 w-14 cursor-pointer rounded border" />
                        <Input defaultValue={school.brandColor} readOnly className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent color</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" id="accentColor" name="accentColor" defaultValue={school.accentColor} className="h-10 w-14 cursor-pointer rounded border" />
                        <Input defaultValue={school.accentColor} readOnly className="font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="logoUrl">Logo image URL</Label>
                    <Input id="logoUrl" name="logoUrl" placeholder="https://..." defaultValue={school.logoUrl ?? ''} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="heroImageUrl">Hero background image URL</Label>
                    <Input id="heroImageUrl" name="heroImageUrl" placeholder="https://..." defaultValue={school.heroImageUrl ?? ''} />
                  </div>
                  {isOwner && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="customDomain">Custom domain (optional)</Label>
                      <Input
                        id="customDomain"
                        name="customDomain"
                        placeholder="e.g. school.edu.in"
                        defaultValue={school.customDomain ?? ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        Add this exact hostname in Vercel → Domains, point DNS to Vercel, then save here. Families can use your domain without{' '}
                        <span className="font-mono">/{school.slug}</span> in the URL.
                      </p>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={isPending}>Save</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spotlights" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Spotlights</CardTitle>
              <Button size="sm" onClick={() => openSpotlight('new')}>
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Drafts can be edited by owner, principal, or admin. Submit for review; only the <strong>school owner</strong> can publish to the live site.
              </p>
              {spotlights.length === 0 ? (
                <p className="text-sm text-muted-foreground">No spotlights yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {spotlights.map((s) => (
                    <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{s.title}</span>
                          <Badge variant={spotlightStatusVariant[s.status] ?? 'secondary'}>{s.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">By {s.createdByName}</p>
                        {s.status === 'REJECTED' && s.rejectNote && (
                          <p className="mt-1 text-xs text-destructive">Note: {s.rejectNote}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(s.status === 'DRAFT' || s.status === 'REJECTED') && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openSpotlight(s)}>
                              <Pencil className="mr-1 h-3 w-3" /> Edit
                            </Button>
                            <Button size="sm" variant="secondary" disabled={isPending} onClick={() => {
                              startTransition(async () => {
                                const r = await submitSchoolSpotlightForReview(s.id)
                                if (r.success) { toast.success('Submitted'); window.location.reload() }
                                else toast.error(r.error)
                              })
                            }}>
                              <Send className="mr-1 h-3 w-3" /> Submit
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending} onClick={() => {
                              startTransition(async () => {
                                const r = await deleteSchoolSpotlight(s.id)
                                if (r.success) { toast.success('Deleted'); window.location.reload() }
                                else toast.error(r.error)
                              })
                            }}>
                              <Trash2 className="mr-1 h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {s.status === 'PENDING' && isOwner && (
                          <>
                            <Button size="sm" disabled={isPending} onClick={() => {
                              startTransition(async () => {
                                const r = await approveSchoolSpotlight(s.id)
                                if (r.success) { toast.success('Live on site'); window.location.reload() }
                                else toast.error(r.error)
                              })
                            }}>
                              <Check className="mr-1 h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setRejectOpen(s.id); setRejectNote('') }}>
                              <X className="mr-1 h-3 w-3" /> Reject
                            </Button>
                          </>
                        )}
                        {s.status === 'LIVE' && isOwner && (
                          <Button size="sm" variant="outline" disabled={isPending} onClick={() => {
                            startTransition(async () => {
                              const r = await withdrawSchoolSpotlightFromLive(s.id)
                              if (r.success) { toast.success('Withdrawn'); window.location.reload() }
                              else toast.error(r.error)
                            })
                          }}>
                            <RotateCcw className="mr-1 h-3 w-3" /> Withdraw
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Blog posts</CardTitle>
              <Button size="sm" onClick={() => openBlog('new')}>
                <Plus className="mr-2 h-4 w-4" /> New post
              </Button>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No posts yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {posts.map((p) => (
                    <li key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{p.title}</span>
                          <Badge variant={p.status === 'PUBLISHED' ? 'success' : 'secondary'}>{p.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">/{school.slug}/blog/{p.slug}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openBlog(p)}>Edit</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending} onClick={() => {
                          startTransition(async () => {
                            const r = await deleteBlogPost(p.id)
                            if (r.success) { toast.success('Deleted'); window.location.reload() }
                            else toast.error(r.error)
                          })
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!spotSheet} onOpenChange={(o) => !o && setSpotSheet(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{spotSheet === 'new' ? 'New spotlight' : 'Edit spotlight'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={spotTitle} onChange={(e) => setSpotTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea rows={8} value={spotBody} onChange={(e) => setSpotBody(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input value={spotImage} onChange={(e) => setSpotImage(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Video URL (optional)</Label>
              <Input value={spotVideo} onChange={(e) => setSpotVideo(e.target.value)} />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button onClick={saveSpotlight} disabled={isPending}>Save draft</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!blogSheet} onOpenChange={(o) => !o && setBlogSheet(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{blogSheet === 'new' ? 'New post' : 'Edit post'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={blogTitle}
                onChange={(e) => {
                  setBlogTitle(e.target.value)
                  if (blogSheet === 'new') setBlogSlug(slugify(e.target.value))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>URL slug</Label>
              <Input value={blogSlug} onChange={(e) => setBlogSlug(slugify(e.target.value))} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea rows={2} value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea rows={12} value={blogContent} onChange={(e) => setBlogContent(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cover image URL</Label>
              <Input value={blogCover} onChange={(e) => setBlogCover(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={blogStatus} onValueChange={(v) => setBlogStatus(v as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const r = await upsertBlogPost({
                    id: blogSheet !== 'new' && blogSheet ? blogSheet.id : undefined,
                    title: blogTitle,
                    slug: blogSlug,
                    excerpt: blogExcerpt || null,
                    content: blogContent,
                    coverImageUrl: blogCover || '',
                    tags: [],
                    status: blogStatus,
                  })
                  if (r.success) {
                    toast.success('Post saved')
                    setBlogSheet(null)
                    window.location.reload()
                  } else toast.error(r.error)
                })
              }}
            >
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!rejectOpen} onOpenChange={(o) => !o && setRejectOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject spotlight</AlertDialogTitle>
            <AlertDialogDescription>Explain what to change so the team can revise.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Feedback for staff..." rows={4} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={isPending || !rejectNote.trim()}
              variant="destructive"
              onClick={() => {
                if (!rejectOpen) return
                startTransition(async () => {
                  const r = await rejectSchoolSpotlight({ id: rejectOpen, note: rejectNote })
                  if (r.success) {
                    toast.success('Rejected')
                    setRejectOpen(null)
                    window.location.reload()
                  } else toast.error(r.error)
                })
              }}
            >
              Reject
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
