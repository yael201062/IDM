import React from 'react'
import { useUser } from '../context/UserContext'
import WorkerLayout from './WorkerLayout'
import ManagerLayout from './ManagerLayout'
import HRLayout from './HRLayout'
import ITLayout from './ITLayout'

const LayoutSelector: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { role } = useUser()

  const Layout = {
    worker: WorkerLayout,
    manager: ManagerLayout,
    hr: HRLayout,
    it: ITLayout,
  }[role] || WorkerLayout

  return <Layout>{children}</Layout>
}

export default LayoutSelector
