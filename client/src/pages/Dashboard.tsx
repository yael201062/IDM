import React, { useEffect, useState } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { jwtDecode } from 'jwt-decode'
import { useUser } from '../context/UserContext'
import {
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'

type DecodedToken = {
  empId: string
  email: string
  exp: number
}

type User = {
  name: string
  id: string
  role: string
  position?: string
  status?: string
  vacationDays: number
  sickDays: number
  workHours: number
}

const DashboardPage: React.FC = () => {
  const { token } = useUser()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return

      try {
        const decoded: DecodedToken = jwtDecode(token)
        const res = await fetch(`http://localhost:5000/api/employees/${decoded.empId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()
        setUser(data)
      } catch (err) {
        console.error('Failed to fetch user info', err)
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
          <p className="font-bold">{user?.name || '...'}</p>
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

      {/* Dashboard Stats */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>

        <div className="grid grid-cols-3 gap-4">
          <StatBox title={user?.vacationDays?.toString() ?? '...'} subtitle="Vacation days" />
          <StatBox title={user?.sickDays?.toString() ?? '...'} subtitle="Sick days" />
          <StatBox title={user?.workHours?.toString() ?? '...'} subtitle="Business hours" />
        </div>

      <div className="grid grid-cols-3 gap-4 align-items-center justify-items-center mt-6">
  <PieChart
    value={parseFloat(((18 - (user?.vacationDays || 0)) / 18 * 100).toFixed(0))}
    label="Vacation used"
  />
  <PieChart
    value={parseFloat(((30 - (user?.sickDays || 0)) / 30 * 100).toFixed(0))}
    label="Sick used"
  />
  <PieChart
    value={parseFloat(((user?.workHours || 0) / 160 * 100).toFixed(0))}
    label="Worked"
  />
</div>


      </div>
    </div>
  )
}

export default DashboardPage

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
        pathColor: '#3b82f6', // כחול
        textColor: '#1e3a8a',
        trailColor: '#e0e7ff',
        textSize: '28px',
      })}
    />
    <p className="text-xs mt-2 text-center text-gray-600">{label}</p>
  </div>
)
