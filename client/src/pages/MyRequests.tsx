import React, { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'
import {
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

interface Request {
  _id?: string
  date?: string
  description: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'manager-approved' | 'it-approved'
  createdAt?: string
}

const MyRequests: React.FC = () => {
  const { user } = useUser()
  const [requests, setRequests] = useState<Request[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newRequest, setNewRequest] = useState({
    description: '',
    type: '',
  })
  const [error, setError] = useState('')
   const navigate = useNavigate()   

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/requests/mine`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        const data = await res.json()
        setRequests(data)
      } catch (err) {
        console.error('Error loading requests:', err)
      }
    }

    fetchRequests()
  }, [])

  const handleSubmitRequest = async () => {
    setError('')

    if (!newRequest.description || !newRequest.type) {
      setError('Please fill in all fields.')
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newRequest),
      })

      if (!res.ok) throw new Error('Failed to submit')

      const created = await res.json()
      setRequests((prev) => [...prev, created])
      setShowModal(false)
      setNewRequest({ description: '', type: '' })
    } catch (err) {
      console.error('Error submitting request:', err)
      setError('An error occurred while submitting the request.')
    }
  }

  if (!user) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">My Information</h2>
        <div className="bg-blue-500 text-white text-xl rounded-xl p-4 mb-4">
          <p className="font-bold">{user.firstName}-{user.lastName}</p>
          <p className="text-sm">{user.id}</p>
        </div>
        <div className="text-sm mb-4">
          <p className="text-gray-700">Position</p>
          <div className="flex flex-col gap-1 mt-2">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs w-fit">
              {user.role}
            </span>
            <span className="font-bold text-blue-600 text-sm">
              {user.department}
            </span>
          </div>
          <p className="text-blue-500 mt-2 text-xs">{user.status}</p>
        </div>
        <div className="flex gap-2">
          <button  onClick={() => navigate('/personal-details')} className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2 w-full">
            <PencilSquareIcon className="h-5 w-5" />
            update info
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2 w-full"
          >
            <PlusCircleIcon className="h-5 w-5" />
            new request
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">My Requests</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
          >
            + new request
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">
                    <span
  className={`capitalize font-medium ${
    r.status === 'approved' || r.status === 'it-approved'
      ? 'text-green-600'
      : r.status === 'pending'
      ? 'text-yellow-500'
      : r.status === 'manager-approved'
      ? 'text-blue-500'
      : r.status === 'rejected'
      ? 'text-red-500'
      : 'text-gray-500'
  }`}
>
  {r.status}
</span>

                  </td>
                  <td className="px-4 py-3">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Request</h3>

            {error && (
              <div className="bg-red-100 text-red-600 text-sm px-3 py-2 rounded mb-3">
                {error}
              </div>
            )}

            <select
              value={newRequest.type}
              onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
              className="w-full border p-2 rounded mb-3"
            >
              <option value="">Select Type</option>
              <option value="Access to CRM">Access to CRM</option>
              <option value="Access to a network folder">Access to a network folder</option>
              <option value="Access to VPN connection">Access to VPN connection</option>
            </select>

            <textarea
              placeholder="Request Description"
              value={newRequest.description}
              onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              className="w-full border p-2 rounded mb-4"
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyRequests
