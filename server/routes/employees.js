const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const AttendanceRecord = require('../models/AttendanceRecord');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process');
require('dotenv').config();

const auth = require('../middleware/auth')
/** כלי עזר קטן: בדיקת הרשאה לפי systemRole */
const isHRorIT = (role) => role === 'hr' || role === 'it'
const isManager = (role) => role === 'manager'

// === יצירת עובד ===
// (החלק שלך נשאר; מקוצר כאן בשביל המוקד — אפשר להשאיר כפי שהדבקת)

router.post('/', async (req, res) => {
  try {
    const {
      firstName, lastName, id, role, phone, email,
      start, end, birthday, systemRole, department, managerId,
    } = req.body;

    const existing = await Employee.findOne({ id });
    if (existing) return res.status(400).json({ error: 'Employee with this ID already exists' });

    const name = `${firstName}-${lastName}`;
    const plainPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const employee = new Employee({
      name, firstName, lastName, id, role, phone, email,
      start, end, birthday, department, password: hashedPassword,
      systemRole, managerId,
    });

    await employee.save();

    // אם אין לך AD בסביבה — אפשר לדלג/לנקד ב-if (process.env.USE_AD === 'true')
    // ... קוד ה-AD שלך ...

    return res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === כל העובדים ===
router.get('/',auth, async (req, res) => {
  try {
    const user = req.user
    let filter = {}

    if (isManager(user.systemRole)) {
      filter = { managerId: user.id }
    } else if (isHRorIT(user.systemRole)) {
      filter = {} // רואה את כולם
    } else {
      filter = { id: user.id } // עובד רגיל – רק את עצמו
    }

    const employees = await Employee.find(filter)
    res.json(employees);
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// === עובד לפי ת״ז (id האישי) ===
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// === עדכון עובד לפי ת״ז (לא _id!) ===
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.firstName && updates.lastName) {
      updates.name = `${updates.firstName}-${updates.lastName}`;
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true }
    );

    if (!updatedEmployee) return res.status(404).json({ error: 'Employee not found' });
    res.json(updatedEmployee);
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// === סיכום לעמוד הבית (Dashboard) ===
// GET /api/employees/:id/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/:id/summary', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.params.id });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const now = new Date();

    const start = req.query.start ? new Date(String(req.query.start)) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = req.query.end   ? new Date(String(req.query.end))   : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // חישוב שעות כאשר אין hours אבל יש start/end מסוג Date
    const hoursExpr = {
      $cond: [
        { $gt: ['$hours', 0] },
        '$hours',
        {
          $cond: [
            { $and: [
              { $eq: [ { $type: '$start' }, 'date' ] },
              { $eq: [ { $type: '$end'   }, 'date' ] },
            ]},
            { $max: [0, { $divide: [{ $subtract: ['$end', '$start'] }, 1000 * 60 * 60] }] },
            0
          ]
        }
      ]
    };

    // המרה בטוחה של השדה date למשתנה עזר dateParsed
    const dateParsedAddFields = {
      $addFields: {
        dateParsed: {
          $switch: {
            branches: [
              // כבר מסוג Date
              { case: { $eq: [ { $type: '$date' }, 'date' ] }, then: '$date' },
              // YYYY-MM-DD בלבד
              { case: { $and: [
                  { $eq: [ { $type: '$date' }, 'string' ] },
                  { $regexMatch: { input: '$date', regex: '^\\d{4}-\\d{2}-\\d{2}$' } }
                ]},
                then: { $dateFromString: { dateString: '$date', format: '%Y-%m-%d' } }
              },
              // ISO עם זמן: YYYY-MM-DDTHH:mm...
              { case: { $and: [
                  { $eq: [ { $type: '$date' }, 'string' ] },
                  { $regexMatch: { input: '$date', regex: '^\\d{4}-\\d{2}-\\d{2}T' } }
                ]},
                then: { $toDate: '$date' }
              }
            ],
            default: null
          }
        }
      }
    };

    // צריכת חופשה/מחלה בשנה (ימים)
    const yearAgg = await AttendanceRecord.aggregate([
      { $match: { employeeId: emp.id, type: { $in: ['vacation', 'sick'] } } },
      dateParsedAddFields,
      { $match: { dateParsed: { $ne: null, $gte: yearStart, $lte: yearEnd } } },
      { $group: { _id: '$type', days: { $sum: 1 } } }
    ]);

    const vacationTakenThisYear = yearAgg.find(x => x._id === 'vacation')?.days || 0;
    const sickTakenThisYear     = yearAgg.find(x => x._id === 'sick')?.days || 0;

    const remainingVacationDays = Math.max(0, (emp.baseVacationDays ?? 18) - vacationTakenThisYear);
    const remainingSickDays     = Math.max(0, (emp.baseSickDays ?? 30) - sickTakenThisYear);

    // שעות עבודה/נוספות בטווח התצוגה
    const rangeAgg = await AttendanceRecord.aggregate([
      { $match: { employeeId: emp.id } },
      dateParsedAddFields,
      { $match: { dateParsed: { $ne: null, $gte: start, $lte: end } } },
      { $group: { _id: '$type', hours: { $sum: hoursExpr } } }
    ]);

    const workHoursInRange = Number(((rangeAgg.find(x => x._id === 'work')?.hours) || 0).toFixed(2));
    const overtimeHoursInRange = Number(((rangeAgg.find(x => x._id === 'overtime')?.hours) || 0).toFixed(2));

    return res.json({
      employee: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        status: emp.status,
        baseVacationDays: emp.baseVacationDays,
        baseSickDays: emp.baseSickDays,
      },
      kpis: {
        remainingVacationDays,
        remainingSickDays,
        workHoursInRange,
        overtimeHoursInRange,
        vacationTakenThisYear,
        sickTakenThisYear,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
