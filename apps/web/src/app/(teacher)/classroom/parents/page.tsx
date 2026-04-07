import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

const relationLabels: Record<string, string> = {
  FATHER: 'Father',
  MOTHER: 'Mother',
  GUARDIAN: 'Guardian',
  OTHER: 'Other',
}

export default async function TeacherParentsPage() {
  const { schoolId, userId } = await requireTeacher()

  const teacherClass = await prisma.class.findFirst({
    where: { schoolId, classTeacherId: userId },
    include: {
      students: {
        where: { status: 'ACTIVE', deletedAt: null },
        orderBy: { firstName: 'asc' },
        include: {
          parents: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              relation: true,
            },
          },
        },
      },
    },
  })

  if (!teacherClass) {
    return (
      <div>
        <PageHeader
          title="Parents"
          description="Contact details for parents of students in your class"
        />
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No class assigned yet. Please contact your school administrator.
          </CardContent>
        </Card>
      </div>
    )
  }

  type Row = {
    parentId: string
    studentId: string
    parentName: string
    relation: string
    phone: string
    email: string
    studentName: string
  }

  const rows: Row[] = []
  for (const student of teacherClass.students) {
    const studentName = `${student.firstName} ${student.lastName}`
    if (student.parents.length === 0) {
      rows.push({
        parentId: `none-${student.id}`,
        studentId: student.id,
        parentName: '—',
        relation: '—',
        phone: '—',
        email: '—',
        studentName,
      })
    } else {
      for (const p of student.parents) {
        rows.push({
          parentId: p.id,
          studentId: student.id,
          parentName: `${p.firstName} ${p.lastName}`,
          relation: relationLabels[p.relation] ?? p.relation,
          phone: p.phone,
          email: p.email ?? '—',
          studentName,
        })
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Parents"
        description={`${teacherClass.name}${teacherClass.section ? ` ${teacherClass.section}` : ''} — guardian contact list`}
      />
      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent name</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Student</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.parentId}-${r.studentId}`}>
                  <TableCell className="font-medium">{r.parentName}</TableCell>
                  <TableCell>{r.relation}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.email}</TableCell>
                  <TableCell>{r.studentName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
