import React, { useState } from 'react'
import { Search } from 'lucide-react'

export type RoleName =
  | 'Full Stack Developer'
  | 'QA Engineer'
  | 'IT Support Specialist'
  | 'Operations Manager'


type Role = {
  name: RoleName
  users: number
  license: string
  department: string
  created: string
}

const rolesData: Role[] = [
  {
    name: 'Full Stack Developer',
    users: 12,
    license: 'E3',
    department: 'Development',
    created: '1/1/2023',
  },
  {
    name: 'QA Engineer',
    users: 8,
    license: 'E3',
    department: 'QA',
    created: '20/2/2023',
  },
  {
    name: 'IT Support Specialist',
    users: 20,
    license: 'E3',
    department: 'IT',
    created: '5/5/2023',
  },
  {
    name: 'Operations Manager',
    users: 6,
    license: 'Plan 2',
    department: 'Operations',
    created: '15/3/2023',
  },
]

const RolesPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const filtered = rolesData.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Roles</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm flex items-center gap-2">
          <span>New Role</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search here"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-full w-full max-w-xs text-sm"
        />
        <button className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600">
          <Search size={18} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Number of users</th>
              <th className="px-4 py-3">Mail licensing</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Creation date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((role, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{role.name}</td>
                <td className="px-4 py-3">{role.users}</td>
                <td className="px-4 py-3">{role.license}</td>
                <td className="px-4 py-3">{role.department}</td>
                <td className="px-4 py-3">{role.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4">
        <button className="text-gray-500 hover:text-gray-700 text-xs underline">
          Show more
        </button>
      </div>
    </div>
  )
}

export default RolesPage
