import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WorkerLayout from './layouts/WorkerLayout';
import WorkerDashboard from './pages/WorkerDashboard';
import PersonalDetails from './pages/PersonalDetails';

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<WorkerLayout />}>
        <Route path="/" element={<WorkerDashboard />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
      </Route>
    </Routes>
  );
};

export default App;
