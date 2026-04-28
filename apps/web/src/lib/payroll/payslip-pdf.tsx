import React from 'react'
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'

type CustomComponent = { label: string; amountPaise: number }

export type PayslipPdfData = {
  schoolName: string
  month: number
  year: number
  staffName: string
  staffRole: string
  panNumber: string | null
  uanNumber: string | null
  esiNumber: string | null
  bankAccountHolder: string | null
  bankAccountNumber: string | null
  bankIfsc: string | null
  attendanceDays: number
  presentDays: number
  lateCount: number
  lwpDays: number
  earningBasic: number
  earningHra: number
  earningDa: number
  earningConveyance: number
  earningSpecial: number
  earningOvertime: number
  earningBonus: number
  earningIncentive: number
  customEarnings: CustomComponent[]
  deductionPfEmployee: number
  deductionEsiEmployee: number
  deductionProfessionalTax: number
  deductionTds: number
  deductionLwp: number
  deductionLate: number
  deductionAdvanceRecovery: number
  customDeductions: CustomComponent[]
  grossEarnings: number
  totalDeductions: number
  netPay: number
}

const styles = StyleSheet.create({
  page: { fontSize: 10, padding: 24, color: '#111827' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#374151', marginBottom: 12 },
  section: { marginBottom: 10, border: '1 solid #e5e7eb', borderRadius: 6, padding: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  key: { color: '#4b5563' },
  value: { fontWeight: 600 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1 solid #e5e7eb' },
  netBox: { backgroundColor: '#f3f4f6', border: '1 solid #d1d5db', borderRadius: 6, padding: 8 },
})

function formatCurrency(paise: number): string {
  const amount = paise / 100
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
}

function monthLabel(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function PayslipDocument({ data }: { data: PayslipPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Salary Payslip</Text>
        <Text style={styles.subtitle}>
          {data.schoolName} - {monthLabel(data.month, data.year)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Details</Text>
          <View style={styles.row}><Text style={styles.key}>Name</Text><Text style={styles.value}>{data.staffName}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Role</Text><Text>{data.staffRole}</Text></View>
          <View style={styles.row}><Text style={styles.key}>PAN</Text><Text>{data.panNumber ?? '-'}</Text></View>
          <View style={styles.row}><Text style={styles.key}>UAN</Text><Text>{data.uanNumber ?? '-'}</Text></View>
          <View style={styles.row}><Text style={styles.key}>ESI Number</Text><Text>{data.esiNumber ?? '-'}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Bank Holder</Text><Text>{data.bankAccountHolder ?? '-'}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Bank A/C</Text><Text>{data.bankAccountNumber ?? '-'}</Text></View>
          <View style={styles.row}><Text style={styles.key}>IFSC</Text><Text>{data.bankIfsc ?? '-'}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          <View style={styles.row}><Text style={styles.key}>Attendance marked</Text><Text>{data.attendanceDays}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Present days</Text><Text>{data.presentDays}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Late punches</Text><Text>{data.lateCount}</Text></View>
          <View style={styles.row}><Text style={styles.key}>LWP days</Text><Text>{data.lwpDays}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.row}><Text style={styles.key}>Basic</Text><Text>{formatCurrency(data.earningBasic)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>HRA</Text><Text>{formatCurrency(data.earningHra)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>DA</Text><Text>{formatCurrency(data.earningDa)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Conveyance</Text><Text>{formatCurrency(data.earningConveyance)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Special allowance</Text><Text>{formatCurrency(data.earningSpecial)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Overtime</Text><Text>{formatCurrency(data.earningOvertime)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Bonus</Text><Text>{formatCurrency(data.earningBonus)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Incentive</Text><Text>{formatCurrency(data.earningIncentive)}</Text></View>
          {data.customEarnings.map((c) => (
            <View key={`earning-${c.label}`} style={styles.row}>
              <Text style={styles.key}>{c.label}</Text>
              <Text>{formatCurrency(c.amountPaise)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.value}>Gross earnings</Text>
            <Text style={styles.value}>{formatCurrency(data.grossEarnings)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <View style={styles.row}><Text style={styles.key}>PF (employee)</Text><Text>{formatCurrency(data.deductionPfEmployee)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>ESI (employee)</Text><Text>{formatCurrency(data.deductionEsiEmployee)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Professional tax</Text><Text>{formatCurrency(data.deductionProfessionalTax)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>TDS</Text><Text>{formatCurrency(data.deductionTds)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>LWP deduction</Text><Text>{formatCurrency(data.deductionLwp)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Late deduction</Text><Text>{formatCurrency(data.deductionLate)}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Advance recovery</Text><Text>{formatCurrency(data.deductionAdvanceRecovery)}</Text></View>
          {data.customDeductions.map((c) => (
            <View key={`deduction-${c.label}`} style={styles.row}>
              <Text style={styles.key}>{c.label}</Text>
              <Text>{formatCurrency(c.amountPaise)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.value}>Total deductions</Text>
            <Text style={styles.value}>{formatCurrency(data.totalDeductions)}</Text>
          </View>
        </View>

        <View style={styles.netBox}>
          <View style={styles.row}>
            <Text style={styles.value}>Net pay</Text>
            <Text style={styles.value}>{formatCurrency(data.netPay)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

async function streamToUint8Array(stream: unknown): Promise<Uint8Array> {
  if (stream instanceof Uint8Array) return stream

  if (stream && typeof stream === 'object' && 'getReader' in stream) {
    const reader = (stream as ReadableStream<Uint8Array>).getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      chunks.push(value)
      total += value.length
    }
    const out = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      out.set(chunk, offset)
      offset += chunk.length
    }
    return out
  }

  if (stream && typeof stream === 'object' && Symbol.asyncIterator in stream) {
    const chunks: Uint8Array[] = []
    let total = 0
    for await (const part of stream as AsyncIterable<Uint8Array | Buffer | string>) {
      const chunk =
        typeof part === 'string'
          ? new TextEncoder().encode(part)
          : part instanceof Uint8Array
            ? part
            : new Uint8Array(part)
      chunks.push(chunk)
      total += chunk.length
    }
    const out = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      out.set(chunk, offset)
      offset += chunk.length
    }
    return out
  }

  throw new Error('Unable to read generated PDF stream')
}

export async function renderPayslipPdf(data: PayslipPdfData): Promise<Uint8Array> {
  const file = pdf(<PayslipDocument data={data} />)
  const stream = await file.toBuffer()
  return streamToUint8Array(stream)
}

