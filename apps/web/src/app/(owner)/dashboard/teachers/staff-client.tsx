'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createStaff, updateStaff, deleteStaff } from '@/actions/staff'

type StaffMember = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  role: string
  designation: string | null
  department: string | null
  status: string
  gender: string
  classesAsTeacher: { id: string; name: string }[]
}

const ROLES = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'CLASS_TEACHER', label: 'Class Teacher' },
  { value: 'SUBJECT_TEACHER', label: 'Subject Teacher' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'SUPPORT_STAFF', label: 'Support Staff' },
  { value: 'DRIVER', label: 'Driver' },
]

const roleColors: Record<string, 'default' | 'secondary' | 'info' | 'warning' | 'success'> = {
  OWNER: 'default',
  PRINCIPAL: 'default',
  CLASS_TEACHER: 'info' as 'default',
  SUBJECT_TEACHER: 'info' as 'default',
  ADMIN: 'secondary',
  ACCOUNTANT: 'secondary',
  SUPPORT_STAFF: 'warning' as 'secondary',
  DRIVER: 'warning' as 'secondary',
}

export function StaffClient({ staff }: { staff: StaffMember[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = staff.filter((s) => {
    const matchesSearch = `${s.firstName} ${s.lastName} ${s.email ?? ''} ${s.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      if (editing) {
        const result = await updateStaff(editing.id, {
          firstName: form.get('firstName') as string,
          lastName: form.get('lastName') as string,
          phone: form.get('phone') as string,
          email: (form.get('email') as string) || undefined,
          role: form.get('role') as 'OWNER' | 'PRINCIPAL' | 'CLASS_TEACHER' | 'SUBJECT_TEACHER' | 'ADMIN' | 'ACCOUNTANT' | 'SUPPORT_STAFF' | 'DRIVER',
          designation: (form.get('designation') as string) || undefined,
          department: (form.get('department') as string) || undefined,
          gender: form.get('gender') as 'MALE' | 'FEMALE' | 'OTHER',
        })
        if (result.success) {
          toast.success('Staff updated')
          setSheetOpen(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createStaff({
          firstName: form.get('firstName') as string,
          lastName: form.get('lastName') as string,
          phone: form.get('phone') as string,
          email: (form.get('email') as string) || undefined,
          role: form.get('role') as 'OWNER' | 'PRINCIPAL' | 'CLASS_TEACHER' | 'SUBJECT_TEACHER' | 'ADMIN' | 'ACCOUNTANT' | 'SUPPORT_STAFF' | 'DRIVER',
          designation: (form.get('designation') as string) || undefined,
          department: (form.get('department') as string) || undefined,
          gender: (form.get('gender') as 'MALE' | 'FEMALE' | 'OTHER') || 'OTHER',
        })
        if (result.success) {
          toast.success('Staff member added')
          setSheetOpen(false)
        } else {
          toast.error(result.error)
        }
      }
    })
  }

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteStaff(deleteId)
      if (result.success) {
        toast.success('Staff member removed')
      } else {
        toast.error(result.error)
      }
      setDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditing(null); setSheetOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-semibold text-purple-600">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{s.firstName} {s.lastName}</p>
                        {s.designation && <p className="text-xs text-muted-foreground">{s.designation}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleColors[s.role] ?? 'secondary'}>
                      {ROLES.find((r) => r.value === s.role)?.label ?? s.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{s.phone}</p>
                    {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                  </TableCell>
                  <TableCell>
                    {s.classesAsTeacher.length > 0
                      ? s.classesAsTeacher.map((c) => c.name).join(', ')
                      : <span className="text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(s); setSheetOpen(true) }}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(s.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <SheetTitle>{editing ? 'Edit Staff' : 'Add Staff Member'}</SheetTitle>
            <SheetDescription>{editing ? 'Update staff details.' : 'Add a new team member.'}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" required defaultValue={editing?.firstName ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" name="lastName" required defaultValue={editing?.lastName ?? ''} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role *</Label>
              <Select name="role" defaultValue={editing?.role ?? 'CLASS_TEACHER'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" required placeholder="+91..." defaultValue={editing?.phone ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editing?.email ?? ''} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" name="designation" placeholder="e.g. Senior Teacher" defaultValue={editing?.designation ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" defaultValue={editing?.department ?? ''} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender" defaultValue={editing?.gender ?? 'OTHER'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving...' : editing ? 'Update Staff' : 'Add Staff'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>This will mark them as inactive.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
