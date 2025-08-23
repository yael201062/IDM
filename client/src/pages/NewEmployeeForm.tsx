import React, { useEffect, useState } from 'react'

interface Props {
  onClose: () => void
  onSubmit: (employee: any) => void
  editingEmployee?: any
}

const NewEmployeeForm: React.FC<Props> = ({ onClose, onSubmit, editingEmployee }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    id: '',
    role: '',
    phone: '',
    email: '',
    start: '',
    end: '',
    birthday: '',
    systemRole: '',
    managerId: '', // ← חדש
  })

  const [employees, setEmployees] = useState<any[]>([]) // ← חדש
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingEmployee) {
      const [firstName, lastName] = editingEmployee.name?.split('-') || ['', '']
      setForm({
        ...editingEmployee,
        firstName,
        lastName,
        managerId: editingEmployee.managerId || '',
      })
    }
  }, [editingEmployee])

  // ← חדש: טעינת כל העובדים כדי לאפשר בחירת מנהל
useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employees')
      const data = await res.json()
      setEmployees(data.filter((emp: any) => emp.systemRole === 'manager')) // ← רק מנהלים
    } catch (err) {
      console.error('Failed to load employees:', err)
    }
  }

  fetchEmployees()
}, [])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async () => {
    setError(null)

    if (!form.firstName || !form.lastName || !form.id || !form.email || !form.role || !form.start || !form.birthday || !form.systemRole) {
      return setError('All required fields must be filled')
    }

    if (!/^[0-9]{9}$/.test(form.id)) {
      return setError('ID must be 9 digits')
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return setError('Invalid email')
    }

    setLoading(true)

    try {
      const url = editingEmployee
        ? `http://localhost:5000/api/employees/${editingEmployee._id}`
        : 'http://localhost:5000/api/employees'
      const method = editingEmployee ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form), // כולל גם managerId
      })

      const data = await res.json()

      if (!res.ok) {
        return setError(data.error || 'Failed to save employee')
      }

      onSubmit(data)
      onClose()
    } catch (err) {
      console.error(err)
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg space-y-4">
        <h3 className="text-xl font-bold">{editingEmployee ? 'Edit Employee' : 'New Employee'}</h3>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <input name="firstName" placeholder="First Name" className="input" value={form.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" className="input" value={form.lastName} onChange={handleChange} />
          <input name="id" placeholder="ID" className="input" value={form.id} onChange={handleChange} disabled={!!editingEmployee} />
          <input name="role" placeholder="Role" className="input" value={form.role} onChange={handleChange} />
          <input name="phone" placeholder="Phone" className="input" value={form.phone} onChange={handleChange} />
          <input name="email" placeholder="Email" type="email" className="input" value={form.email} onChange={handleChange} />

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input name="start" type="date" className="input" value={form.start} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input name="end" type="date" className="input" value={form.end} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Birthday</label>
              <input name="birthday" type="date" className="input" value={form.birthday} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">System Role</label>
              <select name="systemRole" className="input" value={form.systemRole} onChange={handleChange}>
                <option value="">Select role</option>
                <option value="worker">Worker</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="it">IT</option>
              </select>
            </div>
          </div>

          {/* 🆕 שדה מנהל ישיר */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Direct Manager</label>
            <select
              name="managerId"
              className="input"
              value={form.managerId}
              onChange={handleChange}
            >
              <option value="">Select manager</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:underline">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
            {loading ? (editingEmployee ? 'Updating...' : 'Creating...') : editingEmployee ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewEmployeeForm
