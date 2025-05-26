import { createContext, useContext, useState, useEffect } from 'react'
import { ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'

export type UserRole = 'worker' | 'manager' | 'hr' | 'it'

interface User {
  name: string
  role: UserRole
  email: string
}

interface UserContextType {
  user: User | null
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
})

export const useUser = () => useContext(UserContext)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadUserFromToken(savedToken)
    }
  }, [])

  const loadUserFromToken = async (t: string) => {
    try {
      const decoded: any = jwtDecode(t)
      const res = await fetch(`http://localhost:5000/api/employees/${decoded.empId}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      const data = await res.json()
      setUser({ name: data.name, role: data.role, email: data.email })
    } catch (err) {
      console.error('Failed to load user from token:', err)
      logout()
    }
  }

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    await loadUserFromToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <UserContext.Provider value={{ user, token, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}
