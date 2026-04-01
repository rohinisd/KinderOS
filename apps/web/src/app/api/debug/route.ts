import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const startTime = Date.now()
    const authState = await auth()
    const elapsed = Date.now() - startTime

    return NextResponse.json({
      status: 'ok',
      elapsed_ms: elapsed,
      userId: authState.userId,
      orgId: authState.orgId,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      status: 'error',
      error: message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
