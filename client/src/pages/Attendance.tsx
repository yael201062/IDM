import React, { useState } from 'react'

type AttendanceEntry = {
  date: string
  start: string
  end: string
  status: 'pending' | 'approved' | 'rejected'
}

const initialData: AttendanceEntry[] = [
  { date: '1/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '2/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '3/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '4/1/2025', start: '00:00', end: '00:00', status: 'pending' },
]

const Attendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceEntry[]>(initialData)

  const handleChange = (
    index: number,
    field: keyof AttendanceEntry,
    value: string
  ) => {
    const updated = [...attendance]
    updated[index][field] = value as any
    setAttendance(updated)
  }

  const addRow = () => {
    setAttendance([
      ...attendance,
      { date: '', start: '', end: '', status: 'pending' },
    ])
  }

  const handleSave = () => {
    console.log('Saved attendance:', attendance)
    alert('Attendance saved!')
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Attendance</h2>
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="bg-blue-100 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-200 text-sm"
          >
            + Add Row
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm"
          >
            Save
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Start Time</th>
              <th className="px-4 py-3">End Time</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((entry, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="date"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={entry.date}
                    onChange={(e) => handleChange(idx, 'date', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={entry.start}
                    onChange={(e) => handleChange(idx, 'start', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={entry.end}
                    onChange={(e) => handleChange(idx, 'end', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={entry.status}
                    onChange={(e) =>
                      handleChange(idx, 'status', e.target.value)
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Attendance
