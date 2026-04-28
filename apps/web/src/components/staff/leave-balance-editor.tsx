'use client'

import { useState, useTransition } from 'react'
import { Settings2, Pencil, Plus, Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { upsertLeaveBalance, updateLeavePolicy } from '@/actions/staff-time'

type BalanceRow = {
  id: string
  staffId: string
  staffName: string
  designation: string | null
  clTotal: number
  clUsed: number
  slTotal: number
  slUsed: number
  elTotal: number
  elUsed: number
}

type MissingStaff = {
  id: string
  name: string
}

type LeaveDefaults = {
  clTotal: number
  slTotal: number
  elTotal: number
}

type EditForm = {
  staffId: string
  staffName: string
  clTotal: string
  slTotal: string
  elTotal: string
}

export function LeaveBalanceEditor({
  balances,
  missingStaff,
  year,
  defaults,
}: {
  balances: BalanceRow[]
  missingStaff: MissingStaff[]
  year: number
  defaults: LeaveDefaults
}) {
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [showPolicy, setShowPolicy] = useState(false)
  const [policyForm, setPolicyForm] = useState({
    clTotal: String(defaults.clTotal),
    slTotal: String(defaults.slTotal),
    elTotal: String(defaults.elTotal),
  })
  const [saving, startSaving] = useTransition()
  const [savingPolicy, startSavingPolicy] = useTransition()

  function openEdit(b: BalanceRow) {
    setEditForm({
      staffId: b.staffId,
      staffName: b.staffName,
      clTotal: String(b.clTotal),
      slTotal: String(b.slTotal),
      elTotal: String(b.elTotal),
    })
  }

  function openCreate(s: MissingStaff) {
    setEditForm({
      staffId: s.id,
      staffName: s.name,
      clTotal: policyForm.clTotal,
      slTotal: policyForm.slTotal,
      elTotal: policyForm.elTotal,
    })
  }

  function saveBalance() {
    if (!editForm) return
    startSaving(async () => {
      const result = await upsertLeaveBalance({
        staffId: editForm.staffId,
        year,
        clTotal: Number(editForm.clTotal) || 0,
        slTotal: Number(editForm.slTotal) || 0,
        elTotal: Number(editForm.elTotal) || 0,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`Leave balance updated for ${editForm.staffName}`)
      setEditForm(null)
    })
  }

  function savePolicy() {
    startSavingPolicy(async () => {
      const result = await updateLeavePolicy({
        clTotal: Number(policyForm.clTotal) || 0,
        slTotal: Number(policyForm.slTotal) || 0,
        elTotal: Number(policyForm.elTotal) || 0,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Leave policy saved')
      setShowPolicy(false)
    })
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-violet-800">Leave Policy (Owner Defaults)</h3>
            <p className="mt-0.5 text-[10px] text-violet-600">
              CL: {policyForm.clTotal} · SL: {policyForm.slTotal} · EL: {policyForm.elTotal} days/year
            </p>
          </div>
          <button
            onClick={() => setShowPolicy(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Configure
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Staff</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">CL left</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">SL left</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">EL left</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b) => (
              <tr key={b.id} className="border-b border-slate-100">
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900">{b.staffName}</div>
                  <div className="text-xs text-slate-500">{b.designation ?? ''}</div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <span className="font-medium text-slate-900">{(b.clTotal - b.clUsed).toFixed(1)}</span>
                  <span className="text-slate-400"> / {b.clTotal.toFixed(1)}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <span className="font-medium text-slate-900">{(b.slTotal - b.slUsed).toFixed(1)}</span>
                  <span className="text-slate-400"> / {b.slTotal.toFixed(1)}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <span className="font-medium text-slate-900">{(b.elTotal - b.elUsed).toFixed(1)}</span>
                  <span className="text-slate-400"> / {b.elTotal.toFixed(1)}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => openEdit(b)}
                    className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 hover:text-violet-600"
                    title="Edit totals"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {missingStaff.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-700">{s.name}</td>
                <td className="px-3 py-2 text-right text-slate-400" colSpan={3}>
                  No balance set yet
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => openCreate(s)}
                    className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700 hover:bg-violet-100"
                  >
                    <Plus className="h-3 w-3" />
                    Set Balance
                  </button>
                </td>
              </tr>
            ))}
            {balances.length === 0 && missingStaff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">
                  No active staff
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Leave Policy</h3>
              <button onClick={() => setShowPolicy(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Casual Leave (CL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={policyForm.clTotal}
                  onChange={(e) => setPolicyForm((p) => ({ ...p, clTotal: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Sick Leave (SL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={policyForm.slTotal}
                  onChange={(e) => setPolicyForm((p) => ({ ...p, slTotal: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Earned Leave (EL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={policyForm.elTotal}
                  onChange={(e) => setPolicyForm((p) => ({ ...p, elTotal: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                onClick={() => setShowPolicy(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={savePolicy}
                disabled={savingPolicy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {savingPolicy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Leave Balance — {editForm.staffName}</h3>
              <button onClick={() => setEditForm(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">CL Total</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.clTotal}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, clTotal: e.target.value } : f))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">SL Total</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.slTotal}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, slTotal: e.target.value } : f))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">EL Total</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.elTotal}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, elTotal: e.target.value } : f))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                onClick={() => setEditForm(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveBalance}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
