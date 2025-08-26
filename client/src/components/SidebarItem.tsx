import React from 'react'
import { Link, useLocation } from 'react-router-dom'

type SidebarItemProps = {
  label: string
  icon: React.ElementType
  to: string
}

const SidebarItem = ({ label, icon: Icon, to }: SidebarItemProps) => {
  const location = useLocation()

  // ✅ תיקון: אם מעבירים "/" (לוח בקרה), ננווט ל־/dashboard
  const resolvedTo = to === '/' ? '/dashboard' : to

  // קצת יותר סובלני: פעיל גם אם אנחנו בנתיב צאצא של הדף
  const isActive =
    location.pathname === resolvedTo ||
    (resolvedTo !== '/' && location.pathname.startsWith(resolvedTo + '/'))

  return (
    <Link
      to={resolvedTo}
      className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition-colors ${
        isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-800 text-gray-300'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  )
}

export default SidebarItem
