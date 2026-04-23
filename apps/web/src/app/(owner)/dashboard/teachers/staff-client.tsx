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

const ALL_ROLES = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'VICE_PRINCIPAL', label: 'Vice Principal' },
  { value: 'CLASS_TEACHER', label: 'Class Teacher' },
  { value: 'SUBJECT_TEACHER', label: 'Subject Teacher' },
  { value: 'COORDINATOR', label: 'Academic Coordinator' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'COUNSELOR', label: 'Counselor' },
  { value: 'LIBRARIAN', label: 'Librarian' },
  { value: 'NURSE', label: 'Nurse / Medical' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'SUPPORT_STAFF', label: 'Support Staff' },
  { value: 'SECURITY_GUARD', label: 'Security Guard' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'TRANSPORT_MANAGER', label: 'Transport Manager' },
]

const CUSTOM_ROLE_VALUE = 'CUSTOM_ROLE'

/** Owner is provisioned by platform admin only — never assign via this form. */
const ASSIGNABLE_ROLES = ALL_ROLES.filter((r) => r.value !== 'OWNER')

type StaffAssignableRole =
  | 'PRINCIPAL'
  | 'VICE_PRINCIPAL'
  | 'CLASS_TEACHER'
  | 'SUBJECT_TEACHER'
  | 'COORDINATOR'
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'COUNSELOR'
  | 'LIBRARIAN'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'SUPPORT_STAFF'
  | 'SECURITY_GUARD'
  | 'DRIVER'
  | 'TRANSPORT_MANAGER'

const roleColors: Record<string, 'default' | 'secondary' | 'info' | 'warning' | 'success'> = {
  OWNER: 'default',
  PRINCIPAL: 'default',
  VICE_PRINCIPAL: 'default',
  CLASS_TEACHER: 'info' as 'default',
  SUBJECT_TEACHER: 'info' as 'default',
  COORDINATOR: 'default',
  ADMIN: 'secondary',
  ACCOUNTANT: 'secondary',
  COUNSELOR: 'secondary',
  LIBRARIAN: 'secondary',
  NURSE: 'secondary',
  RECEPTIONIST: 'secondary',
  SUPPORT_STAFF: 'warning' as 'secondary',
  SECURITY_GUARD: 'warning' as 'secondary',
  DRIVER: 'warning' as 'secondary',
  TRANSPORT_MANAGER: 'warning' as 'secondary',
}

export function StaffClient({ staff }: { staff: StaffMember[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [selectedRole, setSelectedRole] = useState<StaffAssignableRole | typeof CUSTOM_ROLE_VALUE>('CLASS_TEACHER')
  const [customRoleTitle, setCustomRoleTitle] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setSelectedRole('CLASS_TEACHER')
    setCustomRoleTitle('')
    setSheetOpen(true)
  }

  function openEdit(staffMember: StaffMember) {
    setEditing(staffMember)
    if (staffMember.role === 'SUPPORT_STAFF' && staffMember.designation) {
      setSelectedRole(CUSTOM_ROLE_VALUE)
      setCustomRoleTitle(staffMember.designation)
    } else {
      setSelectedRole(staffMember.role as StaffAssignableRole)
      setCustomRoleTitle('')
    }
    setSheetOpen(true)
  }

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
      const rawRole = form.get('role') as string
      const customRole = (form.get('customRoleTitle') as string | null)?.trim() ?? ''
      const role: StaffAssignableRole =
        rawRole === CUSTOM_ROLE_VALUE ? 'SUPPORT_STAFF' : (rawRole as StaffAssignableRole)
      const designationFromForm = (form.get('designation') as string) || undefined
      const designation = rawRole === CUSTOM_ROLE_VALUE ? (customRole || undefined) : designationFromForm

      if (rawRole === CUSTOM_ROLE_VALUE && !customRole) {
        toast.error('Please enter a custom role title')
        return
      }

      if (editing) {
        const base = {
          firstName: form.get('firstName') as string,
          lastName: form.get('lastName') as string,
          phone: form.get('phone') as string,
          email: (form.get('email') as string) || undefined,
          designation,
          department: (form.get('department') as string) || undefined,
          gender: form.get('gender') as 'MALE' | 'FEMALE' | 'OTHER',
        }
        const payload =
          editing.role === 'OWNER'
            ? base
            : {
                ...base,
                role,
              }
        const result = await updateStaff(editing.id, payload)
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
          role,
          designation,
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

  function roleLabelFor(member: StaffMember): string {
    if (member.role === 'SUPPORT_STAFF' && member.designation && member.designation.trim().length > 0) {
      return member.designation
    }
    return ALL_ROLES.find((r) => r.value === member.role)?.label ?? member.role
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
              {ALL_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
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
                      {roleLabelFor(s)}
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
                        <DropdownMenuItem onClick={() => openEdit(s)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {s.role !== 'OWNER' && (
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(s.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                          </DropdownMenuItem>
                        )}
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
              {editing?.role === 'OWNER' ? (
                <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  School owner (assigned when the school was created on the platform). Role cannot be changed here.
                </p>
              ) : (
                <Select name="role" value={selectedRole} onValueChange={(v) => setSelectedRole(v as StaffAssignableRole | typeof CUSTOM_ROLE_VALUE)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_ROLE_VALUE}>Other (Custom Role)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {editing?.role !== 'OWNER' && selectedRole === CUSTOM_ROLE_VALUE && (
              <div className="space-y-1.5">
                <Label htmlFor="customRoleTitle">Custom Role Title *</Label>
                <Input
                  id="customRoleTitle"
                  name="customRoleTitle"
                  required
                  placeholder="e.g. Activity Coordinator, Speech Therapist"
                  value={customRoleTitle}
                  onChange={(e) => setCustomRoleTitle(e.target.value)}
                />
              </div>
            )}

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
