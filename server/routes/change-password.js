// routes/changePassword.js
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Employee = require('../models/Employee')
const router = express.Router()

/** עוזר: איתור עובד ממבנה ה-JWT */
async function findEmployeeFromToken(decoded) {
  // תחילה נסה לפי Mongo _id אם קיים
  if (decoded.mongoId) {
    const byMongo = await Employee.findById(decoded.mongoId)
    if (byMongo) return byMongo
  }
  // אח"כ לפי ת״ז ארגונית (השדה id בסכמה)
  if (decoded.id) {
    const byOrgId = await Employee.findOne({ id: decoded.id })
    if (byOrgId) return byOrgId
  }
  // לבסוף לפי אימייל מה-token (אם יש)
  if (decoded.email) {
    const byEmail = await Employee.findOne({ email: decoded.email })
    if (byEmail) return byEmail
  }
  return null
}

/** חובה: מדיניות סיסמה (אופציונלי, דוגמה פשוטה) */
function validatePassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters'
  // אפשר להקשיח: אות גדולה/קטנה/מספר/תווים מיוחדים וכו'
  return null
}

/** 1) החלפת סיסמה לעצמי (מחייב Authorization) */
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
  const pwErr = validatePassword(password)
  if (pwErr) return res.status(400).json({ error: pwErr })

  try {
    const user = await findEmployeeFromToken(decoded)
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.password = await bcrypt.hash(password, 10)
    user.mustChangePassword = false
    await user.save()

    return res.json({ message: 'Password updated successfully' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

/** 2) החלפת סיסמה לפי אימייל (למשל HR/IT/Admin) */
router.post('/by-email', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })
  const token = auth.split(' ')[1]

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'verySecretKey')
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // בדיקת הרשאה בסיסית: רק hr / it (או מה שתרצי)
  const role = decoded.systemRole
  if (!['hr', 'it'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  const pwErr = validatePassword(password)
  if (pwErr) return res.status(400).json({ error: pwErr })

  try {
    const user = await Employee.findOne({ email })
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.password = await bcrypt.hash(password, 10)
    user.mustChangePassword = false
    await user.save()

    return res.json({ message: 'Password updated successfully' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
