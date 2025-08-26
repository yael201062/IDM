import React, { useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

type AttendanceEntry = {
  date: string            // YYYY-MM-DD
  start: string           // HH:MM (24h) or ''
  end: string             // HH:MM (24h) or ''
  type: 'work' | 'vacation' | 'sick'
  hasSaved?: boolean      // קיימת רשומה היסטורית ליום הזה
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://10.10.248.150:5000'

const Attendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [page, setPage] = useState(1)
  const rowsPerPage = 15

  const paginated = attendance.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const totalPages = Math.max(1, Math.ceil(attendance.length / rowsPerPage))

  // ---------- helpers ----------
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN
    return h * 60 + m
  }

  const calcHours = (start: string, end: string) => {
    if (!start || !end) return 0
    const s = toMinutes(start)
    const e = toMinutes(end)
    if (Number.isNaN(s) || Number.isNaN(e)) return 0
    return Math.max(0, (e - s) / 60)
  }

  const normalizeYMD = (s: string | undefined | null): string => {
    if (!s) return ''
    const t = s.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
    let m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) {
      const [, dd, mm, yyyy] = m
      return `${yyyy}-${mm}-${dd}`
    }
    m = t.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (m) {
      const [, dd, mm, yyyy] = m
      return `${yyyy}-${mm}-${dd}`
    }
    const d = new Date(t)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    return ''
  }

  const buildDateRange = (startYmd: string): string[] => {
    const todayYmd = new Date().toISOString().split('T')[0]
    const [sy, sm, sd] = startYmd.split('-').map(Number)
    const [ty, tm, td] = todayYmd.split('-').map(Number)

    const start = new Date(Date.UTC(sy, sm - 1, sd))
    const end   = new Date(Date.UTC(ty, tm - 1, td))

    const out: string[] = []
    if (isNaN(start.getTime())) return [todayYmd]
    if (start > end) return [todayYmd]

    const cur = new Date(start)
    while (cur <= end) {
      out.push(cur.toISOString().split('T')[0])
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    return out
  }

  // שגיאה לשורה – מחושב בזמן רינדור
  const rowError = (e: AttendanceEntry): string | '' => {
    // סוף לפני/שווה התחלה – תמיד שגיאה כשהזמנים מולאו
    if (e.start && e.end && toMinutes(e.end) <= toMinutes(e.start)) {
      return 'End must be after start'
    }
    // חובה למלא שעות רק ביום עבודה חדש (ללא היסטוריה)
    if (e.type === 'work' && !e.hasSaved && (!e.start || !e.end)) {
      return 'Required: start & end'
    }
    return ''
  }

  const hasAnyErrors = useMemo(
    () => attendance.some((e) => rowError(e)),
    [attendance]
  )

  // ---------- handlers ----------
  const handleChange = <K extends keyof AttendanceEntry>(
    indexOnPage: number,
    field: K,
    value: AttendanceEntry[K]
  ) => {
    const globalIndex = (page - 1) * rowsPerPage + indexOnPage
    setAttendance(prev => {
      const updated = [...prev]
      updated[globalIndex] = { ...updated[globalIndex], [field]: value } as AttendanceEntry
      return updated
    })
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const decoded: any = jwtDecode(token)
    const empId = decoded.empId || decoded.employeeId || decoded.id || decoded.userId || decoded.sub
    if (!empId) {
      alert('Cannot find employee id in token')
      return
    }

    setLoading(true)
    try {
      // נשמור: חופשה/מחלה תמיד; ימי עבודה רק אם מולאו שעות
      const toSave = attendance.filter(e =>
        e.type !== 'work' || (e.start && e.end)
      )

      const failures: Array<{date:string; status:number; msg:string}> = []

      for (const entry of toSave) {
        const hours = calcHours(entry.start, entry.end)
        const res = await fetch(`${API_BASE}/api/attendance/${empId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: entry.date,
            start: entry.start || '',
            end: entry.end || '',
            type: entry.type,
            hours,
          }),
        })
        if (!res.ok) {
          let msg = ''
          try { msg = await res.text() } catch {}
          failures.push({ date: entry.date, status: res.status, msg })
        }
      }

      if (failures.length) {
        console.error('Rows failed to save:', failures)
        alert(`Failed to save ${failures.length} row(s). Check console.`)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await reload()
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save attendance')
    } finally {
      setLoading(false)
    }
  }

  // ---------- data load ----------
  const reload = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const decoded: any = jwtDecode(token)
    const empId = decoded.empId || decoded.employeeId || decoded.id || decoded.userId || decoded.sub
    if (!empId) return

    // עובד (בשביל start כמחרוזת)
    const resEmp = await fetch(`${API_BASE}/api/employees/${empId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resEmp.ok) throw new Error('Failed to load employee')
    const emp = await resEmp.json()

    const startYmd = normalizeYMD(emp.start) || new Date().toISOString().split('T')[0]
    const days = buildDateRange(startYmd)

    const defaults: AttendanceEntry[] = days.map((ymd) => ({
      date: ymd,
      start: '',
      end: '',
      type: 'work',
      hasSaved: false,
    }))

    const resHist = await fetch(`${API_BASE}/api/attendance/history/${empId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resHist.ok) throw new Error('Failed to load history')
    const historyRaw = await resHist.json()

    const history = (historyRaw || []).map((h: any) => {
      const ymd = normalizeYMD(h.date)

      // ✨ שינוי: חילוץ HH:MM ישירות מהמחרוזת (נמנעים מהסטות טיימזון)
      const toHHmm = (v: any) => {
        if (!v) return ''
        const s = String(v)
        if (/^\d{2}:\d{2}$/.test(s)) return s
        const iso = s.match(/T(\d{2}):(\d{2})/)
        if (iso) return `${iso[1]}:${iso[2]}`
        const d = new Date(s)
        return isNaN(d.getTime())
          ? ''
          : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
      }

      return {
        date: ymd,
        start: toHHmm(h.start),
        end: toHHmm(h.end),
        type: (h.type as 'work' | 'vacation' | 'sick') || 'work',
        hasSaved: true,
      } as AttendanceEntry
    })

    // מיזוג: היסטוריה גוברת
    const merged = defaults.map((row) => {
      const found = history.find((h: AttendanceEntry) => h.date === row.date)
      return found ? { ...row, ...found } : row
    })

    // סדר: החדשים למעלה
    setAttendance([...merged].reverse())
    setPage(1)
  }

  useEffect(() => {
    ;(async () => {
      try {
        await reload()
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  // ---------- render ----------
  return (
    <div className="relative bg-white p-6 rounded-lg shadow-md">
      {success && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow">
          Attendance saved successfully!
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Attendance Log</h2>
        <button
          onClick={handleSave}
         // disabled={loading || hasAnyErrors}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((entry, idxOnPage) => {
              const hours = Math.round(calcHours(entry.start, entry.end) * 100) / 100
              const errorMsg = rowError(entry)
              const highlight = !!errorMsg && (entry.type === 'work')

              return (
                <tr
                  key={(page - 1) * rowsPerPage + idxOnPage}
                  className={"border-b hover:bg-gray-50 " + (highlight ? "bg-red-50/40" : "")}
                >
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={entry.date}
                      onChange={(e) => handleChange(idxOnPage, 'date', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      lang="en-US"      /* ✨ AM/PM */
                      step={60}         /* ✨ דקות בלבד */
                      className={
                        "w-full border rounded px-2 py-1 text-sm " +
                        (highlight && !entry.start ? "border-red-400 bg-red-50" : "")
                      }
                      value={entry.start}
                      onChange={(e) => handleChange(idxOnPage, 'start', e.target.value)}
                      placeholder={highlight && !entry.start ? 'required' : ''}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      lang="en-US"      /* ✨ AM/PM */
                      step={60}         /* ✨ דקות בלבד */
                      className={
                        "w-full border rounded px-2 py-1 text-sm " +
                        (highlight && !entry.end ? "border-red-400 bg-red-50" : "")
                      }
                      value={entry.end}
                      onChange={(e) => handleChange(idxOnPage, 'end', e.target.value)}
                      placeholder={highlight && !entry.end ? 'required' : ''}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={entry.type}
                      onChange={(e) =>
                        handleChange(idxOnPage, 'type', e.target.value as AttendanceEntry['type'])
                      }
                    >
                      <option value="work">Work</option>
                      <option value="vacation">Vacation</option>
                      <option value="sick">Sick</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">{hours}h</td>
                  <td className="px-4 py-3 text-red-500 text-xs">{errorMsg}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex justify-end items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Attendance
