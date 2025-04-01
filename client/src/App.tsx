import React from 'react'
import LayoutSelector from './layouts/LayoutSelector'
import Dashboard from './pages/Dashboard'
import PersonalDetails from './pages/PersonalDetails'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import WorkerLayout from './layouts/WorkerLayout'

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-10 text-2xl">{title}</div>
)

const App: React.FC = () => {
  return (
    <Routes>
      {/* Login route מחוץ ל-layout */}
      <Route path="/login" element={<Login />} />

      {/* Routes עם תפריט צד ולייאאוט */}
      <Route element={<WorkerLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
        <Route path="/attendance" element={<Placeholder title="Attendance Page" />} />
        <Route path="/my-requests" element={<Placeholder title="My Requests Page" />} />
        <Route path="/notifications" element={<Placeholder title="Notifications Page" />} />
        <Route path="/call-center" element={<Placeholder title="Call Center Page" />} />
        <Route path="/help" element={<Placeholder title="Help Page" />} />
        <Route path="/logout" element={<Placeholder title="Logged Out" />} />
        <Route path="*" element={<Placeholder title="404 Not Found" />} />
      </Route>
    </Routes>
  )
}

export default App
