const AttendanceRecord = require('../models/AttendanceRecord')
const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')

router.post('/:id', async (req, res) => {
  const { type, hours = 0, date, start, end } = req.body

  try {
    const employee = await Employee.findOne({ id: req.params.id })
    if (!employee) return res.status(404).json({ error: 'Employee not found' })

    // עדכון השדות במודל Employee
    if (type === 'work') employee.workHours += hours
    if (type === 'vacation') employee.vacationDays -= 1
    if (type === 'sick') employee.sickDays -= 1
    await employee.save()

    // שמירה לטבלת Attendance
    const record = new AttendanceRecord({
      employeeId: employee.id,
      date,
      start,
      end,
      type,
      hours,
    })
    await record.save()

    res.json({ message: 'Attendance updated', employee })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get attendance records for an employee
router.get('/history/:id', async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ employeeId: req.params.id }).sort({ date: -1 })
    res.json(records)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance records' })
  }
})

module.exports = router