const AttendanceRecord = require('../models/AttendanceRecord');
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// routes/attendance.js (קטע ה-upsert)
router.post('/:id', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.params.id })
    if (!emp) return res.status(404).json({ error: 'Employee not found' })

    const { type, hours, date, start, end, notes } = req.body

    // ננרמל date ל-YYYY-MM-DD
    const dateKey = (() => {
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date
      const d = new Date(date || Date.now())
      return isNaN(d.getTime()) ? new Date().toISOString().slice(0,10) : d.toISOString().slice(0,10)
    })()

    // נבנה start/end כ-UTC Date מתוך HH:MM
    const hhmmToUtc = (ymd, hhmm) =>
      (hhmm && /^\d{2}:\d{2}$/.test(hhmm)) ? new Date(`${ymd}T${hhmm}:00.000Z`) : null

    const startDt = hhmmToUtc(dateKey, start)
    const endDt   = hhmmToUtc(dateKey, end)

    let hrs = Number(hours) || 0
    if (hrs <= 0 && startDt && endDt) {
      hrs = Math.max(0, (endDt - startDt) / 3600000)
    }

    const update = {
      $set: {
        employeeId: emp.id,
        dateKey,
        date: new Date(`${dateKey}T00:00:00.000Z`),
        start: startDt,
        end: endDt,
        type: type || 'work',
        hours: Number(hrs) || 0,
        notes: notes || '',
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() }
    }

    // upsert לפי מפתח ייחודי (אמין, בלי ענייני timezone)
    const result = await AttendanceRecord.updateOne(
      { employeeId: emp.id, dateKey },
      update,
      { upsert: true }
    )

    return res.json({ ok: true, result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})



router.get('/history/:id', async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ employeeId: req.params.id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

module.exports = router;
