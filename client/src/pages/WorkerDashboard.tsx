import React from 'react';
import {
  HomeIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  BellIcon,
  PhoneIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const WorkerDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen font-sans">
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
            <SidebarItem label="My requests" icon={DocumentTextIcon} />
            <SidebarItem label="Notifications" icon={BellIcon} />
          </nav>
        </div>
        <div className="p-4 space-y-3 text-sm border-t border-gray-700">
          <SidebarItem label="Call Center" icon={PhoneIcon} />
          <SidebarItem label="Help" icon={QuestionMarkCircleIcon} />
          <SidebarItem label="Log Out" icon={ArrowLeftOnRectangleIcon} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white flex justify-between items-center p-6">
          <h1 className="text-xl font-semibold">Welcome back, xxx</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search here"
                className="rounded-full px-4 py-2 text-black pl-10"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-3 top-2.5" />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold">xxx</p>
                <p className="text-xs">xxxx</p>
              </div>
              <img
                src="/avatar.png"
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 grid grid-cols-2 gap-6">
          {/* My Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">My Information</h2>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xl rounded-xl p-4 mb-4">
              <p className="font-bold">Justin Biber</p>
              <p className="text-sm">123456789</p>
            </div>
            <div className="text-sm mb-4">
              <p className="text-gray-700">Position</p>
              <div className="flex flex-col gap-1 mt-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs w-fit">
                  technology
                </span>
                <span className="font-bold text-blue-600 text-sm">
                  full stack developer
                </span>
              </div>
              <p className="text-blue-500 mt-2 text-xs">Activated</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                <PencilSquareIcon className="h-5 w-5" />
                update info
              </button>
              <button className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                <PlusCircleIcon className="h-5 w-5" />
                new request
              </button>
            </div>
          </div>

          {/* Dashboard */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Dashboard</h2>

            <div className="grid grid-cols-3 gap-4">
              <StatBox title="7" subtitle="Vacation days" />
              <StatBox title="10" subtitle="Sick days" />
              <StatBox title="151" subtitle="Business hours" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <PiePlaceholder label="Used 70%" />
              <PiePlaceholder label="Used 40%" />
              <PiePlaceholder label="Cumulative hours 90%" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDashboard;

// Sidebar Item
const SidebarItem = ({
  label,
  icon: Icon,
  active = false,
}: {
  label: string;
  icon: React.ElementType;
  active?: boolean;
}) => (
  <div
    className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer ${
      active ? 'bg-blue-500 text-white' : 'hover:bg-gray-800 text-gray-300'
    }`}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </div>
);

// Stat Box
const StatBox = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="bg-white rounded-lg shadow p-4 text-center">
    <div className="text-3xl font-bold text-blue-600 mb-1">{title}</div>
    <div className="text-sm text-gray-600">{subtitle}</div>
  </div>
);

// Placeholder for Pie Chart
const PiePlaceholder = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-30" />
    <p className="text-xs mt-2 text-gray-600">{label}</p>
  </div>
);
