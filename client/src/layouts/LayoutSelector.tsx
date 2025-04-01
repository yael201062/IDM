import React from 'react'
import { useUser } from '../context/UserContext'
import WorkerLayout from './WorkerLayout'
import ManagerLayout from './ManagerLayout'
import HRLayout from './HRLayout'
import ITLayout from './ITLayout'
import { Outlet } from 'react-router-dom'

const LayoutSelector: React.FC = () => {
  const { role } = useUser()

  const Layout = {
    worker: WorkerLayout,
    manager: ManagerLayout,
    hr: HRLayout,
    it: ITLayout,
  }[role] || WorkerLayout

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default LayoutSelector
