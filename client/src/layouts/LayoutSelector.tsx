import React from 'react'
import { useUser } from '../context/UserContext'
import WorkerLayout from './WorkerLayout'
import ManagerLayout from './ManagerLayout'
import HRLayout from './HRLayout'
import ITLayout from './ITLayout'
import { Outlet } from 'react-router-dom'

const LayoutSelector: React.FC = () => {
  const { user } = useUser()

  if (!user) return <div>Loading...</div>

  const LayoutComponent = {
    worker: WorkerLayout,
    manager: ManagerLayout,
    hr: HRLayout,
    it: ITLayout,
  }[user.systemRole] || WorkerLayout

  return (
    <LayoutComponent>
      <Outlet />
    </LayoutComponent>
  )
}

export default LayoutSelector
