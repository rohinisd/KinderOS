'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Search, Building2, Users, GraduationCap, Power } from 'lucide-react'
import { toast } from 'sonner'
import { createSchool, toggleSchoolActive } from '@/actions/schools'
import { toIST } from '@kinderos/utils'

type SchoolRow = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string
  plan: string
  isActive: boolean
  createdAt: string
  studentCount: number
  staffCount: number
  owner: { firstName: string; lastName: string; email: string | null; phone: string } | null
}

export function TenantsClient({ schools }: { schools: SchoolRow[] }) {
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<SchoolRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = schools.filter((s) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return `${s.name} ${s.slug} ${s.owner?.email ?? ''} ${s.city ?? ''}`.toLowerCase().includes(q)
  })

  const totalStudents = schools.reduce((sum, s) => sum + s.studentCount, 0)
  const activeSchools = schools.filter((s) => s.isActive).length

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createSchool({
        name: form.get('name') as string,
        slug: form.get('slug') as string,
        ownerFirstName: form.get('ownerFirstName') as string,
        ownerLastName: form.get('ownerLastName') as string,
        ownerEmail: form.get('ownerEmail') as string,
        ownerPhone: form.get('ownerPhone') as string,
        city: (form.get('city') as string) || undefined,
        state: (form.get('state') as string) || undefined,
      })
      if (result.success) {
        toast.success('School created! Owner can now sign in.')
        setSheetOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleToggle() {
    if (!toggleTarget) return
    startTransition(async () => {
      const result = await toggleSchoolActive(toggleTarget.id, !toggleTarget.isActive)
      if (result.success) {
        toast.success(`School ${toggleTarget.isActive ? 'deactivated' : 'activated'}`)
      } else {
        toast.error(result.error)
      }
      setToggleTarget(null)
    })
  }

  function slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Schools</p>
                <p className="text-2xl font-bold">{schools.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Power className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeSchools}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add School
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {schools.length === 0 ? 'No schools yet. Create one to get started.' : 'No schools match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-sm font-bold text-purple-600">
                        {school.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-xs text-muted-foreground">/{school.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {school.owner ? (
                      <div>
                        <p className="text-sm">{school.owner.firstName} {school.owner.lastName}</p>
                        <p className="text-xs text-muted-foreground">{school.owner.email}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No owner</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{school.studentCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{school.staffCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{school.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={school.isActive ? 'success' : 'destructive'}>
                      {school.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {toIST(school.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setToggleTarget(school)}
                    >
                      {school.isActive ? 'Deactivate' : 'Activate'}
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
            <SheetTitle>Add New School</SheetTitle>
            <SheetDescription>
              Create a school and assign its owner. The owner can sign in immediately after creation.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Little Stars School"
                onChange={(e) => {
                  const slugInput = document.getElementById('slug') as HTMLInputElement | null
                  if (slugInput && !slugInput.dataset.manual) {
                    slugInput.value = slugify(e.target.value)
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                name="slug"
                required
                placeholder="little-stars"
                pattern="[a-z0-9-]+"
                onInput={(e) => {
                  (e.target as HTMLInputElement).dataset.manual = 'true'
                }}
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="e.g. Bangalore" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" placeholder="Karnataka" defaultValue="Karnataka" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-semibold">School Owner (1 per school)</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ownerFirstName">First Name *</Label>
                <Input id="ownerFirstName" name="ownerFirstName" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ownerLastName">Last Name *</Label>
                <Input id="ownerLastName" name="ownerLastName" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownerEmail">Owner Email (Gmail) *</Label>
              <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="owner@gmail.com" />
              <p className="text-xs text-muted-foreground">The owner signs in with this email via Clerk</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownerPhone">Owner Phone *</Label>
              <Input id="ownerPhone" name="ownerPhone" required placeholder="+91..." />
            </div>

            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Creating...' : 'Create School'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive ? 'Deactivate' : 'Activate'} {toggleTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isActive
                ? 'Deactivating will prevent all users of this school from accessing the platform.'
                : 'Activating will restore access for all users of this school.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>
              {isPending ? 'Updating...' : toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
