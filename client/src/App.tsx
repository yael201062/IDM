import React from 'react'
import LayoutSelector from './layouts/LayoutSelector'
import Dashboard from './pages/Dashboard'
import PersonalDetails from './pages/PersonalDetails'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Attendance from './pages/Attendance'
import MyRequests from './pages/MyRequests'
import MyEmployees from './pages/MyEmployees'
import EmployeeTable from './pages/EmployeeTable'
import PermissionsPage from './pages/PermissionsPage'
import RolesPage from './pages/Roles'
import ChangePassword from './pages/ChangePassword'
import ManagerNotifications from './pages/ManagerNotifications'


const Placeholder = ({ title }: { title: string }) => (
  <div className="p-10 text-2xl">{title}</div>
)

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route element={<LayoutSelector />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/my-employees" element={<MyEmployees />} />
        <Route path="/employees" element={<EmployeeTable />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/notifications" element={<ManagerNotifications />} />
        <Route path="/call-center" element={<Placeholder title="Call Center Page" />} />
        <Route path="/help" element={<Placeholder title="Help Page" />} />
        <Route path="/logout" element={<Placeholder title="Logged Out" />} />
        <Route path="*" element={<Placeholder title="404 Not Found" />} />
      </Route>
    </Routes>
  )
}

export default App
