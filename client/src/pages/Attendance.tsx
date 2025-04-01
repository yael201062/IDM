import React from 'react'

const attendanceData = [
  { date: '1/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '2/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '3/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '4/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '5/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '6/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '7/1/2025', start: '00:00', end: '00:00', status: 'pending' },
  { date: '8/1/2025', start: '00:00', end: '00:00', status: 'pending' },
]

const Attendance: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Attendance</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
          save
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Start Time</th>
              <th className="px-6 py-3">End Time</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((entry, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{entry.date}</td>
                <td className="px-6 py-4">{entry.start}</td>
                <td className="px-6 py-4">{entry.end}</td>
                <td className="px-6 py-4 text-gray-500">{entry.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Attendance
