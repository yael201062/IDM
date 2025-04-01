import React, { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

import {
  HomeIcon,
  UserIcon,
  ClockIcon,
  FolderIcon,
  BellIcon,
  UsersIcon,
  PhoneIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

interface Props {
  children?: ReactNode
}

const ManagerLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-gray-700">
            <img src="/idm-logo.png" alt="IDM" className="w-16 mx-auto mb-4" />
          </div>
          <nav className="p-4 space-y-4 text-sm">
            <SidebarItem label="Dashboard" icon={HomeIcon} active />
            <SidebarItem label="Personal details" icon={UserIcon} />
            <SidebarItem label="Attendance" icon={ClockIcon} />
            <SidebarItem label="My requests" icon={FolderIcon} />
            <SidebarItem label="Notifications" icon={BellIcon} />
            <SidebarItem label="My employees" icon={UsersIcon} />
          </nav>
        </div>
        <div className="p-4 space-y-3 text-sm border-t border-gray-700">
          <SidebarItem label="Call Center" icon={PhoneIcon} />
          <SidebarItem label="Help" icon={QuestionMarkCircleIcon} />
          <SidebarItem label="Log Out" icon={ArrowRightOnRectangleIcon} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default ManagerLayout

const SidebarItem = ({
  label,
  icon: Icon,
  active = false,
}: {
  label: string
  icon: React.ElementType
  active?: boolean
}) => (
  <div
    className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer ${
      active ? 'bg-blue-500 text-white' : 'hover:bg-gray-800 text-gray-300'
    }`}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </div>
)
