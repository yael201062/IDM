// routes/login.js
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { exec } = require('child_process')               // ✨ חדש: בדיקה מול AD
const Employee = require('../models/Employee')
const JWT_SECRET = process.env.JWT_SECRET || 'verySecretKey'

const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1'

// ✨ פונקציה קטנה: האם ב-AD חייבים להחליף סיסמה (pwdLastSet==0 / PasswordExpired==true)
function mustChangeFromAD(samAccountName) {
  return new Promise((resolve) => {
    const adUser = process.env.AD_USERNAME || ''
    const adPass = process.env.AD_PASSWORD || ''
    if (!adUser || !adPass || !samAccountName) return resolve(false)

    const idSafe = String(samAccountName).replace(/'/g, "''")
    const ps = [
      'Import-Module ActiveDirectory;',
      `$p = ConvertTo-SecureString '${adPass}' -AsPlainText -Force;`,
      `$cred = New-Object System.Management.Automation.PSCredential('${adUser}', $p);`,
      `try {`,
      `  $u = Get-ADUser -Identity '${idSafe}' -Credential $cred -Properties pwdLastSet,PasswordExpired -ErrorAction Stop;`,
      `  if (($u.pwdLastSet -eq 0) -or ($u.PasswordExpired -eq $true)) { 'true' } else { 'false' }`,
      `} catch { 'false' }`
    ].join(' ')

    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`,
      (_err, stdout) => {
        const out = String(stdout || '').trim().toLowerCase()
        resolve(out === 'true')
      })
  })
}

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

    // טוקן (כולל empId לתאימות)
    const token = jwt.sign(
      { _id: user._id, email: user.email, empId: user.id },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    // דגל mustChangePassword מה-DB (אם קיים)
    let mustChangePassword =
      toBool(user.mustChangePassword) ||
      toBool(user.forcePasswordChange) ||
      toBool(user.passwordExpired) ||
      (user.pwdLastSet === 0)

    // ✨ אם ב-DB לא מסומן – נבדוק בזמן אמת מול AD לפי samAccountName=employee.id
    if (!mustChangePassword && user.id) {
      try {
        const adSaysMust = await mustChangeFromAD(user.id)
        if (adSaysMust) mustChangePassword = true
      } catch (_) { /* מתעלמים בשקט */ }
    }

    // (לא חובה, אבל אפשר להחזיר גם active אם יש שדה כזה במודל)
    const active = user.active === undefined ? true : toBool(user.active)

    return res.json({
      token,
      active,
      mustChangePassword
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
