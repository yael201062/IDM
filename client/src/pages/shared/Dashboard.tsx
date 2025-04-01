import React from 'react'
import {
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'

const DashboardPage: React.FC = () => {
  return (
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

      {/* Dashboard Stats */}
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
  )
}

export default DashboardPage

const StatBox = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="bg-white rounded-lg shadow p-4 text-center">
    <div className="text-3xl font-bold text-blue-600 mb-1">{title}</div>
    <div className="text-sm text-gray-600">{subtitle}</div>
  </div>
)

const PiePlaceholder = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-30" />
    <p className="text-xs mt-2 text-gray-600">{label}</p>
  </div>
)
