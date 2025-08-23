import React, { useState } from 'react'
import { Search } from 'lucide-react' // או אייקון אחר

const employeesData = [
  {
    name: 'Justin Biber',
    id: '123456',
    role: 'Customer service',
    phone: '051-1111111',
    email: 'justin@example.com',
    start: '1/1/2025',
    end: '2/10/2025',
  },
  {
    name: 'Moran Gur',
    id: '234567',
    role: 'Marketing',
    phone: '051-1111111',
    email: 'moran@example.com',
    start: '13/9/2024',
    end: '',
  },
  {
    name: 'Gilad Dor',
    id: '957391',
    role: 'System',
    phone: '051-1111111',
    email: 'gilad@example.com',
    start: '2/1/1999',
    end: '',
  },
  {
    name: 'Mor Nissan',
    id: '456789',
    role: 'Security',
    phone: '051-1111111',
    email: 'mor@example.com',
    start: '3/3/2023',
    end: '',
  },
  {
    name: 'Yoram Levin',
    id: '2429471',
    role: 'business support',
    phone: '051-1111111',
    email: 'yoram@example.com',
    start: '1/1/2025',
    end: '10/4/2025',
  },
]

const MyEmployees: React.FC = () => {
  const [search, setSearch] = useState('')

  const filtered = employeesData.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">My Employees</h2>

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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Phone number</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Start date</th>
              <th className="px-4 py-3">End date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{emp.name}</td>
                <td className="px-4 py-3">{emp.id}</td>
                <td className="px-4 py-3">{emp.role}</td>
                <td className="px-4 py-3">{emp.phone}</td>
                <td className="px-4 py-3">{emp.email}</td>
                <td className="px-4 py-3">{emp.start}</td>
                <td className="px-4 py-3">{emp.end || '-'}</td>
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

export default MyEmployees
