'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Megaphone, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { createAnnouncement } from '@/actions/announcements'

type Announcement = {
  id: string
  title: string
  body: string
  targetAudience: string
  channels: string[]
  status: string
  publishedAt: string | null
  createdAt: string
}

const CHANNELS = [
  { id: 'PUSH', label: 'Push Notification' },
  { id: 'WHATSAPP', label: 'WhatsApp' },
  { id: 'SMS', label: 'SMS' },
  { id: 'EMAIL', label: 'Email' },
  { id: 'IN_APP', label: 'In-App' },
]

export function AnnouncementsClient({
  announcements,
}: {
  announcements: Announcement[]
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['IN_APP'])
  const [isPending, startTransition] = useTransition()

  function toggleChannel(channel: string) {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    )
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createAnnouncement({
        title: form.get('title') as string,
        body: form.get('body') as string,
        targetAudience: (form.get('targetAudience') as 'ALL' | 'PARENTS' | 'TEACHERS') || 'ALL',
        channels: selectedChannels as ('PUSH' | 'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP')[],
      })
      if (result.success) {
        toast.success('Announcement published')
        setSheetOpen(false)
        setSelectedChannels(['IN_APP'])
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Megaphone className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No announcements yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first announcement to notify parents and staff.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{a.title}</h3>
                      <Badge variant={a.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                        {a.status}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {a.publishedAt
                          ? new Date(a.publishedAt).toLocaleDateString('en-IN')
                          : 'Draft'}
                      </span>
                      <span>To: {a.targetAudience}</span>
                      <span>Via: {a.channels.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Announcement</SheetTitle>
            <SheetDescription>
              Create and publish an announcement to parents and staff.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required placeholder="e.g. Annual Day Celebration" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body">Message *</Label>
              <Textarea id="body" name="body" required rows={4} placeholder="Write your announcement here..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Select name="targetAudience" defaultValue="ALL">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Everyone</SelectItem>
                  <SelectItem value="PARENTS">Parents Only</SelectItem>
                  <SelectItem value="TEACHERS">Teachers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notification Channels</Label>
              <div className="space-y-2">
                {CHANNELS.map((ch) => (
                  <label key={ch.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedChannels.includes(ch.id)}
                      onCheckedChange={() => toggleChannel(ch.id)}
                    />
                    <span className="text-sm">{ch.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isPending || selectedChannels.length === 0} className="w-full">
                {isPending ? 'Publishing...' : 'Publish Announcement'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
