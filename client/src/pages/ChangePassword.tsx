import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      return setMessage('Passwords do not match')
    }

    try {
      const res = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('Password changed successfully! You can now log in.')
        navigate('/')
      } else {
        setMessage(data.error || 'Failed to change password.')
      }
    } catch (err) {
      setMessage('Error: ' + err)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>

        <input
          type="password"
          placeholder="New password"
          className="w-full mb-3 p-2 border rounded"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm password"
          className="w-full mb-3 p-2 border rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Update Password
        </button>

        {message && <p className="text-center text-sm mt-4 text-red-500">{message}</p>}
      </form>
    </div>
  )
}

export default ChangePassword
