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
import { useNavigate } from 'react-router-dom'

// --- Types ---
type DecodedToken = {
  empId?: string
  employeeId?: string
  id?: string
  email?: string
  exp?: number
}

type Employee = {
  name: string
  firstName: string
  lastName: string
  id: string            // ת"ז אישית (לפי השרת שלך)
  role: string
  phone: string
  email: string
  position?: string
  address?: string
  birthday?: string
  status?: string
  department?: string
}

// --- Config ---
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://10.10.248.150:5000'

const PersonalDetails: React.FC = () => {
   const navigate = useNavigate()   
  const { token } = useUser()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const decoded = (jwtDecode(token) || {}) as DecodedToken
        const empId =
          decoded.empId || decoded.employeeId || decoded.id
        if (!empId) {
          setError('Cannot resolve employee id from token')
          setLoading(false)
          return
        }

        const res = await fetch(`${API_BASE}/api/employees/${empId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Failed to load (status ${res.status})`)
        const data = (await res.json()) as Employee

        // אם name נשמר בפורמט 'First-Last', ניישר firstName/lastName אם חסרים
        let firstName = data.firstName
        let lastName = data.lastName
        if ((!firstName || !lastName) && data.name) {
          const parts = data.name.split(/[-\s]+/)
          if (!firstName) firstName = parts[0] || ''
          if (!lastName) lastName = parts.slice(1).join(' ') || ''
        }

        setEmployee({ ...data, firstName, lastName })
      } catch (err: any) {
        console.error('Failed to load personal details', err)
        setError(err?.message || 'Failed to load personal details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  if (loading || !employee) return <div className="p-6">Loading...</div>

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
          <button  onClick={() => navigate('/my-requests')} className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <PlusCircleIcon className="h-5 w-5" />
            new request
          </button>
        </div>
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      </div>

      {/* Edit Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Personal Details</h2>
        <div className="divide-y text-sm">
          <EditableDetailRow
            label="First Name"
            fieldKey="firstName"
            value={employee.firstName || ''}
            Icon={UserIcon}
            empId={employee.id}
            token={token!}
            onLocalChange={(val) => {
              setEmployee((e) => (e ? { ...e, firstName: val, name: `${val}-${e.lastName || ''}` } : e))
            }}
          />
          <EditableDetailRow
            label="Last Name"
            fieldKey="lastName"
            value={employee.lastName || ''}
            Icon={UserIcon}
            empId={employee.id}
            token={token!}
            onLocalChange={(val) => {
              setEmployee((e) => (e ? { ...e, lastName: val, name: `${e.firstName || ''}-${val}` } : e))
            }}
          />
          <ReadOnlyRow label="ID" value={employee.id} Icon={IdentificationIcon} />
          <ReadOnlyRow label="Birth Date" value={employee.birthday || '—'} Icon={CalendarIcon} />
          <EditableDetailRow
            label="Address"
            fieldKey="address"
            value={employee.address || ''}
            Icon={MapPinIcon}
            empId={employee.id}
            token={token!}
            onLocalChange={(val) => setEmployee((e) => (e ? { ...e, address: val } : e))}
          />
          <EditableDetailRow
            label="Phone"
            fieldKey="phone"
            value={employee.phone || ''}
            Icon={PhoneIcon}
            empId={employee.id}
            token={token!}
            onLocalChange={(val) => setEmployee((e) => (e ? { ...e, phone: val } : e))}
            validate={(v) => (/^[0-9+\-\s()]{6,20}$/.test(v) ? null : 'Invalid phone')}
          />
          <EditableDetailRow
            label="Email"
            fieldKey="email"
            value={employee.email || ''}
            Icon={EnvelopeIcon}
            empId={employee.id}
            token={token!}
            onLocalChange={(val) => setEmployee((e) => (e ? { ...e, email: val } : e))}
            validate={(v) =>
              (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email')
            }
          />
        </div>
      </div>
    </div>
  )
}

export default PersonalDetails

// ---- Rows ----

function ReadOnlyRow({
  label,
  value,
  Icon,
}: {
  label: string
  value: string
  Icon: React.ElementType
}) {
  return (
    <div className="flex justify-between items-center py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-blue-500" />
        <div>
          <span className="font-semibold">{label}:</span>
          <span className="ml-2">{value}</span>
        </div>
      </div>
      <span className="text-gray-400 text-xs">not editable</span>
    </div>
  )
}

function EditableDetailRow<TField extends keyof Employee>({
  label,
  fieldKey,
  value,
  Icon,
  empId,
  token,
  onLocalChange,
  validate,
}: {
  label: string
  fieldKey: TField
  value: string
  Icon: React.ElementType
  empId: string
  token: string
  onLocalChange: (newVal: string) => void
  validate?: (v: string) => string | null
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [fieldValue, setFieldValue] = React.useState(value)
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)


  React.useEffect(() => {
    setFieldValue(value)
  }, [value])

  const handleSave = async () => {
    const err = validate?.(fieldValue) ?? null
    if (err) {
      setMsg(err)
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const body: Partial<Employee> = { [fieldKey]: fieldValue } as any
      if (fieldKey === 'firstName' || fieldKey === 'lastName') {
      }

      const res = await fetch(`${API_BASE}/api/employees/${empId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Update failed (${res.status})`)
      }

      onLocalChange(fieldValue) // אופטימיסטי: עדכון ה‑state בהורה
      setIsEditing(false)
      setMsg('Saved ✓')
          window.dispatchEvent(new CustomEvent('profile-updated'))
    } catch (e: any) {
      console.error(e)
      setMsg(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
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
              disabled={saving}
            />
          ) : (
            <span className="ml-2">{value || '—'}</span>
          )}
          {msg && (
            <span className={`ml-3 text-xs ${msg.includes('Saved') ? 'text-green-600' : 'text-red-600'}`}>
              {msg}
            </span>
          )}
        </div>
      </div>
      {isEditing ? (
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-green-600 hover:underline text-sm disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:underline text-sm"
        >
          Edit
        </button>
      )}
    </div>
  )
}
