import React, { useEffect, useMemo, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

type Employee = {
  _id?: string
  id: string
  name?: string
  firstName?: string
  lastName?: string
  role?: string
  phone?: string
  email?: string
  start?: string // שרשור תאריכים כטקסט
  end?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

/** פונקציה קטנה לנרמל שם */
const displayName = (emp: Employee) => {
  if (emp.name && emp.name.trim()) return emp.name
  const fn = emp.firstName?.trim() ?? ''
  const ln = emp.lastName?.trim() ?? ''
  return [fn, ln].filter(Boolean).join(' ') || emp.id
}

/** נירמול DD/MM/YYYY -> YYYY-MM-DD לתצוגה עקבית (רק לתצוגה) */
const normalizeDate = (s?: string) => {
  if (!s) return ''
  const t = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const m1 = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/) // DD/MM/YYYY
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`
  // ניסיון כללי
  const d = new Date(t)
  return isNaN(d.getTime()) ? t : d.toISOString().split('T')[0]
}

const MyEmployees: React.FC = () => {
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(25) // כמה להציג (Show more יגדיל)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])

  // --- משיכה מהשרת (גרסה פשוטה שמביאה את כולם ואז מסננת בצד לקוח) ---
  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token') // אם יש לך JWT
      const res = await fetch(`${API_BASE}/api/employees`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`${res.status} ${txt || 'Failed to fetch employees'}`)
      }
      const data: Employee[] = await res.json()
      setEmployees(data)
    } catch (e: any) {
      console.error('Fetch employees failed:', e)
      setError(e?.message || 'Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // --- חיפוש (שם או ת״ז) בצד לקוח ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((emp) => {
      const nameStr = displayName(emp).toLowerCase()
      const idStr = (emp.id || '').toLowerCase()
      return nameStr.includes(q) || idStr.includes(q)
    })
  }, [employees, search])

  // --- רשימה להצגה (limit/“Show more”) ---
  const toShow = filtered.slice(0, limit)

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Employees</h2>

        <button
          onClick={fetchEmployees}
          className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-full w-full max-w-xs text-sm"
        />
        <button className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600" disabled>
          <Search size={18} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <Loader2 className="animate-spin" size={16} />
          Loading employees…
        </div>
      )}
      {error && (
        <div className="text-red-600 text-sm mb-3">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Phone number</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Start date</th>
              <th className="px-4 py-3">End date</th>
            </tr>
          </thead>
          <tbody>
            {toShow.map((emp, i) => (
              <tr key={emp._id || emp.id || i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{displayName(emp)}</td>
                <td className="px-4 py-3">{emp.id}</td>
                <td className="px-4 py-3">{emp.role || '-'}</td>
                <td className="px-4 py-3">{emp.phone || '-'}</td>
                <td className="px-4 py-3">{emp.email || '-'}</td>
                <td className="px-4 py-3">{normalizeDate(emp.start) || '-'}</td>
                <td className="px-4 py-3">{normalizeDate(emp.end) || '-'}</td>
              </tr>
            ))}
            {!loading && !error && toShow.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Show more */}
      <div className="flex justify-center mt-4">
        <button
          className="text-gray-600 hover:text-gray-800 text-xs underline disabled:opacity-40"
          onClick={() => setLimit((n) => n + 25)}
          disabled={toShow.length >= filtered.length || loading}
        >
          Show more
        </button>
      </div>
    </div>
  )
}

export default MyEmployees
