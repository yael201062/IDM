import React, { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import SidebarItem from '../components/SidebarItem'

import {
  HomeIcon,
  UserIcon,
  ClockIcon,
  FolderIcon,
  BellIcon,
  TableCellsIcon,
  LockClosedIcon,
  IdentificationIcon,
  PhoneIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

interface Props {
  children?: ReactNode
}

const ITLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-gray-700">
            <img src="/idm-logo.png" alt="IDM" className="w-16 mx-auto mb-4" />
          </div>
          <nav className="p-4 space-y-4 text-sm">
            <SidebarItem label="Dashboard" icon={HomeIcon} to="/" />
            <SidebarItem label="Personal details" icon={UserIcon} to="/personal-details" />
            <SidebarItem label="Attendance" icon={ClockIcon} to="/attendance" />
            <SidebarItem label="My requests" icon={FolderIcon} to="/my-requests" />
            <SidebarItem label="Notifications" icon={BellIcon} to="/notifications" />
            <SidebarItem label="Employees Table" icon={TableCellsIcon} to="/employees" />
            <SidebarItem label="Permissions" icon={LockClosedIcon} to="/permissions" />
            <SidebarItem label="Roles" icon={IdentificationIcon} to="/roles" />
          </nav>
        </div>
        <div className="p-4 space-y-3 text-sm border-t border-gray-700">
          <SidebarItem label="Call Center" icon={PhoneIcon} to="/call-center" />
          <SidebarItem label="Help" icon={QuestionMarkCircleIcon} to="/help" />
          <SidebarItem label="Log Out" icon={ArrowRightOnRectangleIcon} to="/logout" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default ITLayout
