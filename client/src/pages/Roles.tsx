import React, { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

type RoleDto = {
  _id: string
  name: string
  usersCount: number
  department: string
  createdAt: string
  updatedAt: string
}

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:5000/api'

// ------- Modal פנימי באותו קובץ --------
type NewRoleModalProps = {
  onClose: () => void
  onCreated: () => void
}

const NewRoleModal: React.FC<NewRoleModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    if (!name.trim() || !department.trim()) {
      setErr('Name and Department are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          department: department.trim(),
          // ⛔ לא שולחים usersCount – נספר אוטומטית דרך יצירת עובדים
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to create role')
      onCreated()
      onClose()
    } catch (e: any) {
      setErr(e?.message || 'Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create Role</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {err && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</div>}

        <label className="mb-2 block text-sm font-medium">Role name</label>
        <input
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="e.g. QA Engineer"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="mb-2 block text-sm font-medium">Department</label>
        <input
          className="mb-5 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="e.g. QA"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-60">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ------------- המסך הראשי -------------
const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  async function loadRoles(q = '') {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${API_BASE}/roles`)
      if (q.trim()) url.searchParams.set('search', q.trim())
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch roles')
      const data: RoleDto[] = await res.json()
      setRoles(data)
    } catch (e: any) {
      setError(e?.message || 'Error loading roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadRoles() }, [])

  useEffect(() => {
    const t = setTimeout(() => void loadRoles(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const filtered = useMemo(() => {
    const key = search.toLowerCase()
    return key
      ? roles.filter((r) => r.name.toLowerCase().includes(key) || r.department.toLowerCase().includes(key))
      : roles
  }, [roles, search])

  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return iso
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Roles</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm flex items-center gap-2"
          onClick={() => setShowNewModal(true)}
        >
          <span>New Role</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search here"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-full w-full max-w-xs text-sm"
        />
        <button
          className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600"
          onClick={() => void loadRoles(search)}
          title="Search"
        >
          <Search size={18} />
        </button>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Number of users</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Creation date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>No roles found</td></tr>
            ) : (
              filtered.map((role) => (
                <tr key={role._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{role.name}</td>
                  <td className="px-4 py-3">{role.usersCount}</td>
                  <td className="px-4 py-3">{role.department}</td>
                  <td className="px-4 py-3">{fmtDate(role.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4">
        <button className="text-gray-500 hover:text-gray-700 text-xs underline" onClick={() => void loadRoles(search)}>
          Refresh
        </button>
      </div>

      {showNewModal && (
        <NewRoleModal onClose={() => setShowNewModal(false)} onCreated={() => void loadRoles(search)} />
      )}
    </div>
  )
}

export default RolesPage
