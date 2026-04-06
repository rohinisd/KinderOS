'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, IndianRupee, CalendarCheck, UserPlus } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatCurrency } from '@kinderos/utils'

const COLORS = ['#3C3489', '#534AB7', '#6753bb', '#8d7ecc', '#b3a9dd', '#d9d4ee']
const FEE_COLORS: Record<string, string> = {
  PAID: '#22c55e',
  PENDING: '#f59e0b',
  OVERDUE: '#ef4444',
  PARTIAL: '#3b82f6',
  CANCELLED: '#6b7280',
  REFUNDED: '#8b5cf6',
}

type Props = {
  totalStudents: number
  classData: { name: string; count: number }[]
  feeData: { status: string; count: number; total: number; formatted: string }[]
  monthlyCollection: number
  monthlyPaymentCount: number
  attendanceData: { status: string; count: number }[]
  leadsData: { stage: string; count: number }[]
  genderData: { gender: string; count: number }[]
}

export function AnalyticsClient({
  totalStudents,
  classData,
  feeData,
  monthlyCollection,
  monthlyPaymentCount,
  attendanceData,
  leadsData,
  genderData,
}: Props) {
  const totalAttendance = attendanceData.reduce((sum, a) => sum + a.count, 0)
  const presentCount = attendanceData.find((a) => a.status === 'PRESENT')?.count ?? 0
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0
  const totalLeads = leadsData.reduce((sum, l) => sum + l.count, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="mt-1 text-2xl font-bold">{totalStudents}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Users className="h-5 w-5" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30-Day Collection</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(monthlyCollection)}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-2 text-green-600"><IndianRupee className="h-5 w-5" /></div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{monthlyPaymentCount} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30-Day Attendance</p>
                <p className="mt-1 text-2xl font-bold">{attendanceRate}%</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600"><CalendarCheck className="h-5 w-5" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admission Leads</p>
                <p className="mt-1 text-2xl font-bold">{totalLeads}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600"><UserPlus className="h-5 w-5" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Students by Class</CardTitle></CardHeader>
          <CardContent>
            {classData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3C3489" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No class data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Fee Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            {feeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={feeData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {feeData.map((entry) => (
                      <Cell key={entry.status} fill={FEE_COLORS[entry.status] ?? '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No fee data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Admission Pipeline</CardTitle></CardHeader>
          <CardContent>
            {leadsData.length > 0 ? (
              <div className="space-y-2">
                {leadsData.map((l) => {
                  const pct = totalLeads > 0 ? (l.count / totalLeads) * 100 : 0
                  return (
                    <div key={l.stage} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm">{l.stage.replace(/_/g, ' ')}</span>
                      <div className="flex-1">
                        <div className="h-6 w-full rounded bg-gray-100">
                          <div
                            className="flex h-6 items-center rounded bg-primary/80 px-2 text-xs font-medium text-white transition-all"
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          >
                            {l.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No leads yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Gender Distribution</CardTitle></CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="count"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {genderData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No student data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
