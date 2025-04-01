import React, { useState } from 'react'

type PermissionGroup = {
  ad: string[]
  netapp: string[]
  systems: string[]
  mailbox: string
}

type RoleName =
  | 'Full Stack Developer'
  | 'QA Engineer'
  | 'IT Support Specialist'
  | 'Operations Manager'

const roles: RoleName[] = [
  'Full Stack Developer',
  'QA Engineer',
  'IT Support Specialist',
  'Operations Manager',
]

const permissionsData: Record<RoleName, PermissionGroup> = {
  'IT Support Specialist': {
    ad: [
      'Domain Admins',
      'SafeQPrinters',
      'Administrators',
      'Account Operators',
      'Server Operators',
      'Remote Desktop',
      'Exchange Admins',
    ],
    netapp: [
      '\\\\netapp\\support',
      '\\\\netapp\\apps',
      '\\\\netapp\\IT_Doc',
      '\\\\netapp\\ServerBackup',
      '\\\\netapp\\support\\logs',
      '\\\\netapp\\scripts',
      '\\\\netapp\\LicenseKeys',
    ],
    systems: ['CRM', 'ERP', 'Exchange', 'NetAce', 'SafeNet', 'Service Desk'],
    mailbox: 'E3',
  },
  'Full Stack Developer': {
    ad: ['Domain Users', 'Developers'],
    netapp: ['\\netapp\\dev', '\\netapp\\test'],
    systems: ['CRM', 'ERP'],
    mailbox: 'E3',
  },
  'QA Engineer': {
    ad: ['Domain Users', 'QA'],
    netapp: ['\\netapp\\qa'],
    systems: ['CRM', 'ERP'],
    mailbox: 'E3',
  },
  'Operations Manager': {
    ad: ['Domain Users', 'Managers'],
    netapp: ['\\netapp\\ops'],
    systems: ['CRM', 'ERP'],
    mailbox: 'E3',
  },
}

const PermissionsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleName>('IT Support Specialist')

  const permissions = permissionsData[selectedRole]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Side */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Manage Permissions</h2>

        <label className="block text-sm font-medium text-gray-600 mb-2">Choose Role</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as RoleName)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">choose role</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <ul className="mt-4 space-y-2 text-sm">
          {roles.map((role) => (
            <li
              key={role}
              className={`p-2 rounded cursor-pointer ${
                role === selectedRole
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedRole(role)}
            >
              {role}
            </li>
          ))}
        </ul>
      </div>

      {/* Right Side */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Permissions</h2>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedRole}</h3>
        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full mb-4 inline-block">
          current permissions
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <p className="font-medium text-gray-600 mb-1">Active Directory:</p>
            <ul className="space-y-1">
              {permissions.ad.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">NetApp:</p>
            <ul className="space-y-1">
              {permissions.netapp.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Systems:</p>
            <ul className="space-y-1">
              {permissions.systems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-2">
          <strong>Mailbox Licence:</strong> {permissions.mailbox}
        </p>

        <div className="flex gap-2 mt-6">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Edit
          </button>
          <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-200">
            History
          </button>
        </div>
      </div>
    </div>
  )
}

export default PermissionsPage
