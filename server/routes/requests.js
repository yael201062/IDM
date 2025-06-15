const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Request = require('../models/Request')

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
  managerId: employee.managerId,
})

    const saved = await request.save()
    res.status(201).json(saved)
  } catch (err) {
    console.error('POST /api/requests error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/mine', auth, async (req, res) => {
  try {
    const requests = await Request.find({ employeeId: req.user.empId }).sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    console.error('GET /api/requests/mine error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})
router.get('/for-manager', auth, async (req, res) => {
  try {
    const managerId = req.user.empId
    const requests = await Request.find({ managerId, status: 'pending' }).sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    console.error('GET /for-manager error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const request = await Request.findById(req.params.id)
    if (!request) return res.status(404).json({ error: 'Request not found' })

    // בדיקה שהמשתמש המחובר הוא המנהל של הבקשה
    if (request.managerId !== req.user.empId) {
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