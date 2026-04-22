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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createStudent, updateStudent, deleteStudent, updateParentEmail } from '@/actions/students'

type Student = {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
  gender: string
  status: string
  dateOfBirth: string | null
  bloodGroup: string | null
  allergies: string | null
  medicalNotes: string | null
  classId: string | null
  class: { id: string; name: string } | null
  parents: { id: string; firstName: string; lastName: string; phone: string; email: string | null; relation: string }[]
}

type ClassOption = { id: string; name: string }

const statusColors: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  INACTIVE: 'destructive',
  GRADUATED: 'info' as 'success',
  TRANSFERRED: 'warning',
}

export function StudentsClient({
  students,
  classes,
}: {
  students: Student[]
  classes: ClassOption[]
}) {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [parentEmailInputs, setParentEmailInputs] = useState<Record<string, string>>({})
  const [savingParentId, setSavingParentId] = useState<string | null>(null)

  const filtered = students.filter((s) => {
    const matchesSearch =
      `${s.firstName} ${s.lastName} ${s.admissionNumber}`
        .toLowerCase()
        .includes(search.toLowerCase())
    const matchesClass = classFilter === 'all' || s.classId === classFilter
    return matchesSearch && matchesClass
  })

  function openCreate() {
    setEditingStudent(null)
    setSheetOpen(true)
  }

  function openEdit(student: Student) {
    setEditingStudent(student)
    const initial: Record<string, string> = {}
    for (const p of student.parents) initial[p.id] = p.email ?? ''
    setParentEmailInputs(initial)
    setSheetOpen(true)
  }

  function handleSaveParentEmail(parentId: string) {
    setSavingParentId(parentId)
    startTransition(async () => {
      const result = await updateParentEmail(parentId, parentEmailInputs[parentId] ?? '')
      if (result.success) {
        toast.success('Parent Gmail updated — they can now log in with this email')
      } else {
        toast.error(result.error)
      }
      setSavingParentId(null)
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      if (editingStudent) {
        const result = await updateStudent(editingStudent.id, {
          firstName: form.get('firstName') as string,
          lastName: form.get('lastName') as string,
          classId: (form.get('classId') as string) || null,
          gender: form.get('gender') as 'MALE' | 'FEMALE' | 'OTHER',
          bloodGroup: (form.get('bloodGroup') as string) || undefined,
          allergies: (form.get('allergies') as string) || undefined,
          medicalNotes: (form.get('medicalNotes') as string) || undefined,
        })
        if (result.success) {
          toast.success('Student updated')
          setSheetOpen(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createStudent({
          firstName: form.get('firstName') as string,
          lastName: form.get('lastName') as string,
          classId: (form.get('classId') as string) || undefined,
          gender: (form.get('gender') as 'MALE' | 'FEMALE' | 'OTHER') || 'OTHER',
          bloodGroup: (form.get('bloodGroup') as string) || undefined,
          allergies: (form.get('allergies') as string) || undefined,
          medicalNotes: (form.get('medicalNotes') as string) || undefined,
          parentName: form.get('parentName') as string,
          parentPhone: form.get('parentPhone') as string,
          parentRelation: (form.get('parentRelation') as 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER') || 'FATHER',
          parentEmail: (form.get('parentEmail') as string) || undefined,
        })
        if (result.success) {
          toast.success('Student enrolled')
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
      const result = await deleteStudent(deleteId)
      if (result.success) {
        toast.success('Student removed')
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
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Admission #</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {search || classFilter !== 'all' ? 'No students match your filters.' : 'No students enrolled yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{student.gender.toLowerCase()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                  <TableCell>{student.class?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell>
                    {student.parents[0] ? (
                      <div>
                        <p className="text-sm">{student.parents[0].firstName} {student.parents[0].lastName}</p>
                        <p className="text-xs text-muted-foreground">{student.parents[0].phone}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[student.status] ?? 'secondary'}>
                      {student.status}
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
                        <DropdownMenuItem onClick={() => openEdit(student)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(student.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            <SheetTitle>{editingStudent ? 'Edit Student' : 'Enroll New Student'}</SheetTitle>
            <SheetDescription>
              {editingStudent ? 'Update student details.' : 'Fill in the student and parent details.'}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" required defaultValue={editingStudent?.firstName ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" name="lastName" required defaultValue={editingStudent?.lastName ?? ''} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="classId">Class</Label>
              <Select name="classId" defaultValue={editingStudent?.classId ?? ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender</Label>
                <Select name="gender" defaultValue={editingStudent?.gender ?? 'OTHER'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input id="bloodGroup" name="bloodGroup" placeholder="e.g. O+" defaultValue={editingStudent?.bloodGroup ?? ''} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allergies">Allergies</Label>
              <Input id="allergies" name="allergies" placeholder="Known allergies" defaultValue={editingStudent?.allergies ?? ''} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="medicalNotes">Medical Notes</Label>
              <Textarea id="medicalNotes" name="medicalNotes" rows={2} defaultValue={editingStudent?.medicalNotes ?? ''} />
            </div>

            {editingStudent && editingStudent.parents.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">Parent Portal Access</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set the Gmail address each parent uses to log in. Only this email can access the parent portal.
                  </p>
                </div>
                {editingStudent.parents.map((parent) => (
                  <div key={parent.id} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{parent.firstName} {parent.lastName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{parent.relation.toLowerCase()} · {parent.phone}</p>
                      </div>
                      {parent.email && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="parent@gmail.com"
                          value={parentEmailInputs[parent.id] ?? ''}
                          onChange={(e) => setParentEmailInputs((prev) => ({ ...prev, [parent.id]: e.target.value }))}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 shrink-0"
                        disabled={savingParentId === parent.id || isPending}
                        onClick={() => handleSaveParentEmail(parent.id)}
                      >
                        {savingParentId === parent.id ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!editingStudent && (
              <>
                <div className="border-t pt-4">
                  <h4 className="mb-3 text-sm font-semibold">Parent / Guardian Details</h4>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parentName">Parent Name *</Label>
                  <Input id="parentName" name="parentName" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="parentPhone">Phone *</Label>
                    <Input id="parentPhone" name="parentPhone" required placeholder="+91..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="parentRelation">Relation</Label>
                    <Select name="parentRelation" defaultValue="FATHER">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FATHER">Father</SelectItem>
                        <SelectItem value="MOTHER">Mother</SelectItem>
                        <SelectItem value="GUARDIAN">Guardian</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parentEmail">Email</Label>
                  <Input id="parentEmail" name="parentEmail" type="email" />
                </div>
              </>
            )}

            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving...' : editingStudent ? 'Update Student' : 'Enroll Student'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the student as inactive. Their records will be preserved.
            </AlertDialogDescription>
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
