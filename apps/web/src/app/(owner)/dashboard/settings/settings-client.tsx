'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Save, School, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { updateSchoolSettings, createClass, deleteClass } from '@/actions/settings'

type SchoolData = {
  id: string
  name: string
  tagline: string | null
  description: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string
  pincode: string | null
  gstin: string | null
  currentAcademicYear: string
}

type ClassItem = {
  id: string
  name: string
  section: string | null
  capacity: number
  roomNumber: string | null
  studentCount: number
}

export function SettingsClient({
  school,
  classes,
}: {
  school: SchoolData
  classes: ClassItem[]
}) {
  const [isPending, startTransition] = useTransition()
  const [classSheetOpen, setClassSheetOpen] = useState(false)
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null)

  function handleSchoolSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateSchoolSettings({
        name: form.get('name') as string,
        tagline: (form.get('tagline') as string) || undefined,
        description: (form.get('description') as string) || undefined,
        phone: (form.get('phone') as string) || undefined,
        email: (form.get('email') as string) || undefined,
        address: (form.get('address') as string) || undefined,
        city: (form.get('city') as string) || undefined,
        state: (form.get('state') as string) || undefined,
        pincode: (form.get('pincode') as string) || undefined,
        gstin: (form.get('gstin') as string) || undefined,
      })
      if (result.success) toast.success('Settings saved')
      else toast.error(result.error)
    })
  }

  function handleCreateClass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createClass({
        name: form.get('name') as string,
        section: (form.get('section') as string) || undefined,
        capacity: parseInt(form.get('capacity') as string) || 30,
        roomNumber: (form.get('roomNumber') as string) || undefined,
      })
      if (result.success) {
        toast.success('Class created')
        setClassSheetOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDeleteClass() {
    if (!deleteClassId) return
    startTransition(async () => {
      const result = await deleteClass(deleteClassId)
      if (result.success) toast.success('Class deleted')
      else toast.error(result.error)
      setDeleteClassId(null)
    })
  }

  return (
    <Tabs defaultValue="school">
      <TabsList>
        <TabsTrigger value="school">School Profile</TabsTrigger>
        <TabsTrigger value="classes">Classes</TabsTrigger>
      </TabsList>

      <TabsContent value="school" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <School className="h-4 w-4" /> School Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSchoolSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">School Name *</Label>
                  <Input id="name" name="name" required defaultValue={school.name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" name="tagline" defaultValue={school.tagline ?? ''} placeholder="e.g. Nurturing young minds" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} defaultValue={school.description ?? ''} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={school.phone ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={school.email ?? ''} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" rows={2} defaultValue={school.address ?? ''} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={school.city ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" defaultValue={school.state} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" defaultValue={school.pincode ?? ''} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" name="gstin" defaultValue={school.gstin ?? ''} placeholder="e.g. 29XXXXX..." />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="classes" className="mt-4 space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setClassSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No classes yet</h3>
              <p className="text-sm text-muted-foreground">Create your first class to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{cls.name}</h3>
                      {cls.section && <p className="text-xs text-muted-foreground">Section {cls.section}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteClassId(cls.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Badge variant="secondary">{cls.studentCount} students</Badge>
                    <Badge variant="outline">Cap: {cls.capacity}</Badge>
                    {cls.roomNumber && <Badge variant="outline">Room {cls.roomNumber}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={classSheetOpen} onOpenChange={setClassSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Class</SheetTitle>
              <SheetDescription>Add a new class for the current academic year.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreateClass} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="className">Class Name *</Label>
                <Input id="className" name="name" required placeholder="e.g. LKG A" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="section">Section</Label>
                  <Input id="section" name="section" placeholder="e.g. A" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" name="capacity" type="number" defaultValue="30" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input id="roomNumber" name="roomNumber" placeholder="e.g. 101" />
              </div>
              <SheetFooter className="pt-4">
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? 'Creating...' : 'Create Class'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        <AlertDialog open={!!deleteClassId} onOpenChange={(open) => !open && setDeleteClassId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Class?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. The class must have no students assigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-destructive-foreground">
                {isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TabsContent>
    </Tabs>
  )
}
