import React, { useEffect, useState } from 'react'

type RoleDto = {
  _id: string
  name: string
  department: string
}

type PermissionDto = {
  roleId: string
  roleName: string
  adGroups: string[]
  netappGroups: string[]
  systemGroups: string[]
  updatedAt?: string
}

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:5000/api'

/* -------------------- Modal עריכה: רשימה אחת של קבוצות AD -------------------- */
const EditPermModal: React.FC<{
  role: RoleDto
  value: PermissionDto
  onClose: () => void
  onSaved: () => void
}> = ({ role, value, onClose, onSaved }) => {
  const [groups, setGroups] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setGroups(value?.adGroups || [])
    setInput('')
    setErr(null)
  }, [value])

  const clean = (arr: string[]) =>
    (arr || [])
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)

  const addItem = () => {
    const v = input.trim()
    if (!v) return
    setGroups((prev) => clean([...prev, v]))
    setInput('')
  }

  const removeItem = (idx: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    setErr(null)
    setSaving(true)
    try {
      // משנים רק adGroups; את השדות האחרים שומרים כפי שהיו כדי לא לאפס בטעות
      const res = await fetch(`${API_BASE}/permissions/${role._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adGroups: clean(groups),
          netappGroups: value?.netappGroups || [],
          systemGroups: value?.systemGroups || [],
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || 'Failed to save permissions')
      onSaved()
      onClose()
    } catch (e: any) {
      setErr(e?.message || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const Pill: React.FC<{ text: string; onRemove: () => void }> = ({ text, onRemove }) => (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-2 py-1 text-xs">
      {text}
      <button
        type="button"
        className="ml-1 rounded px-1 hover:bg-gray-100"
        onClick={onRemove}
        title="Remove"
      >
        ×
      </button>
    </span>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit AD groups – {role.name}</h3>
          <button className="rounded p-1 text-gray-500 hover:bg-gray-100" onClick={onClose}>✕</button>
        </div>
        {err && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</div>}

        <div className="rounded-lg border p-3">
          <div className="mb-2 text-sm font-medium">Active Directory groups</div>
          <div className="mb-2 flex gap-2">
            <input
              className="w-full rounded border border-gray-300 p-2 text-sm"
              placeholder="Type a group and press Add"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem()
                }
              }}
            />
            <button
              type="button"
              onClick={addItem}
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.length === 0 ? (
              <div className="text-xs text-gray-500">No groups yet</div>
            ) : (
              groups.map((g, i) => <Pill key={g + i} text={g} onRemove={() => removeItem(i)} />)
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------- הדף הראשי -------------------- */
const PermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [selected, setSelected] = useState<RoleDto | null>(null)
  const [perm, setPerm] = useState<PermissionDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/roles`)
        const data: RoleDto[] = await res.json()
        setRoles(data)
        if (data.length) setSelected(data[0])
      } catch {
        setError('Failed to load roles')
      }
    })()
  }, [])

  useEffect(() => {
    if (!selected?._id) return
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/permissions?roleId=${selected._id}`)
        const data: PermissionDto = await res.json()
        setPerm({
          roleId: selected._id,
          roleName: selected.name,
          adGroups: data?.adGroups || [],
          netappGroups: data?.netappGroups || [],
          systemGroups: data?.systemGroups || [],
          updatedAt: (data as any)?.updatedAt,
        })
      } catch {
        setError('Failed to load permissions')
      } finally {
        setLoading(false)
      }
    })()
  }, [selected?._id])

  const choose = (id: string) => {
    const r = roles.find((x) => x._id === id) || null
    setSelected(r)
  }

  const fmtList = (arr: string[]) => (arr.length ? arr.join(', ') : '—')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* שמאל – בחירת רול */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold">Manage Permissions</h3>

        <div className="mb-3 text-sm text-gray-600">Choose Role</div>
        <select
          className="mb-4 w-full rounded border border-gray-300 p-2 text-sm"
          value={selected?._id || ''}
          onChange={(e) => choose(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>

        <div className="divide-y rounded border">
          {roles.map((r) => (
            <button
              key={r._id}
              className={`w-full text-left p-3 hover:bg-gray-50 ${selected?._id === r._id ? 'bg-blue-50' : ''}`}
              onClick={() => choose(r._id)}
            >
              {r.name}
              <div className="text-xs text-gray-500">{r.department}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ימין – תצוגת הרשאות (AD בלבד) */}
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Permissions</div>
            <h3 className="text-xl font-semibold">{selected?.name || ''}</h3>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              onClick={() => setShowEdit(true)}
              disabled={!selected}
            >
              Edit
            </button>
          </div>
        </div>

        {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <>
            <div className="text-sm">
              <div className="mb-1 font-medium">Active Directory:</div>
              <div>{fmtList(perm?.adGroups || [])}</div>
            </div>

            {perm?.updatedAt && (
              <div className="mt-4 text-xs text-gray-500">
                Last updated: {new Date(perm.updatedAt).toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>

      {showEdit && selected && perm && (
        <EditPermModal
          role={selected}
          value={perm}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            // רענון מהשרת אחרי שמירה
            fetch(`${API_BASE}/permissions?roleId=${selected._id}`)
              .then((r) => r.json())
              .then((d) =>
                setPerm({
                  roleId: selected._id,
                  roleName: selected.name,
                  adGroups: d?.adGroups || [],
                  netappGroups: d?.netappGroups || [],
                  systemGroups: d?.systemGroups || [],
                  updatedAt: d?.updatedAt,
                })
              )
          }}
        />
      )}
    </div>
  )
}

export default PermissionsPage
