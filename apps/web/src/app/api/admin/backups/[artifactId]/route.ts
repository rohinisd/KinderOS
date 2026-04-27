import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'
import { getBackupArtifactDownloadUrl, isBackupCenterConfigured } from '@/lib/github-backups'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ artifactId: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isBackupCenterConfigured()) {
    return NextResponse.json(
      {
        error: 'Backup center is not configured. Set GITHUB_BACKUP_REPO and GITHUB_BACKUP_TOKEN.',
      },
      { status: 500 }
    )
  }

  const { artifactId } = await ctx.params
  const id = Number(artifactId)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid artifact id' }, { status: 400 })
  }

  try {
    const url = await getBackupArtifactDownloadUrl(id)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('[backup-download]', error)
    return NextResponse.json({ error: 'Could not fetch backup download URL' }, { status: 502 })
  }
}
