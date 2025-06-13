const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const bcrypt = require('bcryptjs')
const { exec } = require('child_process')
require('dotenv').config()

router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      id,
      role,
      phone,
      email,
      start,
      end,
      birthday,
      systemRole,
    } = req.body

    console.log('📥 יצירת עובד חדש עם הנתונים:', req.body)

    const existing = await Employee.findOne({ id })
    if (existing) {
      return res.status(400).json({ error: 'Employee with this ID already exists' })
    }

    const name = `${firstName}-${lastName}`
    const plainPassword = 'Password123!'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    const employee = new Employee({
      name,
      firstName,
      lastName,
      id,
      role,
      phone,
      email,
      start,
      end,
      birthday,
      password: hashedPassword,
      systemRole,
    })

    await employee.save()

    const adUser = process.env.AD_USERNAME
    const adPass = process.env.AD_PASSWORD
    const psCommand = [
      `$password = ConvertTo-SecureString '${adPass}' -AsPlainText -Force;`,
      `$cred = New-Object System.Management.Automation.PSCredential('${adUser}', $password);`,
      `New-ADUser`,
      `-Name '${name}'`,
      `-DisplayName '${name}'`,
      `-SamAccountName '${id}'`,
      `-UserPrincipalName '${id}@idm.local'`,
      `-Title '${role}'`,
      `-EmailAddress '${email}'`,
      `-AccountPassword (ConvertTo-SecureString '${plainPassword}' -AsPlainText -Force)`,
      `-Enabled $true`,
      `-ChangePasswordAtLogon $true`,
      `-Path 'CN=Users,DC=IDM,DC=local'`,
      `-Credential $cred`,
    ].join(' ')

    exec(`powershell.exe -Command "${psCommand}"`, (err, stdout, stderr) => {
      if (err || stderr.toLowerCase().includes('error')) {
        console.error('AD Error:', stderr)
        return res.status(500).json({ error: 'Employee created, but AD failed' })
      }

      return res.status(201).json({ message: 'Employee created successfully' })
    })
  } catch (err) {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
