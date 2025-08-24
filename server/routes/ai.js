// routes/ai.js
const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai')
const Employee = require('../models/Employee')
const AttendanceRecord = require('../models/AttendanceRecord')

require('dotenv').config()

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY
const gemini = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

const cache = {
  last: null,
  ttlMs: 10 * 60 * 1000,
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Basic error classification for retry logic
const isRateLimit = (err) =>
  err?.status === 429 ||
  err?.code === 429 ||
  /RESOURCE_EXHAUSTED|rate limit/i.test(String(err?.message || ''))

const isQuota = (err) =>
  /quota|exceeded|insufficient/i.test(String(err?.message || ''))

// --- KPIs for last 30 days + name enrichment + per-employee breakdown (for dashboard) ---
async function fetchKPIs() {
  const now = new Date()
  const from = new Date(now); from.setDate(from.getDate() - 30)

  const employees = await Employee.countDocuments({ status: { $ne: 'Deactivated' } })

  const perEmp = await AttendanceRecord.aggregate([
    { $match: { date: { $gte: from, $lte: now } } },
    { $group: {
        _id: '$employeeId',
        workDays: { $sum: { $cond: [{ $eq: ['$type','work'] }, 1, 0] } },
        hours:    { $sum: '$hours' },
        sickDays: { $sum: { $cond: [{ $eq: ['$type','sick'] }, 1, 0] } },
        vacDays:  { $sum: { $cond: [{ $eq: ['$type','vacation'] }, 1, 0] } },
    } }
  ])

  const totals = perEmp.reduce((acc, r) => {
    acc.totalHours += r.hours || 0
    acc.totalWorkDays += r.workDays || 0
    acc.totalSickDays += r.sickDays || 0
    acc.totalVacationDays += r.vacDays || 0
    return acc
  }, { totalHours: 0, totalWorkDays: 0, totalSickDays: 0, totalVacationDays: 0 })

  const avgHoursPerWorkDay = totals.totalWorkDays
    ? Number((totals.totalHours / totals.totalWorkDays).toFixed(2))
    : 0

  // Overtime (hours above 9/day)
  const topOvertime = await AttendanceRecord.aggregate([
    { $match: { date: { $gte: from, $lte: now }, type: 'work' } },
    { $addFields: { overtime: { $max: [0, { $subtract: ['$hours', 9] }] } } },
    { $group: { _id: '$employeeId', overtimeHours: { $sum: '$overtime' }, totalHours: { $sum: '$hours' } } },
    { $sort: { overtimeHours: -1 } },
    { $limit: 5 }
  ])

  // Enrich names for all involved employees
  const ids = Array.from(new Set([
    ...perEmp.map(r => r._id),
    ...topOvertime.map(r => r._id),
  ]))
  const emps = await Employee.find({ id: { $in: ids } }, { id: 1, name: 1 }).lean()
  const nameMap = new Map(emps.map(e => [e.id, e.name]))

  const perEmployee = perEmp.map(r => ({
    employeeId: r._id,
    name: nameMap.get(r._id) || r._id,
    workDays: r.workDays || 0,
    hours: Number((r.hours || 0).toFixed(2)),
    avgHoursOnWorkDays: r.workDays ? Number(((r.hours || 0) / r.workDays).toFixed(2)) : 0,
    sickDays: r.sickDays || 0,
    vacationDays: r.vacDays || 0,
  }))

  const topOvertimeEnriched = topOvertime.map(r => ({
    employeeId: r._id,
    name: nameMap.get(r._id) || r._id,
    overtimeHours: Number((r.overtimeHours || 0).toFixed(2)),
    totalHours: Number((r.totalHours || 0).toFixed(2))
  }))

  return {
    period: { from, to: now },
    employees,
    avgHoursPerWorkDay,
    totalSickDays: totals.totalSickDays,
    totalVacationDays: totals.totalVacationDays,
    topOvertime: topOvertimeEnriched,
    perEmployee
  }
}

// --- Manager dashboard (server-side, no AI) ---
function buildDashboard(kpis) {
  const per = kpis.perEmployee || []

  const sortBy = (field, desc = true) =>
    [...per].sort((a, b) => desc ? (b[field] - a[field]) : (a[field] - b[field]))

  const pick = (arr, n = 5, fields = ['name']) =>
    arr.slice(0, n).map(x => {
      const out = {}
      for (const f of fields) out[f] = x[f]
      out.employeeId = x.employeeId
      return out
    })

  const mostHours = pick(sortBy('hours'), 5, ['name', 'hours', 'workDays', 'avgHoursOnWorkDays'])
  const mostWorkDays = pick(sortBy('workDays'), 5, ['name', 'workDays', 'hours'])
  const mostSickDays = pick(sortBy('sickDays'), 5, ['name', 'sickDays', 'workDays'])
  const mostVacationDays = pick(sortBy('vacationDays'), 5, ['name', 'vacationDays', 'workDays'])
  const overtime = (kpis.topOvertime || []).slice(0, 5)

  const highlights = []
  if (mostHours[0]) {
    highlights.push(`Top total hours: ${mostHours[0].name} with ${mostHours[0].hours}h in the last 30 days.`)
  }
  if (overtime[0]?.overtimeHours >= 15) {
    highlights.push(`${overtime[0].name} leads overtime (${overtime[0].overtimeHours}h OT). Consider load balancing.`)
  }
  if (kpis.avgHoursPerWorkDay >= 8.8) {
    highlights.push(`High average hours per workday: ${kpis.avgHoursPerWorkDay}h.`)
  }
  if (kpis.employees > 0) {
    const sickPerEmp = Number((kpis.totalSickDays / kpis.employees).toFixed(2))
    if (sickPerEmp >= 0.4) {
      highlights.push(`Average sick days per employee: ${sickPerEmp}.`)
    }
  }

  return {
    leaderboards: { mostHours, mostWorkDays, mostSickDays, mostVacationDays, overtime },
    highlights
  }
}

// --- Local (non-AI) fallback insights ---
function localFallback(kpis, userQuestion) {
  const insights = []
  const { employees, avgHoursPerWorkDay, totalSickDays, totalVacationDays, topOvertime } = kpis

  if (avgHoursPerWorkDay >= 8.8) {
    insights.push({
      id: 'avg_hours_high',
      title: 'High Average Hours',
      summary: `Average hours per workday is ${avgHoursPerWorkDay}h over the last 30 days.`,
      metric: `${avgHoursPerWorkDay}h`,
      severity: 'medium',
      recommendation: 'Review team workload and consider shift balancing.'
    })
  }

  if (employees > 0) {
    const sickPerEmp = Number((totalSickDays / employees).toFixed(2))
    if (sickPerEmp >= 0.4) {
      insights.push({
        id: 'sick_days',
        title: 'Notable Sick Leave',
        summary: `Avg ${sickPerEmp} sick days per employee in the last 30 days.`,
        metric: `${sickPerEmp} days/emp`,
        severity: 'medium',
        recommendation: 'Check seasonality/trends and consider flexible/hybrid work on peaks.'
      })
    }
  }

  const top3 = (topOvertime || []).slice(0, 3).map(t => `${t.name} (${t.overtimeHours}h OT)`).join(', ')
  if (top3) {
    const high = topOvertime[0]?.overtimeHours >= 15
    insights.push({
      id: 'top_overtime',
      title: 'Overtime Leaders',
      summary: `Top overtime: ${top3}.`,
      metric: topOvertime[0] ? `${topOvertime[0].overtimeHours}h` : null,
      severity: high ? 'high' : 'low',
      recommendation: 'Review task allocation/staffing for these employees.'
    })
  }

  if (totalVacationDays <= employees * 0.2) {
    insights.push({
      id: 'low_vacation',
      title: 'Low Vacation Utilization',
      summary: 'Vacation usage is relatively low in the last 30 days.',
      metric: `${totalVacationDays} days total`,
      severity: 'low',
      recommendation: 'Encourage planned time off to reduce burnout.'
    })
  }

  while (insights.length < 3) {
    insights.push({
      id: `fill_${insights.length}`,
      title: 'Data Availability',
      summary: 'No additional insights were detected from the current metrics.',
      metric: null,
      severity: 'low',
      recommendation: null
    })
  }

  const answer = userQuestion
    ? 'We hit a quota/AI issue. Showing locally computed insights.'
    : 'Showing locally computed insights.'

  return { insights, answer }
}

// --- JSON Schema (also used as Gemini responseSchema) ---
const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    kpis: {
      type: 'object',
      additionalProperties: false,
      properties: {
        employees: { type: 'number' },
        avgHoursPerWorkDay: { type: 'number' },
        totalSickDays: { type: 'number' },
        totalVacationDays: { type: 'number' }
      },
      required: ['employees','avgHoursPerWorkDay','totalSickDays','totalVacationDays']
    },
    insights: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' },
          metric: { type: ['string','null'] },
          severity: { type: 'string', enum: ['low','medium','high'] },
          recommendation: { type: ['string','null'] }
        },
        required: ['id','title','summary','metric','severity','recommendation']
      }
    },
    answer: { type: 'string' }
  },
  required: ['kpis','insights','answer']
}

// --- Map JSON Schema → Gemini SchemaType ---
function toGeminiSchema(s) {
  const mapType = (t) => {
    if (Array.isArray(t)) return SchemaType.STRING // string|null → force as STRING
    switch (t) {
      case 'object': return SchemaType.OBJECT
      case 'array': return SchemaType.ARRAY
      case 'string': return SchemaType.STRING
      case 'number': return SchemaType.NUMBER
      case 'integer': return SchemaType.INTEGER
      case 'boolean': return SchemaType.BOOLEAN
      case 'null': return SchemaType.NULL
      default: return SchemaType.STRING
    }
  }

  const out = { type: mapType(s.type) }
  if (s.description) out.description = s.description

  if (s.type === 'object') {
    out.properties = {}
    if (s.properties) {
      for (const [k, v] of Object.entries(s.properties)) {
        out.properties[k] = toGeminiSchema(v)
      }
    }
    if (s.required) out.required = s.required
  } else if (s.type === 'array') {
    out.items = toGeminiSchema(s.items)
  } else if (s.enum) {
    out.enum = s.enum
  }
  return out
}
const geminiResponseSchema = toGeminiSchema(schema)

// --- Call Gemini with smart retries ---
async function callGeminiWithRetry(kpis, userQuestion, maxRetries = 2) {
  if (!gemini) {
    return { ok: false, error: new Error('Missing GOOGLE_AI_API_KEY'), quota: true }
  }

  const model = gemini.getGenerativeModel({
    model: 'gemini-1.5-flash', // switch to 'gemini-1.5-pro' for richer wording
    systemInstruction: 'You are an HR ops analyst. Be concise and actionable.'
  })

  const prompt = [
    'Here are 30-day HR/attendance KPIs as JSON:',
    JSON.stringify(kpis),
    userQuestion ? `\nManager question: ${userQuestion}` : '',
    '\nGenerate 3–6 short insights. Keep each summary under 40 words. Use the schema.'
  ].join('\n')

  let attempt = 0
  let lastErr = null

  while (attempt <= maxRetries) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: geminiResponseSchema,
          temperature: 0.2,
        }
      })
      const text = result.response?.text() || ''
      const data = JSON.parse(text)
      return { ok: true, data, source: 'gemini' }
    } catch (err) {
      lastErr = err
      if (isQuota(err)) return { ok: false, error: err, quota: true }
      if (isRateLimit(err) && attempt < maxRetries) {
        const delay = Math.floor(800 * Math.pow(2, attempt) + Math.random() * 300)
        await sleep(delay)
        attempt++
        continue
      }
      break
    }
  }
  return { ok: false, error: lastErr, quota: false }
}

router.post('/insights', async (req, res) => {
  try {
    const userQuestion = (req.body?.query || '').toString().slice(0, 2000)

    // Serve from cache if fresh and no new question
    if (!userQuestion && cache.last && (Date.now() - cache.last.at < cache.ttlMs)) {
      return res.json({
        ok: true,
        kpis: cache.last.payload.kpis,
        dashboard: cache.last.payload.dashboard,
        ai: cache.last.payload.ai,
        meta: { source: 'cache' }
      })
    }

    const kpis = await fetchKPIs()
    const dashboard = buildDashboard(kpis)

    if (!GEMINI_API_KEY) {
      const ai = localFallback(kpis, userQuestion)
      const payload = { kpis, dashboard, ai }
      cache.last = { at: Date.now(), payload }
      return res.json({ ok: true, ...payload, meta: { source: 'fallback', reason: 'no_api_key' } })
    }

    const result = await callGeminiWithRetry(kpis, userQuestion, 2)

    if (result.ok) {
      const ai = result.data
      const payload = { kpis, dashboard, ai }
      cache.last = { at: Date.now(), payload }
      return res.json({ ok: true, ...payload, meta: { source: result.source } })
    }

    // Fallback after retries/quota issues
    const ai = localFallback(kpis, userQuestion)
    const payload = { kpis, dashboard, ai }
    cache.last = { at: Date.now(), payload }
    return res.json({
      ok: true,
      ...payload,
      meta: { source: 'fallback', reason: result.quota ? 'insufficient_quota' : 'retry_failed' }
    })
  } catch (err) {
    console.error('AI insights failed (catch-all):', err)
    res.status(500).json({ ok:false, error: 'AI insights failed (server)' })
  }
})

module.exports = router
