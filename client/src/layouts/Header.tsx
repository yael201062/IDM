import React, { useEffect, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useUser } from '../context/UserContext'
import { jwtDecode } from 'jwt-decode'

type DecodedToken = {
  empId: string
  email: string
  exp: number
}

const Header: React.FC = () => {
  const { token } = useUser()
  const [name, setName] = useState<string>('User')
  const [email, setEmail] = useState<string>('user@domain.com')

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return
      try {
        const decoded: DecodedToken = jwtDecode(token)
        const res = await fetch(`http://localhost:5000/api/employees/${decoded.empId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()
        setName(data.name || 'User')
        setEmail(data.email || 'user@domain.com')
      } catch (err) {
        console.error('Failed to load user info', err)
      }
    }

    fetchUser()
  }, [token])

  return (
    <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white flex justify-between items-center p-6">
      <h1 className="text-xl font-semibold">Welcome back, {name}</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search here"
            className="rounded-full px-4 py-2 text-black pl-10"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-3 top-2.5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs">{email}</p>
          </div>
          <img
            src="/avatar.png"
            alt="User"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
