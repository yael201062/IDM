// routes/changePassword.js
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { exec } = require('child_process')              // ✨ חדש: עדכון AD
const Employee = require('../models/Employee')
const router = express.Router()


/** ✨ עוזר: עדכון סיסמה ב-AD וביטול הדרישה להחליף בסשן הבא */
function updateADPasswordAndClearFlag(samAccountName, newPassword) {
  return new Promise((resolve, reject) => {
    const adUser = process.env.AD_USERNAME || ''
    const adPass = process.env.AD_PASSWORD || ''
    if (!adUser || !adPass) {
      return reject(new Error('AD credentials are not configured (AD_USERNAME/AD_PASSWORD)'))
    }
    if (!samAccountName) {
      return reject(new Error('Missing samAccountName for AD update'))
    }
    const idSafe = String(samAccountName).replace(/'/g, "''")
    const pwSafe = String(newPassword).replace(/'/g, "''")

    const ps = [
      'Import-Module ActiveDirectory;',
      `$p = ConvertTo-SecureString '${adPass}' -AsPlainText -Force;`,
      `$cred = New-Object System.Management.Automation.PSCredential('${adUser}', $p);`,
      `$newPw = ConvertTo-SecureString '${pwSafe}' -AsPlainText -Force;`,
      // מחליף סיסמה
      `Set-ADAccountPassword -Identity '${idSafe}' -NewPassword $newPw -Reset -Credential $cred -ErrorAction Stop;`,
      // מבטל את ChangePasswordAtLogon
      `Set-ADUser -Identity '${idSafe}' -ChangePasswordAtLogon $false -Credential $cred -ErrorAction Stop;`,
      // (רשות) שחרור נעילה אם קיימת
      `try { Unlock-ADAccount -Identity '${idSafe}' -Credential $cred -ErrorAction SilentlyContinue } catch {}`,
      `Write-Output 'OK'`
    ].join(' ')

    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`,
      (err, stdout, stderr) => {
        if (err) return reject(err)
        const out = String(stdout || '').trim()
        if (/^OK$/i.test(out)) return resolve(true)
        if (stderr && /error/i.test(String(stderr))) return reject(new Error(stderr))
        resolve(true)
      })
  })
}

async function findEmployeeFromToken(decoded) {
  // לפי Mongo _id
  if (decoded._id) {
    const byId = await Employee.findById(decoded._id)
    if (byId) return byId
  }
  // לפי ת"ז ארגונית מהטוקן (empId)
  if (decoded.empId) {
    const byEmpId = await Employee.findOne({ id: decoded.empId })
    if (byEmpId) return byEmpId
  }
  // תאימות לגרסאות קודמות: mongoId / id
  if (decoded.mongoId) {
    const byMongo = await Employee.findById(decoded.mongoId)
    if (byMongo) return byMongo
  }
  if (decoded.id) {
    const byOrgId = await Employee.findOne({ id: decoded.id })
    if (byOrgId) return byOrgId
  }
  if (decoded.email) {
    const byEmail = await Employee.findOne({ email: decoded.email })
    if (byEmail) return byEmail
  }
  return null
}

function validatePassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters'
  return null
}

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

    await updateADPasswordAndClearFlag(user.id, password)

    user.password = await bcrypt.hash(password, 10)
    user.mustChangePassword = false
    await user.save()

    return res.json({ message: 'Password updated successfully' })
  } catch (e) {
    console.error('change-password error:', e)
    return res.status(500).json({ error: 'Failed to update password in AD. Please contact IT.' })
  }
})

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

    await updateADPasswordAndClearFlag(user.id, password)

    user.password = await bcrypt.hash(password, 10)
    user.mustChangePassword = false
    await user.save()

    return res.json({ message: 'Password updated successfully' })
  } catch (e) {
    console.error('change-password/by-email error:', e)
    return res.status(500).json({ error: 'Failed to update password in AD. Please contact IT.' })
  }
})

module.exports = router
