import React, { useState, useEffect } from 'react'
import { Search, Pencil, Trash2 } from 'lucide-react'
import NewEmployeeForm from './NewEmployeeForm'

export type Employee = {
  _id: string
  name: string
  id: string
  role: string
  phone: string
  email: string
  start: string
  end: string
  systemRole: 'worker' | 'manager' | 'hr' | 'it'
  managerId?: string
}

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://10.10.248.150:5000/api'

const EmployeeTable: React.FC = () => {
  const [search, setSearch] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // מחזיר תמיד Record<string,string> (HeadersInit חוקי)
  const authHeaders = (): Record<string, string> => {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      ''
    const h: Record<string, string> = {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)

      // שינוי חשוב: שולחים all=1 כדי לקבל את כל העובדים
      const res = await fetch(`${API_BASE}/employees?all=1`, {
        headers: { ...authHeaders() },
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('GET /employees failed:', res.status, txt)
        setEmployees([])
        setError(`Failed to load employees (HTTP ${res.status})`)
        return
      }

      const data = await res.json().catch(() => [] as Employee[])
      setEmployees(Array.isArray(data) ? (data as Employee[]) : [])
    } catch (e) {
      console.error('Failed to fetch employees:', e)
      setEmployees([])
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = (employees || []).filter((emp) =>
    (emp.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAddEmployee = async () => {
    await fetchEmployees()
    setEditingEmployee(null)
  }

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setShowForm(true)
  }

  const handleDelete = async (_id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    try {
      const res = await fetch(`${API_BASE}/employees/${_id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
      })
      if (!res.ok) throw new Error('Delete failed')
      setEmployees((prev) => prev.filter((emp) => emp._id !== _id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const getManagerName = (managerId?: string): string => {
    if (!managerId) return '-'
    const manager = employees.find((e) => e.id === managerId)
    return manager ? manager.name : 'Not found'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Employee Management</h2>
        <button
          onClick={() => {
            setEditingEmployee(null)
            setShowForm(true)
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm flex items-center gap-2"
        >
          <span>New Employee</span>
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
        <button className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600">
          <Search size={18} />
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">System Role</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{emp.name}</td>
                  <td className="px-4 py-3">{emp.id}</td>
                  <td className="px-4 py-3">{emp.role}</td>
                  <td className="px-4 py-3">{emp.systemRole}</td>
                  <td className="px-4 py-3">{getManagerName(emp.managerId)}</td>
                  <td className="px-4 py-3">{emp.phone}</td>
                  <td className="px-4 py-3">{emp.email}</td>
                  <td className="px-4 py-3">{emp.start}</td>
                  <td className="px-4 py-3">{emp.end || '-'}</td>
                  <td className="px-4 py-3 text-center flex gap-2">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(emp._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={10}>
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <NewEmployeeForm
          onClose={() => setShowForm(false)}
          onSubmit={handleAddEmployee}
          editingEmployee={editingEmployee}
        />
      )}
    </div>
  )
}

export default EmployeeTable
