import React, { useEffect, useState } from 'react'
import {
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon,
  MapPinIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import { jwtDecode } from 'jwt-decode'
import { useUser } from '../context/UserContext'

type DecodedToken = {
  empId: string
  email: string
  exp: number
}

type Employee = {
  name: string
  firstName: string
  lastName: string
  id: string
  role: string
  phone: string
  email: string
  position?: string
  address?: string
  birthday?: string
  status?: string
}

const PersonalDetails: React.FC = () => {
  const { token } = useUser()
  const [employee, setEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      try {
        const decoded: DecodedToken = jwtDecode(token)
        const res = await fetch(`http://localhost:5000/api/employees/${decoded.empId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()
        setEmployee(data)
      } catch (err) {
        console.error('Failed to load personal details', err)
      }
    }

    fetchData()
  }, [token])

  if (!employee) return <div className="p-6">Loading...</div>

  const [firstName, lastName] = employee.name.split(' ')

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      {/* My Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">My Information</h2>
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xl rounded-xl p-4 mb-4">
          <p className="font-bold">{employee.name}</p>
          <p className="text-sm">{employee.id}</p>
        </div>
        <div className="text-sm mb-4">
          <p className="text-gray-700">Position</p>
          <div className="flex flex-col gap-1 mt-2">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs w-fit">
              {employee.role}
            </span>
            <span className="font-bold text-blue-600 text-sm">
              {employee.position || ''}
            </span>
          </div>
          <p className="text-blue-500 mt-2 text-xs">{employee.status || 'Activated'}</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <PencilSquareIcon className="h-5 w-5" />
            update info
          </button>
          <button className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <PlusCircleIcon className="h-5 w-5" />
            new request
          </button>
        </div>
      </div>

      {/* Edit Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Personal Details</h2>
        <div className="divide-y text-sm">
          <EditableDetailRow label="First Name" value={employee.firstName} editable={true} Icon={UserIcon} />
          <EditableDetailRow label="Last Name" value={employee.lastName} editable={true} Icon={UserIcon} />
          <EditableDetailRow label="ID" value={employee.id} editable={false} Icon={IdentificationIcon} />
          <EditableDetailRow label="Birth Date" value={employee.birthday || '—'} editable={false} Icon={CalendarIcon} />
          <EditableDetailRow label="Address" value={employee.address || ''} editable={true} Icon={MapPinIcon} />
          <EditableDetailRow label="Phone" value={employee.phone} editable={true} Icon={PhoneIcon} />
          <EditableDetailRow label="Email" value={employee.email} editable={true} Icon={EnvelopeIcon} />
        </div>
      </div>
    </div>
  )
}

export default PersonalDetails

const EditableDetailRow = ({
  label,
  value,
  editable,
  Icon,
}: {
  label: string
  value: string
  editable: boolean
  Icon: React.ElementType
}) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [fieldValue, setFieldValue] = React.useState(value)

  const handleSave = () => {
    setIsEditing(false)
    console.log(`${label} saved as:`, fieldValue)
  }

  return (
    <div className="flex justify-between items-center py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-blue-500" />
        <div>
          <span className="font-semibold">{label}:</span>{' '}
          {isEditing ? (
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              className="ml-2 border rounded px-2 py-1 text-sm"
            />
          ) : (
            <span className="ml-2">{fieldValue}</span>
          )}
        </div>
      </div>
      {editable ? (
        isEditing ? (
          <button
            onClick={handleSave}
            className="text-green-600 hover:underline text-sm"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:underline text-sm"
          >
            Edit
          </button>
        )
      ) : (
        <span className="text-gray-400 text-xs">not editable</span>
      )}
    </div>
  )
}
