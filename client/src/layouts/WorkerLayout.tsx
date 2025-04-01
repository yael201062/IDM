import { Outlet } from 'react-router-dom';
import WorkerSidebar from '../components/WorkerSidebar';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const WorkerLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <WorkerSidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white flex justify-between items-center p-6">
          <h1 className="text-xl font-semibold">Welcome back, Justin</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search here"
                className="rounded-full px-4 py-2 text-black pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold">Justin Biber</p>
                <p className="text-xs">Full Stack Developer</p>
              </div>
              <img
                src="/avatar.png" 
                alt="User Profile"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatar.png';
                  (e.target as HTMLImageElement).className = 'w-10 h-10 rounded-full border-2 border-white bg-blue-400 flex items-center justify-center text-white font-bold';
                  (e.target as HTMLImageElement).textContent = 'JB';
                }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkerLayout;