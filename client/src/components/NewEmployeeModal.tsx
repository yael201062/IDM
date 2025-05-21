import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EmployeeFormData) => void
}

export interface EmployeeFormData {
  name: string
  id: string
  role: string
  phone: string
  email: string
  start: string
  end: string
}

const NewEmployeeModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<EmployeeFormData>({
    name: '',
    id: '',
    role: '',
    phone: '',
    email: '',
    start: '',
    end: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    onSubmit(form)
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Panel className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <Dialog.Title className="text-lg font-bold mb-4">Create New Employee</Dialog.Title>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="id" placeholder="ID" value={form.id} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="role" placeholder="Role" value={form.role} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="start" placeholder="Start Date" type="date" value={form.start} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="end" placeholder="End Date" type="date" value={form.end} onChange={handleChange} className="border px-3 py-2 rounded" />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="text-gray-600">Cancel</button>
            <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Create</button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default NewEmployeeModal
