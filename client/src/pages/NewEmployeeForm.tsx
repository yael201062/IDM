import React, { useEffect, useState } from 'react'

interface Props {
  onClose: () => void
  onSubmit: (employee: any) => void
  editingEmployee?: any
}

const ctl =
  'w-full h-11 rounded-md border border-gray-300 px-3 text-sm placeholder-gray-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'

const label = 'block text-sm font-medium text-gray-700 mb-1'

// ✅ חדש: כמו בשאר הקוד – בסיס ה־API מה־env עם ברירת מחדל ל־localhost
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:5000/api'

// ✅ חדש: מביא כותרת Authorization אם יש טוקן (ל־/api/employees מוגן)
const authHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    ''
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

const NewEmployeeForm: React.FC<Props> = ({ onClose, onSubmit, editingEmployee }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    id: '',
    role: '',
    roleId: '',
    phone: '',
    email: '',
    start: '',
    end: '',
    birthday: '',
    systemRole: '',
    managerId: '',
  })

  const [employees, setEmployees] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingEmployee) {
      const [firstName, lastName] = editingEmployee.name?.split('-') || ['', '']
      setForm((prev) => ({
        ...prev,
        ...editingEmployee,
        firstName,
        lastName,
        managerId: editingEmployee.managerId || '',
        roleId: editingEmployee.roleId || '',
        role: editingEmployee.role || '',
      }))
    }
  }, [editingEmployee])

  // ✅ שינוי חשוב: טעינת כלל העובדים (ל־HR/IT יחזור כולם; למנהלים לפי הרשאות),
  // ושימוש ב־Authorization + ?all=1 כדי להבטיח קבלת כולם
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE}/employees?all=1`, {
          headers: { ...authHeaders() },
        })
        const data = await res.json().catch(() => [])
        const all = Array.isArray(data) ? data : []
        // מציגים רק מנהלים ברשימת ה־Direct Manager
        const onlyManagers = all.filter(
          (emp: any) => String(emp.systemRole || '').toLowerCase() === 'manager'
        )
        setEmployees(onlyManagers)
      } catch (err) {
        console.error('Failed to load employees:', err)
      }
    }
    fetchEmployees()
  }, [])

  // (רשות) הוספתי גם Authorization ל־roles (לא מזיק אם ה־route פתוח)
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_BASE}/roles`, {
          headers: { ...authHeaders() },
        })
        const data = await res.json()
        setRoles(data)
        if (editingEmployee && !editingEmployee.roleId && editingEmployee.role) {
          const match = data.find((r: any) => r.name === editingEmployee.role)
          if (match) setForm((prev) => ({ ...prev, roleId: match._id }))
        }
      } catch (err) {
        console.error('Failed to load roles:', err)
      }
    }
    fetchRoles()
  }, [editingEmployee])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value
    const selected = roles.find((r) => r._id === roleId)
    setForm({ ...form, roleId, role: selected ? selected.name : '' })
  }

  const handleSubmit = async () => {
    setError(null)

    if (
      !form.firstName ||
      !form.lastName ||
      !form.id ||
      !form.email ||
      !form.roleId ||     // מחייב roleId מהרשימה
      !form.start ||
      !form.birthday ||
      !form.systemRole
    ) {
      return setError('All required fields must be filled (Role is required)')
    }

    if (!/^[0-9]{9}$/.test(form.id)) return setError('ID must be 9 digits')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Invalid email')

    setLoading(true)
    try {
      const url = editingEmployee
        ? `${API_BASE}/employees/${editingEmployee._id}` // עריכה לפי _id
        : `${API_BASE}/employees`
      const method = editingEmployee ? 'PUT' : 'POST'

      console.log('Submitting new employee payload:', form)

      const res = await fetch(url, {
        method,
        headers: { ...authHeaders() },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Failed to save employee')

      onSubmit(data)
      onClose()
    } catch (err) {
      console.error(err)
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // עוזר ל-label של מנהל כשאין firstName/lastName במסמך
  const managerLabel = (emp: any) => {
    const [n1 = '', n2 = ''] = String(emp.name || '').split('-')
    const fn = emp.firstName || n1
    const ln = emp.lastName || n2
    return `${fn} ${ln}`.trim()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl">
        <h3 className="text-2xl font-semibold mb-4">New Employee</h3>

        {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>First Name</label>
            <input name="firstName" placeholder="First Name" className={ctl} value={form.firstName} onChange={handleChange} />
          </div>
          <div>
            <label className={label}>Last Name</label>
            <input name="lastName" placeholder="Last Name" className={ctl} value={form.lastName} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>ID</label>
            <input name="id" placeholder="ID" className={ctl} value={form.id} onChange={handleChange} disabled={!!editingEmployee} />
          </div>
          <div>
            <label className={label}>Role</label>
            <select name="roleId" className={ctl} value={form.roleId} onChange={handleRoleChange}>
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} {r.department ? `(${r.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Phone</label>
            <input name="phone" placeholder="Phone" className={ctl} value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input name="email" placeholder="Email" type="email" className={ctl} value={form.email} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Start Date</label>
            <input name="start" type="date" className={ctl} value={form.start} onChange={handleChange} />
          </div>
          <div>
            <label className={label}>End Date</label>
            <input name="end" type="date" className={ctl} value={form.end} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Birthday</label>
            <input name="birthday" type="date" className={ctl} value={form.birthday} onChange={handleChange} />
          </div>
          <div>
            <label className={label}>System Role</label>
            <select name="systemRole" className={ctl} value={form.systemRole} onChange={handleChange}>
              <option value="">Select role</option>
              <option value="worker">Worker</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={label}>Direct Manager</label>
            <select name="managerId" className={ctl} value={form.managerId} onChange={handleChange}>
              <option value="">Select manager</option>
              {employees.map((emp) => (
                // ⚠️ value הוא ת״ז (id) — זה מה שהשרת מצפה בשדה managerId
                <option key={emp.id} value={emp.id}>
                  {managerLabel(emp)} ({emp.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:underline">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? (editingEmployee ? 'Updating...' : 'Creating...') : editingEmployee ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewEmployeeForm
