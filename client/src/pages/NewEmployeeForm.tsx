import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Employee } from './EmployeeTable'

type Props = {
  onClose: () => void
  onSubmit: () => void
}

const NewEmployeeForm: React.FC<Props> = ({ onClose, onSubmit }) => {
  const [newEmp, setNewEmp] = useState<Employee>({
    name: '',
    id: '',
    role: '',
    phone: '',
    email: '',
    start: '',
    end: '',
  })
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEmp({ ...newEmp, [e.target.name]: e.target.value })
  }

  const handleValidatedSubmit = async () => {
    const { name, id, email, phone } = newEmp
    setFormError('')
    setLoading(true)

    if (!/^[A-Za-z\s]{2,}$/.test(name)) {
      setFormError('Please enter a valid full name.')
      setLoading(false)
      return
    }
    if (!/^\d{9}$/.test(id)) {
      setFormError('ID must be 9 digits.')
      setLoading(false)
      return
    }
    if (!/^05\d-\d{7}$/.test(phone)) {
      setFormError('Phone must be in format 05X-XXXXXXX.')
      setLoading(false)
      return
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setFormError('Invalid email address.')
      setLoading(false)
      return
    }

    try {
      await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp),
      })

      setLoading(false)
      onClose()
      onSubmit()
    } catch (err) {
      setLoading(false)
      setFormError('Failed to add employee. Try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-400 hover:text-red-600 text-2xl font-bold"
        >
          ×
        </button>
        <h3 className="text-2xl font-bold mb-6">Add New Employee</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'name', label: 'Full Name', placeholder: 'e.g. Moran Gur' },
            { name: 'id', label: 'ID', placeholder: '9 digits' },
            { name: 'role', label: 'Role', placeholder: 'e.g. Marketing' },
            { name: 'phone', label: 'Phone', placeholder: '05X-XXXXXXX' },
            { name: 'email', label: 'Email', placeholder: 'example@mail.com' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium">{label}</label>
              <input
                name={name}
                value={(newEmp as any)[name]}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                placeholder={placeholder}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <DatePicker
              selected={newEmp.start ? new Date(newEmp.start) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  setNewEmp({
                    ...newEmp,
                    start: date.toISOString().split('T')[0],
                  })
                }
              }}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholderText="Start date"
              dateFormat="dd/MM/yyyy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Date</label>
            <DatePicker
              selected={newEmp.end ? new Date(newEmp.end) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  setNewEmp({
                    ...newEmp,
                    end: date.toISOString().split('T')[0],
                  })
                }
              }}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholderText="End date"
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>

        {formError && (
          <div className="text-red-500 text-sm mt-4">{formError}</div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleValidatedSubmit}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded text-white flex items-center justify-center ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Add Employee'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewEmployeeForm
