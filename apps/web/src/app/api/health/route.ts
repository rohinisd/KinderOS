import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.school.count()
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      schools: count,
    })
  } catch (e) {
    return NextResponse.json(
      { status: 'error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
