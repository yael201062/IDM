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

    const request = new Request({
      employeeId: req.user.empId,
      type,
      description,
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

module.exports = router