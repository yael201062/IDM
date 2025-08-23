import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      // ננסה לקרוא תגובה (טקסט/JSON) גם כשיש שגיאה:
      const text = await res.text()
      let data: any = {}
      try { data = text ? JSON.parse(text) : {} } catch { data = { error: text } }

      if (!res.ok) {
        setError(data?.error || 'Invalid email or password')
        return
      }

      if (!data?.token) {
        setError('Malformed server response: missing token')
        return
      }

      await login(data.token)            // לשמור token בקונטקסט ול-localStorage
      if (data.mustChangePassword) {
        navigate('/change-password')
      } else {
        navigate('/')                    // הביתה
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-1/2 bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center text-white p-10">
        <img src="/idm-logo.png" alt="IDM Logo" className="w-48 mb-6" />
        <h1 className="text-4xl font-bold">IDM</h1>
      </div>

      <div className="w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold mb-2">Login</h2>
          <p className="mb-6 text-gray-500">Sign in to continue</p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-gray-600 mb-1">EMAIL:</label>
            <input
              type="email"
              placeholder="example@example.com"
              className="w-full mb-4 px-4 py-3 bg-gray-100 rounded-full outline-none"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="block text-sm text-gray-600 mb-1">PASSWORD:</label>
            <input
              type="password"
              placeholder="*************"
              className="w-full mb-2 px-4 py-3 bg-gray-100 rounded-full outline-none"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* <div className="text-right text-sm text-gray-500 mb-6">
              <Link to="/change-password" className="hover:underline">
                Forgot password?
              </Link>
            </div> */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold py-2 rounded-full hover:from-blue-500 hover:to-blue-700 transition disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
