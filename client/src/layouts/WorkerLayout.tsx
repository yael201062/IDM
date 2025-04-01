import React from 'react';
import WorkerSidebar from '../components/WorkerSidebar';
import { Outlet } from 'react-router-dom';

const WorkerLayout = () => {
  return (
    <div className="flex min-h-screen font-sans">
      <WorkerSidebar />
      <main className="flex-1 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default WorkerLayout;
