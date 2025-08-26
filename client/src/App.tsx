import React from 'react'
import LayoutSelector from './layouts/LayoutSelector'
import Dashboard from './pages/Dashboard'
import PersonalDetails from './pages/PersonalDetails'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Attendance from './pages/Attendance'
import MyRequests from './pages/MyRequests'
import MyEmployees from './pages/MyEmployees'
import EmployeeTable from './pages/EmployeeTable'
import PermissionsPage from './pages/PermissionsPage'
import RolesPage from './pages/Roles'
import ChangePassword from './pages/ChangePassword'
import ManagerNotifications from './pages/ManagerNotifications'
import Logout from './pages/Logout'
import ManagerDashboard from './pages/ManagerDashboard'

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-10 text-2xl">{title}</div>
)

const App: React.FC = () => {
  return (
    <Routes>
\      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route element={<LayoutSelector />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/my-employees" element={<MyEmployees />} />
        <Route path="/employees" element={<EmployeeTable />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/notifications" element={<ManagerNotifications />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="*" element={<Placeholder title="404 Not Found" />} />
      </Route>
    </Routes>
  )
}

export default App
