import React, { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'

interface Request {
  _id: string
  type: string
  description: string
  status: string
  createdAt: string
  employeeId: string
}

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:5000/api' // ✅ חדש

const ManagerNotifications: React.FC = () => {
  const { user } = useUser()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ✅ חדש: הפקת כותרות עם Authorization תמיד
  const authHeaders = (): Record<string, string> => {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      ''
    const h: Record<string, string> = {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/requests/for-manager`, {
        headers: { ...authHeaders() },
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('GET /requests/for-manager failed:', res.status, txt)
        setRequests([])
        setError('Failed to load requests')
        return
      }
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load requests')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`${API_BASE}/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(), // ✅ שינוי
        },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error('Failed to update status')
      const updated = await res.json()

      setRequests((prev) => prev.filter((r) => r._id !== updated._id))
    } catch (err) {
      alert('Error updating status')
      console.error(err)
    }
  }

  if (loading) return <div className="p-6">Loading requests...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
      {requests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white text-sm shadow rounded-lg">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{req.employeeId}</td>
                  <td className="px-4 py-3">{req.type}</td>
                  <td className="px-4 py-3">{req.description}</td>
                  <td className="px-4 py-3">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleAction(req._id, 'approved')}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(req._id, 'rejected')}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ManagerNotifications
