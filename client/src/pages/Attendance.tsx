import React, { useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

type AttendanceEntry = {
  date: string
  start: string
  end: string
  type: 'work' | 'vacation' | 'sick'
}

const Attendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [page, setPage] = useState(1)
  const rowsPerPage = 15

  const paginated = attendance.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const totalPages = Math.ceil(attendance.length / rowsPerPage)

  const handleChange = <K extends keyof AttendanceEntry>(
    index: number,
    field: K,
    value: AttendanceEntry[K]
  ) => {
    const updated = [...attendance]
    updated[(page - 1) * rowsPerPage + index][field] = value
    setAttendance(updated)

    if (field === 'start' || field === 'end') {
      const start = field === 'start' ? value as string : updated[index].start
      const end = field === 'end' ? value as string : updated[index].end
      if (start && end && start > end) {
        setErrors((prev) => ({ ...prev, [index]: 'End must be after start' }))
      } else {
        const newErrors = { ...errors }
        delete newErrors[index]
        setErrors(newErrors)
      }
    }
  }

  const calcHours = (start: string, end: string) => {
    if (!start || !end) return 0
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const startMins = sh * 60 + sm
    const endMins = eh * 60 + em
    return Math.max(0, (endMins - startMins) / 60)
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const decoded: any = jwtDecode(token)
    const empId = decoded.empId
    setLoading(true)

    try {
      for (const entry of attendance) {
        const hours = calcHours(entry.start, entry.end)
        await fetch(`http://localhost:5000/api/attendance/${empId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...entry, hours }),
        })
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const decoded: any = jwtDecode(token)
    const empId = decoded.empId

    const load = async () => {
      const resEmp = await fetch(`http://localhost:5000/api/employees/${empId}`)
      const emp = await resEmp.json()
      const startDate = new Date(emp.start)
      const today = new Date()
      const dates: AttendanceEntry[] = []

      let d = new Date(startDate)
      while (d <= today) {
        const iso = d.toISOString().split('T')[0]
        dates.push({ date: iso, start: '', end: '', type: 'work' })
        d.setDate(d.getDate() + 1)
      }

      const resHist = await fetch(`http://localhost:5000/api/attendance/history/${empId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const history = await resHist.json()

      const combined = dates.map((row) => {
        const match = history.find((h: any) => h.date === row.date)
        return match || row
      })

      setAttendance(combined.reverse()) // הכי חדשים למעלה
    }

    load()
  }, [])

  return (
    <div className="relative bg-white p-6 rounded-lg shadow-md">
      {success && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow">
          Attendance saved successfully!
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Attendance Log</h2>
        <button
          onClick={handleSave}
          disabled={loading || Object.keys(errors).length > 0}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Hours</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((entry, idx) => {
              const hours = calcHours(entry.start, entry.end)
              return (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="date" className="w-full border rounded px-2 py-1 text-sm"
                      value={entry.date}
                      onChange={(e) => handleChange(idx, 'date', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input type="time" className="w-full border rounded px-2 py-1 text-sm"
                      value={entry.start}
                      onChange={(e) => handleChange(idx, 'start', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input type="time" className="w-full border rounded px-2 py-1 text-sm"
                      value={entry.end}
                      onChange={(e) => handleChange(idx, 'end', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select className="w-full border rounded px-2 py-1 text-sm"
                      value={entry.type}
                      onChange={(e) =>
                        handleChange(idx, 'type', e.target.value as AttendanceEntry['type'])
                      }>
                      <option value="work">Work</option>
                      <option value="vacation">Vacation</option>
                      <option value="sick">Sick</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">{hours}h</td>
                  <td className="px-4 py-3 text-red-500 text-xs">
                    {errors[(page - 1) * rowsPerPage + idx] || ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex justify-end items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Attendance
