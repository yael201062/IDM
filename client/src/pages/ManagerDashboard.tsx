import React, { useEffect, useState } from 'react'

type KPI = {
  employees: number
  avgHoursPerWorkDay: number
  totalSickDays: number
  totalVacationDays: number
}
type Insight = {
  id: string
  title: string
  summary: string
  metric?: string
  severity: 'low' | 'medium' | 'high'
  recommendation?: string
}
type AiPayload = {
  kpis?: KPI
  insights: Insight[]
  answer: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://10.10.248.150:5000'

const SeverityBadge: React.FC<{ level: Insight['severity'] }> = ({ level }) => {
  const map: Record<Insight['severity'], string> = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${map[level]}`}>{level}</span>
}

const ManagerDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KPI | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [answer, setAnswer] = useState<string>('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async (query?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/ai/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch insights')

      const ai: AiPayload = data.ai || { insights: [], answer: '' }
      setKpis({
        employees: data.kpis?.employees ?? ai.kpis?.employees ?? 0,
        avgHoursPerWorkDay: data.kpis?.avgHoursPerWorkDay ?? ai.kpis?.avgHoursPerWorkDay ?? 0,
        totalSickDays: data.kpis?.totalSickDays ?? ai.kpis?.totalSickDays ?? 0,
        totalVacationDays: data.kpis?.totalVacationDays ?? ai.kpis?.totalVacationDays ?? 0,
      })
      setInsights(ai.insights || [])
      setAnswer(ai.answer || '')
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInsights() }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manager AI Dashboard</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask the AI — e.g., who has the most overtime?"
            className="border rounded px-3 py-2 text-sm w-80"
          />
          <button
            onClick={() => fetchInsights(q)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-gray-500 text-xs">Employees</div>
          <div className="text-2xl font-semibold">{kpis?.employees ?? '—'}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-gray-500 text-xs">Avg hours / workday</div>
          <div className="text-2xl font-semibold">{kpis?.avgHoursPerWorkDay ?? '—'}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-gray-500 text-xs">Sick days (30d)</div>
          <div className="text-2xl font-semibold">{kpis?.totalSickDays ?? '—'}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-gray-500 text-xs">Vacation days (30d)</div>
          <div className="text-2xl font-semibold">{kpis?.totalVacationDays ?? '—'}</div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">AI Insights</h2>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        {error && <div className="text-sm text-rose-600 mb-2">{error}</div>}
        {insights.length === 0 ? (
          <div className="text-sm text-gray-500">No insights to display yet.</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins) => (
              <li key={ins.id} className="border rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="font-medium">{ins.title}</div>
                  <SeverityBadge level={ins.severity} />
                </div>
                <div className="text-sm text-gray-700 mt-1">{ins.summary}</div>
                {ins.metric && <div className="text-xs text-gray-500 mt-1">Metric: {ins.metric}</div>}
                {ins.recommendation && <div className="text-xs mt-2">✅ {ins.recommendation}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Free-form answer */}
      {answer && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">AI Answer</h3>
          <div className="text-sm whitespace-pre-wrap">{answer}</div>
        </div>
      )}
    </div>
  )
}

export default ManagerDashboard
