import {
    HomeIcon, UserIcon, ClockIcon, DocumentTextIcon, BellIcon,
    PhoneIcon, QuestionMarkCircleIcon, ArrowLeftOnRectangleIcon,
  } from '@heroicons/react/24/outline';
  import SidebarItem from '../components/SidebarItem';
  
  const WorkerSidebar = () => (
    <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between">
      <div>
        <div className="p-6 border-b border-gray-700">
          <img src="/idm-logo.png" alt="IDM" className="w-16 mx-auto mb-4" />
        </div>
        <nav className="p-4 space-y-4 text-sm">
          <SidebarItem label="Dashboard" icon={HomeIcon} to="/" />
          <SidebarItem label="Personal details" icon={UserIcon} to="/personal-details" />
          <SidebarItem label="Attendance" icon={ClockIcon} to="/attendance" />
          <SidebarItem label="My requests" icon={DocumentTextIcon} to="/my-requests" />
          {/* <SidebarItem label="Notifications" icon={BellIcon} to="/notifications" /> */}
        </nav>
      </div>
      <div className="p-4 space-y-3 text-sm border-t border-gray-700">
        <SidebarItem label="Log Out" icon={ArrowLeftOnRectangleIcon} to="/logout" />
      </div>
    </aside>
  );
  
  export default WorkerSidebar;
  