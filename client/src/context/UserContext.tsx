import { createContext, useContext } from 'react'

export type UserRole = 'worker' | 'manager' | 'hr' | 'it'

interface User {
  name: string
  role: UserRole
}

const defaultUser: User = {
  name: 'John Doe',
  role: 'it',
}

export const UserContext = createContext<User>(defaultUser)
export const useUser = () => useContext(UserContext)
