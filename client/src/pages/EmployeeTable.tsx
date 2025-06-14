import React, { useState, useEffect } from 'react'
import { Search, Pencil, Trash2 } from 'lucide-react'
import NewEmployeeForm from './NewEmployeeForm'

export type Employee = {
  name: string
  id: string
  role: string
  phone: string
  email: string
  start: string
  end: string
  systemRole: 'worker' | 'manager' | 'hr' | 'it'
}

const EmployeeTable: React.FC = () => {
  const [search, setSearch] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/employees')
      const data = await res.json()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const filtered = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddEmployee = async () => {
    await fetchEmployees()
    setEditingEmployee(null)
  }

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      fetchEmployees()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
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
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{emp.name}</td>
                  <td className="px-4 py-3">{emp.id}</td>
                  <td className="px-4 py-3">{emp.role}</td>
                  <td className="px-4 py-3">{emp.systemRole}</td>
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
                      onClick={() => handleDelete(emp.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
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
