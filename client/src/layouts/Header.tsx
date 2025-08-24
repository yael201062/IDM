import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useUser } from '../context/UserContext'
import { jwtDecode } from 'jwt-decode'

type DecodedToken = {
  empId: string
  email: string
  exp: number
}

type EmployeeHit = {
  _id: string
  name: string
  id: string
  email?: string
  role?: string
  systemRole?: string
}

type RoleHit = {
  _id: string
  name: string
  department?: string
}

type PermissionDoc = {
  roleId: string
  roleName: string
  adGroups: string[]
}

type SearchResults = {
  employees: EmployeeHit[]
  roles: RoleHit[]
  adGroups: { group: string; roleName: string }[]
}

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:5000/api'

const Header: React.FC = () => {
  const { token } = useUser()
  const [name, setName] = useState<string>('User')
  const [email, setEmail] = useState<string>('user@domain.com')

  // --- חיפוש כללי ---
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResults>({
    employees: [],
    roles: [],
    adGroups: [],
  })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const debounceMs = 300

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  // פרטי משתמש (כפי שהיה)
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return
      try {
        const decoded: DecodedToken = jwtDecode(token)
        const res = await fetch(`${API_BASE}/employees/${decoded.empId}`, {
          headers: { ...authHeaders },
        })
        const data = await res.json()
        setName(data.name || 'User')
        setEmail(data.email || 'user@domain.com')
      } catch (err) {
        console.error('Failed to load user info', err)
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // סגירה בלחיצה מחוץ לתיבת התוצאות
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node
      if (boxRef.current && boxRef.current.contains(t)) return
      if (inputRef.current && inputRef.current.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // חיפוש מושהה (debounce)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ employees: [], roles: [], adGroups: [] })
      setOpen(false)
      setError(null)
      return
    }

    const handle = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        // Employees — נביא את כולם (לפי הרשאות השרת) ואז נסנן בצד לקוח
        const [employeesRes, rolesRes, permsRes] = await Promise.all([
          fetch(`${API_BASE}/employees?all=1`, { headers: { ...authHeaders } }).catch(() => null),
          fetch(`${API_BASE}/roles`, { headers: { ...authHeaders } }).catch(() => null),
          fetch(`${API_BASE}/permissions`, { headers: { ...authHeaders } }).catch(() => null),
        ])

        const [employeesData, rolesData, permsData] = await Promise.all([
          employeesRes?.ok ? employeesRes.json() : [],
          rolesRes?.ok ? rolesRes.json() : [],
          permsRes?.ok ? permsRes.json() : [],
        ])

        const q = query.trim().toLowerCase()

        const employees: EmployeeHit[] = (Array.isArray(employeesData) ? employeesData : [])
          .filter((e: any) => {
            const hay = [
              String(e?.name || ''),
              String(e?.id || ''),
              String(e?.email || ''),
              String(e?.role || ''),
              String(e?.systemRole || ''),
            ]
              .join(' ')
              .toLowerCase()
            return hay.includes(q)
          })
          .slice(0, 8)

        const roles: RoleHit[] = (Array.isArray(rolesData) ? rolesData : [])
          .filter((r: any) => {
            const hay = [String(r?.name || ''), String(r?.department || '')].join(' ').toLowerCase()
            return hay.includes(q)
          })
          .slice(0, 8)

        const adGroups: { group: string; roleName: string }[] = (Array.isArray(permsData) ? permsData : [])
          .flatMap((p: PermissionDoc) =>
            (p?.adGroups || []).map((g: string) => ({ group: String(g || ''), roleName: String(p?.roleName || '') }))
          )
          .filter((g) => g.group.toLowerCase().includes(q) || g.roleName.toLowerCase().includes(q))
          .slice(0, 10)

        setResults({ employees, roles, adGroups })
        setOpen(true)
      } catch (e) {
        console.error('Global search failed', e)
        setError('Search failed')
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, authHeaders])

  return (
    <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white flex justify-between items-center p-6">
      <h1 className="text-xl font-semibold">Welcome back, {name}</h1>

      <div className="flex items-center gap-4">
        <div className="relative" ref={boxRef}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search here"
            className="rounded-full px-4 py-2 text-black pl-10 w-72"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if ((results.employees.length || results.roles.length || results.adGroups.length) && query.length >= 2) {
                setOpen(true)
              }
            }}
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-3 top-2.5" />

          {/* תיבת תוצאות */}
          {open && (
            <div className="absolute mt-2 w-[28rem] right-0 z-50 rounded-xl bg-white text-black shadow-xl border border-gray-200">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="text-sm">
                  {loading ? 'Searching…' : error ? <span className="text-red-600">{error}</span> : `Results for "${query}"`}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-96 overflow-auto p-3 space-y-4">
                {/* Employees */}
                <section>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Employees</div>
                  {results.employees.length === 0 ? (
                    <div className="text-xs text-gray-400 px-1">No matching employees</div>
                  ) : (
                    <ul className="space-y-1">
                      {results.employees.map((e) => (
                        <li key={e._id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{e.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {e.id} • {e.email || '-'} {e.role ? `• ${e.role}` : ''}
                            </div>
                          </div>
                          <a
                            href="/employees" // 👈 אפשר להחליף לניווט ייעודי אם יש
                            className="text-xs text-blue-600 hover:underline shrink-0"
                          >
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Roles */}
                <section>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Roles</div>
                  {results.roles.length === 0 ? (
                    <div className="text-xs text-gray-400 px-1">No matching roles</div>
                  ) : (
                    <ul className="space-y-1">
                      {results.roles.map((r) => (
                        <li key={r._id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{r.name}</div>
                            <div className="text-xs text-gray-500 truncate">{r.department || '-'}</div>
                          </div>
                          <a href="/roles" className="text-xs text-blue-600 hover:underline shrink-0">
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* AD Groups */}
                <section>
                  <div className="text-xs font-semibold text-gray-500 mb-2">AD Groups</div>
                  {results.adGroups.length === 0 ? (
                    <div className="text-xs text-gray-400 px-1">No matching groups</div>
                  ) : (
                    <ul className="space-y-1">
                      {results.adGroups.map((g, i) => (
                        <li key={g.group + i} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{g.group}</div>
                            <div className="text-xs text-gray-500 truncate">Role: {g.roleName || '-'}</div>
                          </div>
                          <a href="/permissions" className="text-xs text-blue-600 hover:underline shrink-0">
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs">{email}</p>
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
