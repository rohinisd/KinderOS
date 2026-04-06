'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, UserPlus, Phone, Mail, MoreHorizontal, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { createAdmissionLead, updateLeadStage, addLeadNote } from '@/actions/admissions'

type Lead = {
  id: string
  childName: string
  gradeApplying: string
  parentName: string
  phone: string
  email: string | null
  stage: string
  source: string | null
  notes: string | null
  createdAt: string
  activities: { id: string; type: string; note: string; createdAt: string }[]
}

const STAGES = [
  { value: 'NEW_ENQUIRY', label: 'New Enquiry', color: 'bg-blue-50 border-blue-200' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-indigo-50 border-indigo-200' },
  { value: 'VISIT_SCHEDULED', label: 'Visit Scheduled', color: 'bg-purple-50 border-purple-200' },
  { value: 'INTERVIEW_DONE', label: 'Interview Done', color: 'bg-pink-50 border-pink-200' },
  { value: 'DOCS_PENDING', label: 'Docs Pending', color: 'bg-orange-50 border-orange-200' },
  { value: 'ADMITTED', label: 'Admitted', color: 'bg-green-50 border-green-200' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-50 border-red-200' },
  { value: 'DROPPED', label: 'Dropped', color: 'bg-gray-50 border-gray-200' },
]

export function AdmissionsClient({ leads }: { leads: Lead[] }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeStages = STAGES.filter((s) =>
    !['REJECTED', 'DROPPED'].includes(s.value)
  )

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createAdmissionLead({
        childName: form.get('childName') as string,
        gradeApplying: form.get('gradeApplying') as string,
        parentName: form.get('parentName') as string,
        phone: form.get('phone') as string,
        email: (form.get('email') as string) || undefined,
        source: (form.get('source') as string) || undefined,
        notes: (form.get('notes') as string) || undefined,
      })
      if (result.success) {
        toast.success('Lead added')
        setSheetOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleMoveStage(leadId: string, stage: string) {
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Enquiry
        </Button>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserPlus className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No admission enquiries yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first enquiry to start tracking the admission pipeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {activeStages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.value)
            return (
              <div key={stage.value} className={`rounded-lg border-2 p-3 ${stage.color}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge variant="secondary">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{lead.childName}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead.gradeApplying} &middot; {lead.parentName}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {STAGES.filter((s) => s.value !== lead.stage).map((s) => (
                                <DropdownMenuItem
                                  key={s.value}
                                  onClick={() => handleMoveStage(lead.id, s.value)}
                                >
                                  <ArrowRight className="mr-2 h-3 w-3" /> Move to {s.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem onClick={() => { setNoteLeadId(lead.id); setNoteText('') }}>
                                Add Note
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </span>
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {lead.email}
                            </span>
                          )}
                        </div>
                        {lead.source && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {lead.source}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">No leads</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Admission Enquiry</SheetTitle>
            <SheetDescription>Add a prospective student to the pipeline.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="childName">Child Name *</Label>
              <Input id="childName" name="childName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gradeApplying">Grade Applying For *</Label>
              <Select name="gradeApplying" defaultValue="Nursery">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Playgroup">Playgroup</SelectItem>
                  <SelectItem value="Nursery">Nursery</SelectItem>
                  <SelectItem value="LKG">LKG</SelectItem>
                  <SelectItem value="UKG">UKG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parentName">Parent Name *</Label>
              <Input id="parentName" name="parentName" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" required placeholder="+91..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Select name="source">
                <SelectTrigger><SelectValue placeholder="How did they find us?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Adding...' : 'Add Enquiry'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {noteLeadId && (
        <Sheet open={!!noteLeadId} onOpenChange={(open) => !open && setNoteLeadId(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Note</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type your note..."
                rows={4}
              />
              <Button onClick={handleAddNote} disabled={isPending || !noteText.trim()} className="w-full">
                {isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
