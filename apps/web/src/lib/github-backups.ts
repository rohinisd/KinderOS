type GitHubArtifact = {
  id: number
  name: string
  size_in_bytes: number
  archive_download_url: string
  expired: boolean
  created_at: string
  expires_at: string
  workflow_run?: {
    id: number
    html_url?: string | null
    head_branch?: string | null
  } | null
}

export type BackupArtifact = {
  id: number
  name: string
  cadence: 'daily' | 'weekly' | 'monthly' | 'manual' | 'unknown'
  sizeBytes: number
  createdAt: string
  expiresAt: string
  expired: boolean
  runId: number | null
  runUrl: string | null
}

function parseCadence(name: string): BackupArtifact['cadence'] {
  if (name.includes('db-backup-daily-')) return 'daily'
  if (name.includes('db-backup-weekly-')) return 'weekly'
  if (name.includes('db-backup-monthly-')) return 'monthly'
  if (name.includes('db-backup-manual-')) return 'manual'
  return 'unknown'
}

function githubConfig() {
  const token = process.env.GITHUB_BACKUP_TOKEN
  const repo = process.env.GITHUB_BACKUP_REPO
  if (!token || !repo) return null
  const [owner, name] = repo.split('/')
  if (!owner || !name) return null
  return { token, owner, name }
}

async function githubFetch(path: string) {
  const cfg = githubConfig()
  if (!cfg) throw new Error('Backup integration not configured')
  const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.name}${path}`, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`)
  }
  return res
}

export function isBackupCenterConfigured() {
  return !!githubConfig()
}

export async function listBackupArtifacts(limit = 50): Promise<BackupArtifact[]> {
  const res = await githubFetch(`/actions/artifacts?per_page=${Math.min(Math.max(limit, 1), 100)}`)
  const data = (await res.json()) as { artifacts?: GitHubArtifact[] }
  const artifacts = data.artifacts ?? []
  return artifacts
    .filter((a) => a.name.startsWith('db-backup-'))
    .map((a) => ({
      id: a.id,
      name: a.name,
      cadence: parseCadence(a.name),
      sizeBytes: a.size_in_bytes,
      createdAt: a.created_at,
      expiresAt: a.expires_at,
      expired: a.expired,
      runId: a.workflow_run?.id ?? null,
      runUrl: a.workflow_run?.html_url ?? null,
    }))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

export async function getBackupArtifactDownloadUrl(artifactId: number): Promise<string> {
  const res = await githubFetch(`/actions/artifacts/${artifactId}`)
  const data = (await res.json()) as GitHubArtifact
  return data.archive_download_url
}
