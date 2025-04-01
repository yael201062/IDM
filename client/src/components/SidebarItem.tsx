import React from 'react';
import { Link, useLocation } from 'react-router-dom';

type SidebarItemProps = {
  label: string;
  icon: React.ElementType;
  to: string;
};

const SidebarItem = ({ label, icon: Icon, to }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer ${
        isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-800 text-gray-300'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

export default SidebarItem;
