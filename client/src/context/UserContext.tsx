import { createContext, useContext, useState, useEffect } from 'react'
import { ReactNode } from 'react'

export type UserRole = 'worker' | 'manager' | 'hr' | 'it'

interface User {
  name: string
  role: UserRole
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
      // כאן אפשר למשוך פרטים מהשרת אם צריך
    }
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    // אפשר להוסיף בקשת user info לפי הטוקן אם יש שרת כזה
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
