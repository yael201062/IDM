// routes/ai.js
const express = require('express')
const router = express.Router()
const OpenAI = require('openai') // npm i openai@latest
const Employee = require('../models/Employee')
const AttendanceRecord = require('../models/AttendanceRecord')

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY})

// --- קאשינג בזיכרון כדי לא לרוץ כל פעם ל-AI ---
const cache = {
  last: null,          // { at: Date, payload: any }
  ttlMs: 10 * 60 * 1000 // 10 דקות
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const isRateLimit = (err) =>
  err?.status === 429 && err?.error?.code !== 'insufficient_quota'

const isQuota = (err) =>
  err?.status === 429 && (err?.error?.code === 'insufficient_quota' || err?.code === 'insufficient_quota')

// --- KPIs בסיסיים ל-30 יום + העשרה בשמות לטופ אוברטיים ---
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

  const totals = perEmp.reduce((acc,r) => {
    acc.totalHours += r.hours || 0
    acc.totalWorkDays += r.workDays || 0
    acc.totalSickDays += r.sickDays || 0
    acc.totalVacationDays += r.vacDays || 0
    return acc
  }, { totalHours:0, totalWorkDays:0, totalSickDays:0, totalVacationDays:0 })

  const avgHoursPerWorkDay = totals.totalWorkDays ? Number((totals.totalHours / totals.totalWorkDays).toFixed(2)) : 0

  // Top overtime (הגדרה פשוטה: שעות מעל 9 ביום)
  const topOvertime = await AttendanceRecord.aggregate([
    { $match: { date: { $gte: from, $lte: now }, type: 'work' } },
    { $addFields: { overtime: { $max: [0, { $subtract: ['$hours', 9] }] } } },
    { $group: { _id: '$employeeId', overtimeHours: { $sum: '$overtime' }, totalHours: { $sum: '$hours' } } },
    { $sort: { overtimeHours: -1 } },
    { $limit: 5 }
  ])

  // העשרה בשמות
  const ids = topOvertime.map(r => r._id)
  const emps = await Employee.find({ id: { $in: ids } }, { id:1, name:1 }).lean()
  const nameMap = new Map(emps.map(e => [e.id, e.name]))

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
    topOvertime: topOvertimeEnriched
  }
}

// --- Fallback מקומי: מייצר תובנות בלי AI ---
function localFallback(kpis, userQuestion) {
  const insights = []
  const { employees, avgHoursPerWorkDay, totalSickDays, totalVacationDays, topOvertime } = kpis

  // 1) שעות ממוצעות גבוהות
  if (avgHoursPerWorkDay >= 8.8) {
    insights.push({
      id: 'avg_hours_high',
      title: 'ממוצע שעות גבוה',
      summary: `שעות ממוצעות לעובד ביום עבודה ${avgHoursPerWorkDay}h ב-30 ימים.`,
      metric: `${avgHoursPerWorkDay}h`,
      severity: 'medium',
      recommendation: 'בדקו עומסי צוות ושקלו איזון משמרות.'
    })
  }

  // 2) ימי מחלה יחסית גבוהים
  if (employees > 0) {
    const sickPerEmp = Number((totalSickDays / employees).toFixed(2))
    if (sickPerEmp >= 0.4) {
      insights.push({
        id: 'sick_days',
        title: 'צריכת מחלה מורגשת',
        summary: `ממוצע ${sickPerEmp} ימי מחלה לעובד ב-30 ימים.`,
        metric: `${sickPerEmp} days/emp`,
        severity: 'medium',
        recommendation: 'בדקו עונתיות/מגמות והציעו עבודה היברידית בימי שיא.'
      })
    }
  }

  // 3) שעות נוספות – טופ 3
  const top3 = topOvertime.slice(0,3).map(t => `${t.name} (${t.overtimeHours}h OT)`).join(', ')
  if (top3) {
    const high = topOvertime[0]?.overtimeHours >= 15
    insights.push({
      id: 'top_overtime',
      title: 'שעות נוספות – מובילים',
      summary: `מובילים בשעות נוספות: ${top3}.`,
      metric: topOvertime[0] ? `${topOvertime[0].overtimeHours}h` : null,
      severity: high ? 'high' : 'low',
      recommendation: 'בדקו חלוקת משימות/כוח אדם אצל העובדים המובילים.'
    })
  }

  // 4) ימי חופשה נמוכים/גבוהים (אינדיקציה לתשישות או להפך)
  if (totalVacationDays <= employees * 0.2) {
    insights.push({
      id: 'low_vacation',
      title: 'צריכת חופשה נמוכה',
      summary: 'ניצול חופשה נמוך יחסית ב-30 ימים.',
      metric: `${totalVacationDays} days total`,
      severity: 'low',
      recommendation: 'עודדו תכנון חופשות להפחתת שחיקה.'
    })
  }

  while (insights.length < 3) {
    insights.push({
      id: `fill_${insights.length}`,
      title: 'זמינות נתונים',
      summary: 'לא זוהתה תובנה נוספת מהמדדים הקיימים.',
      metric: null,
      severity: 'low',
      recommendation: null
    })
  }

  const answer = userQuestion
    ? 'מצטערת, כרגע חרגנו מהמכסה. הוצגו תובנות מקומיות לפי חישובים פנימיים.'
    : 'הוצגו תובנות מקומיות לפי חישובים פנימיים.'

  return { insights, answer }
}

// --- JSON Schema ל-Structured Outputs (strict) ---
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

// --- קריאה ל-OpenAI עם ריטריי חכם ---
async function callOpenAIWithRetry(kpis, userQuestion, maxRetries = 2) {
  const prompt = [
    'You are an HR ops analyst. Be concise and actionable.',
    '',
    'Here are 30-day HR/attendance KPIs as JSON:',
    JSON.stringify(kpis),
    userQuestion ? `\nManager question: ${userQuestion}` : '',
    '\nGenerate 3–6 short insights. Keep each summary under 40 words. Use the schema.'
  ].join('\n')

  let attempt = 0
  let lastErr = null

  while (attempt <= maxRetries) {
    try {
      const response = await client.responses.create({
        model: 'gpt-4o-mini',
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'ManagerInsights',
            strict: true,
            schema
          }
        }
      })

      const raw =
        response.output_text ||
        (Array.isArray(response.output) && response.output[0]?.content?.[0]?.text) ||
        ''
      const data = JSON.parse(raw)
      return { ok: true, data, source: 'openai' }
    } catch (err) {
      lastErr = err
      // אם זו מכסה — לא יעזור ריטריי
      if (isQuota(err)) {
        return { ok: false, error: err, quota: true }
      }
      // אם זה rate limit רגיל — ננסה שוב עם backoff
      if (isRateLimit(err) && attempt < maxRetries) {
        const delay = Math.floor(800 * Math.pow(2, attempt) + Math.random() * 300)
        await sleep(delay)
        attempt++
        continue
      }
      // שגיאה אחרת (400 וכו') — נצא
      break
    }
  }
  return { ok: false, error: lastErr, quota: false }
}

router.post('/insights', async (req, res) => {
  try {
    const userQuestion = (req.body?.query || '').toString().slice(0, 2000)

    // קאש: אם יש תשובה אחרונה עדכנית (10 דק') וגם אין שאלה חדשה — נחזיר קאש
    if (!userQuestion && cache.last && (Date.now() - cache.last.at < cache.ttlMs)) {
      return res.json({ ok: true, kpis: cache.last.payload.kpis, ai: cache.last.payload.ai, meta: { source: 'cache' } })
    }

    const kpis = await fetchKPIs()

    // אם אין מפתח — נחזיר פולבאק מקומי
    if (!process.env.OPENAI_API_KEY) {
      const ai = localFallback(kpis, userQuestion)
      const payload = { kpis, ai }
      cache.last = { at: Date.now(), payload }
      return res.json({ ok: true, ...payload, meta: { source: 'fallback', reason: 'no_api_key' } })
    }

    const result = await callOpenAIWithRetry(kpis, userQuestion, 2)

    if (result.ok) {
      const ai = result.data
      const payload = { kpis, ai }
      cache.last = { at: Date.now(), payload }
      return res.json({ ok: true, ...payload, meta: { source: result.source } })
    }

    // פולבאק — מכסה או שגיאות אחרות אחרי ניסיונות
    const ai = localFallback(kpis, userQuestion)
    const payload = { kpis, ai }
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
