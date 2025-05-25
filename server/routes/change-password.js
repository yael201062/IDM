const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Employee = require('../models/Employee')
const router = express.Router()

router.post('/', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })

  const token = auth.split(' ')[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'verySecretKey')
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password is required' })

  const hashed = await bcrypt.hash(password, 10)

  await Employee.findByIdAndUpdate(decoded.id, {
    password: hashed,
    mustChangePassword: false,
  })

  res.json({ message: 'Password updated successfully' })
})

module.exports = router

