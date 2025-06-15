const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Request = require('../models/Request')
const Employee = require('../models/Employee')

// יצירת בקשה חדשה
router.post('/', auth, async (req, res) => {
  try {
    const { type, description } = req.body
    if (!type || !description) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const employee = await Employee.findOne({ id: req.user.empId })
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    const request = new Request({
      employeeId: req.user.empId,
      type,
      description,
      managerId: employee.managerId, // ת"ז של המנהל
    })

    const saved = await request.save()
    res.status(201).json(saved)
  } catch (err) {
    console.error('POST /api/requests error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// קבלת כל הבקשות של העובד הנוכחי
router.get('/mine', auth, async (req, res) => {
  try {
    const requests = await Request.find({ employeeId: req.user.empId }).sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    console.error('GET /api/requests/mine error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// קבלת בקשות ממתינות לפי ת"ז של המנהל
router.get('/for-manager', auth, async (req, res) => {
  try {
    const manager = await Employee.findOne({ id: req.user.empId })
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' })
    }

    console.log('📌 מחפש בקשות עם managerId =', manager.id)

    const requests = await Request.find({
      managerId: manager.id,
      status: 'pending',
    }).sort({ createdAt: -1 })

    console.log('🔍 נמצא', requests.length, 'בקשות')

    res.json(requests)
  } catch (err) {
    console.error('GET /for-manager error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})


// עדכון סטטוס של בקשה (אישור / דחייה)
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const request = await Request.findById(req.params.id)
    if (!request) return res.status(404).json({ error: 'Request not found' })

    const manager = await Employee.findOne({ id: req.user.empId })
    if (!manager || request.managerId !== manager.id) {
      return res.status(403).json({ error: 'Not authorized to update this request' })
    }

    request.status = status
    await request.save()

    res.json(request)
  } catch (err) {
    console.error('Error updating request status:', err)
    res.status(500).json({ error: 'Failed to update request' })
  }
})

module.exports = router
