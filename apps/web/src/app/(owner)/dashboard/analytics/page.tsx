import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { AnalyticsClient } from './analytics-client'
import { formatCurrency } from '@kinderos/utils'

export default async function AnalyticsPage() {
  const { schoolId } = await requireSchoolAuth()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalStudents,
    studentsByClass,
    feesByStatus,
    monthlyPayments,
    attendanceLast30,
    leadsByStage,
    studentsByGender,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
    prisma.class.findMany({
      where: { schoolId },
      select: {
        name: true,
        _count: { select: { students: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.feeInvoice.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { schoolId, status: 'SUCCESS', paidAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.studentAttendance.groupBy({
      by: ['status'],
      where: { schoolId, date: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.admissionLead.groupBy({
      by: ['stage'],
      where: { schoolId },
      _count: true,
    }),
    prisma.student.groupBy({
      by: ['gender'],
      where: { schoolId, status: 'ACTIVE' },
      _count: true,
    }),
  ])

  const classData = studentsByClass.map((c) => ({
    name: c.name,
    count: c._count.students,
  }))

  const feeData = feesByStatus.map((f) => ({
    status: f.status,
    count: f._count,
    total: f._sum.totalAmount ?? 0,
    formatted: formatCurrency(f._sum.totalAmount ?? 0),
  }))

  const attendanceData = attendanceLast30.map((a) => ({
    status: a.status,
    count: a._count,
  }))

  const leadsData = leadsByStage.map((l) => ({
    stage: l.stage,
    count: l._count,
  }))

  const genderData = studentsByGender.map((g) => ({
    gender: g.gender,
    count: g._count,
  }))

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Insights and metrics for your school"
      />
      <div className="mt-6">
        <AnalyticsClient
          totalStudents={totalStudents}
          classData={classData}
          feeData={feeData}
          monthlyCollection={monthlyPayments._sum.amount ?? 0}
          monthlyPaymentCount={monthlyPayments._count}
          attendanceData={attendanceData}
          leadsData={leadsData}
          genderData={genderData}
        />
      </div>
    </div>
  )
}
