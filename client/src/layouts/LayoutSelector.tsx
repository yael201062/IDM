import React from 'react'
import { useUser } from '../context/UserContext'
import WorkerLayout from './WorkerLayout'
import ManagerLayout from './ManagerLayout'
import HRLayout from './HRLayout'
import ITLayout from './ITLayout'


const LayoutSelector: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user } = useUser()

  if (!user) return <>{children}</> // או אפשרי: <div>Loading...</div>

  const LayoutComponent = {
    worker: WorkerLayout,
    manager: ManagerLayout,
    hr: HRLayout,
    it: ITLayout,
  }[user.role] || WorkerLayout

  return <LayoutComponent>{children}</LayoutComponent>
}

export default LayoutSelector
