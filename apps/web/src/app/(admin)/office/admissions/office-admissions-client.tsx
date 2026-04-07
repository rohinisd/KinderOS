'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createAdmissionLead, updateLeadStage, addLeadNote } from '@/actions/admissions'
import { toIST } from '@kinderos/utils'

export type OfficeLeadRow = {
  id: string
  childName: string
  gradeApplying: string
  parentName: string
  phone: string
  email: string | null
  stage: string
  source: string | null
  createdAt: string
}

const STAGES: { value: string; label: string }[] = [
  { value: 'NEW_ENQUIRY', label: 'New enquiry' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'VISIT_SCHEDULED', label: 'Visit scheduled' },
  { value: 'INTERVIEW_DONE', label: 'Interview done' },
  { value: 'DOCS_PENDING', label: 'Docs pending' },
  { value: 'ADMITTED', label: 'Admitted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DROPPED', label: 'Dropped' },
]

export function OfficeAdmissionsClient({
  leads,
  stageCounts,
}: {
  leads: OfficeLeadRow[]
  stageCounts: Record<string, number>
}) {
  const [stageFilter, setStageFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [gradeApplying, setGradeApplying] = useState('Nursery')
  const [source, setSource] = useState<string>('__none__')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((l) => {
      const matchesStage = stageFilter === 'ALL' || l.stage === stageFilter
      const hay = `${l.childName} ${l.parentName} ${l.phone} ${l.email ?? ''}`.toLowerCase()
      const matchesSearch = !q || hay.includes(q)
      return matchesStage && matchesSearch
    })
  }, [leads, stageFilter, search])

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createAdmissionLead({
        childName: form.get('childName') as string,
        gradeApplying,
        parentName: form.get('parentName') as string,
        phone: form.get('phone') as string,
        email: (form.get('email') as string) || undefined,
        source: source === '__none__' ? undefined : source,
        notes: (form.get('notes') as string) || undefined,
      })
      if (result.success) {
        toast.success('Enquiry added')
        setSheetOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleStageChange(leadId: string, stage: string) {
    startTransition(async () => {
      const result = await updateLeadStage(leadId, stage)
      if (result.success) toast.success('Stage updated')
      else toast.error(result.error)
    })
  }

  function handleAddNote() {
    if (!noteLeadId || !noteText.trim()) return
    startTransition(async () => {
      const result = await addLeadNote(noteLeadId, noteText.trim())
      if (result.success) {
        toast.success('Note added')
        setNoteLeadId(null)
        setNoteText('')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <Card key={s.value} className="min-w-[120px] flex-1 border bg-white shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-semibold">{stageCounts[s.value] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search child, parent, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New enquiry
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Child</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No enquiries match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.childName}</TableCell>
                  <TableCell>{lead.gradeApplying}</TableCell>
                  <TableCell>
                    <div>{lead.parentName}</div>
                    {lead.source && (
                      <span className="text-xs text-muted-foreground">{lead.source}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{lead.phone}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.stage}
                      onValueChange={(v) => {
                        if (v !== lead.stage) handleStageChange(lead.id, v)
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {toIST(lead.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNoteLeadId(lead.id)
                        setNoteText('')
                      }}
                    >
                      Note
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New enquiry</SheetTitle>
            <SheetDescription>Add a prospective admission to the pipeline.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="childName">Child name *</Label>
              <Input id="childName" name="childName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gradeApplying">Grade applying *</Label>
              <Select value={gradeApplying} onValueChange={setGradeApplying}>
                <SelectTrigger id="gradeApplying">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Playgroup">Playgroup</SelectItem>
                  <SelectItem value="Nursery">Nursery</SelectItem>
                  <SelectItem value="LKG">LKG</SelectItem>
                  <SelectItem value="UKG">UKG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parentName">Parent name *</Label>
              <Input id="parentName" name="parentName" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" required placeholder="+91…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="How did they find us?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not specified</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Social Media">Social media</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving…' : 'Add enquiry'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={noteLeadId != null} onOpenChange={(open) => !open && setNoteLeadId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add note</SheetTitle>
            <SheetDescription>Visible on the lead timeline.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Call summary, next step, etc."
              rows={4}
            />
            <Button onClick={handleAddNote} disabled={isPending || !noteText.trim()} className="w-full">
              {isPending ? 'Saving…' : 'Save note'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
