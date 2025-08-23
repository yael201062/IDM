import React, { useEffect, useState } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { jwtDecode } from 'jwt-decode'
import { useUser } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import {
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'

type DecodedToken = {
  empId?: string
  employeeId?: string
  id?: string
  email?: string
  exp?: number
}

type User = {
  name: string
  id: string
  role: string
  position?: string
  status?: string
  vacationDays: number   // כמה נשאר
  sickDays: number       // כמה נשאר
  workHours: number      // שעות עבודה בטווח (ברירת מחדל: חודש נוכחי)
}

type SummaryResponse = {
  employee: {
    id: string
    name?: string
    email?: string
    role?: string
    department?: string
    status?: string
    baseVacationDays?: number
    baseSickDays?: number
  }
  kpis: {
    remainingVacationDays: number
    remainingSickDays: number
    workHoursInRange: number
    overtimeHoursInRange?: number
    vacationTakenThisYear?: number
    sickTakenThisYear?: number
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const DashboardPage: React.FC = () => {
  const { token } = useUser()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
    const navigate = useNavigate()   
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return
      setLoading(true)
      setError(null)

      try {
        const decoded = (jwtDecode(token) || {}) as DecodedToken
        const empId =
          decoded.empId ||
          decoded.employeeId ||
          decoded.id

        if (!empId) {
          setError('Cannot resolve employee id from token')
          setLoading(false)
          return
        }

        const res = await fetch(`${API_BASE}/api/employees/${empId}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const msg = await res.text().catch(() => '')
          throw new Error(msg || `Request failed with ${res.status}`)
        }

        const summary: SummaryResponse = await res.json()

        // מיפוי תשובת הסיכום למבנה שה‑UI מצפה לו
        const mapped: User = {
          id: summary.employee.id,
          name:
            summary.employee.name ||
            (decoded.email ? decoded.email.split('@')[0] : 'Employee'),
          role: summary.employee.role || 'worker',
          position: undefined,
          status: summary.employee.status || 'Activated',
          vacationDays: summary.kpis.remainingVacationDays ?? 18,
          sickDays: summary.kpis.remainingSickDays ?? 30,
          workHours: summary.kpis.workHoursInRange ?? 0,
        }

        setUser(mapped)
      } catch (err: any) {
        console.error('Failed to fetch user summary', err)
        setError(err?.message || 'Failed to fetch user summary')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [token])

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      {/* My Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">My Information</h2>

        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xl rounded-xl p-4 mb-4">
          <p className="font-bold">
            {loading ? 'Loading…' : user?.name || '...'}
          </p>
          <p className="text-sm">{user?.id || ''}</p>
        </div>

        <div className="text-sm mb-4">
          <p className="text-gray-700">Position</p>
          <div className="flex flex-col gap-1 mt-2">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs w-fit">
              {user?.role || ''}
            </span>
            <span className="font-bold text-blue-600 text-sm">
              {user?.position || ''}
            </span>
          </div>
          <p className="text-blue-500 mt-2 text-xs">{user?.status || 'Activated'}</p>
        </div>

        <div className="flex gap-2">
          <button  onClick={() => navigate('/personal-details')} className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <PencilSquareIcon className="h-5 w-5" />
            update info
          </button>
          <button  onClick={() => navigate('/my-requests')} className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <PlusCircleIcon className="h-5 w-5" />
            new request
          </button>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>

        <div className="grid grid-cols-3 gap-4">
          <StatBox title={user?.vacationDays?.toString() ?? (loading ? '…' : '0')} subtitle="Vacation days" />
          <StatBox title={user?.sickDays?.toString() ?? (loading ? '…' : '0')} subtitle="Sick days" />
          <StatBox title={user?.workHours?.toString() ?? (loading ? '…' : '0')} subtitle="Business hours" />
        </div>

        <div className="grid grid-cols-3 gap-4 align-items-center justify-items-center mt-6">
          <PieChart
            value={safePercent(((18 - (user?.vacationDays || 0)) / 18) * 100)}
            label="Vacation used"
          />
          <PieChart
            value={safePercent(((30 - (user?.sickDays || 0)) / 30) * 100)}
            label="Sick used"
          />
          <PieChart
            value={safePercent(((user?.workHours || 0) / 160) * 100)}
            label="Worked"
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

// Helpers & small components

function safePercent(v: number) {
  if (!isFinite(v) || isNaN(v)) return 0
  if (v < 0) return 0
  if (v > 100) return 100
  return parseFloat(v.toFixed(0))
}

const StatBox = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="bg-white rounded-lg shadow p-4 text-center">
    <div className="text-3xl font-bold text-blue-600 mb-1">{title}</div>
    <div className="text-sm text-gray-600">{subtitle}</div>
  </div>
)

const PieChart = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center justify-center w-24 h-24">
    <CircularProgressbar
      value={value}
      text={`${value}%`}
      styles={buildStyles({
        pathColor: '#3b82f6',
        textColor: '#1e3a8a',
        trailColor: '#e0e7ff',
        textSize: '28px',
      })}
    />
    <p className="text-xs mt-2 text-center text-gray-600">{label}</p>
  </div>
)
