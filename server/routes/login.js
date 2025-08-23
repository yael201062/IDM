const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Employee = require('../models/Employee')
const JWT_SECRET = process.env.JWT_SECRET || 'verySecretKey'

router.post('/', async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await Employee.findOne({ email })
    if (!user) return res.status(401).json({ error: 'User not found' })

    if (!user.password) {
      return res.status(400).json({ error: 'User has no password set' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' })

    // ❗️שולחים גם את שדה ה־id של העובד (ת"ז)
    const token = jwt.sign(
      { _id: user._id, email: user.email, empId: user.id },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    res.json({
      token,
      mustChangePassword: user.mustChangePassword || false,
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
