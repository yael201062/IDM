import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const Header = () => {
  return (
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
  )
}

export default Header