'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { createFeatureFlag, deleteFeatureFlag, updateFeatureFlag } from '@/actions/platform-admin'
import { DEFAULT_FEATURE_FLAG_DEFINITIONS, labelForFeatureFlagKey } from '@/lib/default-feature-flags'
import { PLAN_LABEL } from '@/lib/plan-pricing'
import type { Plan } from '@kinderos/db'
import { Search, Trash2 } from 'lucide-react'

export type FlagRow = {
  id: string
  key: string
  isEnabled: boolean
  planGating: Plan | null
  schoolIds: string[]
}

export type SchoolOption = { id: string; name: string; slug: string }

const PLANS: Plan[] = ['STARTER', 'GROWTH', 'ACADEMY']

export function FeatureFlagsClient({ flags, schools }: { flags: FlagRow[]; schools: SchoolOption[] }) {
  const [pending, startTransition] = useTransition()
  const [newKey, setNewKey] = useState('')
  const [search, setSearch] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<FlagRow | null>(null)

  const defs = DEFAULT_FEATURE_FLAG_DEFINITIONS

  function setFlagSearch(id: string, q: string) {
    setSearch((s) => ({ ...s, [id]: q }))
  }

  const filteredSchoolsByFlag = useMemo(() => {
    const out: Record<string, SchoolOption[]> = {}
    for (const f of flags) {
      const q = (search[f.id] ?? '').trim().toLowerCase()
      out[f.id] = !q
        ? schools
        : schools.filter((s) => `${s.name} ${s.slug}`.toLowerCase().includes(q))
    }
    return out
  }, [flags, schools, search])

  function toggleEnabled(flag: FlagRow, checked: boolean) {
    startTransition(async () => {
      const r = await updateFeatureFlag({ id: flag.id, isEnabled: checked })
      if (r.success) toast.success(checked ? 'Feature enabled' : 'Feature disabled')
      else toast.error(r.error)
    })
  }

  function saveAccessRules(flag: FlagRow, planValue: string, selectedIds: string[]) {
    startTransition(async () => {
      const planGating =
        planValue === '__all__' ? null : (planValue as Plan)
      const r = await updateFeatureFlag({
        id: flag.id,
        planGating,
        schoolIds: selectedIds,
      })
      if (r.success) toast.success('Access rules saved')
      else toast.error(r.error)
    })
  }

  function addFlag(e: React.FormEvent) {
    e.preventDefault()
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_')
    if (!key) return
    startTransition(async () => {
      const r = await createFeatureFlag({ key })
      if (r.success) {
        toast.success('Flag created')
        setNewKey('')
      } else toast.error(r.error)
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    startTransition(async () => {
      const r = await deleteFeatureFlag(id)
      if (r.success) {
        toast.success('Flag removed')
        setDeleteTarget(null)
      } else toast.error(r.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed bg-muted/30 p-4">
        <h3 className="text-sm font-medium">Add custom flag</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Use snake_case keys (e.g. <code className="rounded bg-muted px-1">custom_reports</code>). Defaults
          are created automatically above.
        </p>
        <form onSubmit={addFlag} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="new-flag-key">Key</Label>
            <Input
              id="new-flag-key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="e.g. beta_parent_app"
              disabled={pending}
            />
          </div>
          <Button type="submit" disabled={pending || !newKey.trim()}>
            Create flag
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {flags.map((flag) => {
          const { label, description } = labelForFeatureFlagKey(flag.key, defs)
          return (
            <FlagCard
              key={flag.id}
              flag={flag}
              label={label}
              description={description}
              filteredSchools={filteredSchoolsByFlag[flag.id] ?? schools}
              searchQuery={search[flag.id] ?? ''}
              onSearchChange={(q) => setFlagSearch(flag.id, q)}
              pending={pending}
              onToggle={(c) => toggleEnabled(flag, c)}
              onSaveAccess={(plan, ids) => saveAccessRules(flag, plan, ids)}
              onDelete={() => setDeleteTarget(flag)}
            />
          )
        })}
      </div>

      {flags.length === 0 && (
        <p className="text-sm text-muted-foreground">No flags yet. Defaults are created on page load.</p>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete flag &quot;{deleteTarget?.key}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Apps checking this key will treat it as disabled. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FlagCard({
  flag,
  label,
  description,
  filteredSchools,
  searchQuery,
  onSearchChange,
  pending,
  onToggle,
  onSaveAccess,
  onDelete,
}: {
  flag: FlagRow
  label: string
  description: string
  filteredSchools: SchoolOption[]
  searchQuery: string
  onSearchChange: (q: string) => void
  pending: boolean
  onToggle: (checked: boolean) => void
  onSaveAccess: (planValue: string, schoolIds: string[]) => void
  onDelete: () => void
}) {
  const [planValue, setPlanValue] = useState<string>(
    flag.planGating ?? '__all__'
  )
  const [selected, setSelected] = useState<Set<string>>(new Set(flag.schoolIds))

  useEffect(() => {
    setPlanValue(flag.planGating ?? '__all__')
    setSelected(new Set(flag.schoolIds))
  }, [flag.id, flag.planGating, flag.schoolIds])

  function toggleSchool(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const s of filteredSchools) next.add(s.id)
      return next
    })
  }

  function clearSchools() {
    setSelected(new Set())
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{label}</CardTitle>
          <CardDescription className="font-mono text-xs">{flag.key}</CardDescription>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">Enabled</span>
          <Switch checked={flag.isEnabled} onCheckedChange={onToggle} disabled={pending} />
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Minimum plan</Label>
            <Select value={planValue} onValueChange={setPlanValue} disabled={pending}>
              <SelectTrigger>
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All plans (no minimum)</SelectItem>
                {PLANS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLAN_LABEL[p]} and above
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Ignored when a school allowlist is set (pilot below).
            </p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Pilot allowlist (optional)</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            If one or more schools are selected, <strong>only</strong> those schools get this feature (when
            enabled). Leave empty to use the minimum plan rule for everyone.
          </p>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Filter schools…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
            {filteredSchools.length === 0 ? (
              <p className="text-xs text-muted-foreground">No schools match.</p>
            ) : (
              filteredSchools.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.has(s.id)}
                    onCheckedChange={() => toggleSchool(s.id)}
                    disabled={pending}
                  />
                  <span>
                    {s.name}{' '}
                    <span className="text-muted-foreground">({s.slug})</span>
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllFiltered}
              disabled={pending || filteredSchools.length === 0}
            >
              Select visible
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearSchools} disabled={pending}>
              Clear allowlist
            </Button>
          </div>
        </div>

        <Separator />

        <Button
          type="button"
          onClick={() => onSaveAccess(planValue, [...selected])}
          disabled={pending}
        >
          Save access rules
        </Button>
      </CardContent>
    </Card>
  )
}
