import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LayoutSelector from './layouts/LayoutSelector'
import Dashboard from './pages/shared/Dashboard'
import PersonalDetails from './pages/shared/PersonalDetails'

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<LayoutSelector />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
      </Route>
    </Routes>
  )
}

export default App
