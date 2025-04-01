import React from 'react'

const user = {
  name: 'Justin',
  lastName: 'Biber',
  id: '123456789',
  department: 'technology',
  role: 'full stack developer',
  status: 'Activated',
}

const requests = [
  { date: '1/1/2025', type: 'Access to CRM system', status: 'approved' },
  { date: '13/9/2024', type: 'Access to a network folder', status: 'pending' },
  { date: '9/9/2024', type: 'Access to VPN connection', status: 'approved' },
  { date: '2/7/2024', type: 'Access to ERP system', status: 'approved' },
  { date: '1/5/2024', type: 'Access to a network folder', status: 'rejected' },
  { date: '5/4/2024', type: 'Access to a network folder', status: 'approved' },
]

const MyRequests: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Info Card */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-lg font-semibold mb-2">My Information</h2>

        <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
          <p className="text-2xl font-bold">{user.name}</p>
          <p className="text-2xl font-bold">{user.lastName}</p>
          <p className="text-sm mt-2">{user.id}</p>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-500">position</span>
            <div className="mt-1 inline-block bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
              {user.department}
            </div>
            <div className="text-lg font-semibold mt-1">{user.role}</div>
            <div className="text-green-600 text-sm">{user.status}</div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition w-full">
            update info
          </button>
          <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-200 transition w-full">
            new request
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">My Requests</h2>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm">
            + new request
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Request type</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{r.date}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`capitalize font-medium ${
                        r.status === 'approved'
                          ? 'text-green-600'
                          : r.status === 'pending'
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MyRequests
