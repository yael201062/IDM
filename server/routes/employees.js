const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const bcrypt = require('bcryptjs')
const { exec } = require('child_process')
require('dotenv').config()

// ▶ יצירת עובד חדש
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
      department,
      managerId, // 🆕
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
      department,
      password: hashedPassword,
      systemRole,
      managerId, // 🆕
    })

    await employee.save()

    // PowerShell command to create AD user
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

    exec(`powershell.exe -Command "${psCommand}"`, async (err, stdout, stderr) => {
      if (err || stderr.toLowerCase().includes('error')) {
        console.error('AD Error:', stderr)
        return res.status(500).json({ error: 'Employee created, but AD failed' })
      }

      console.log(`✅ User ${id} created in AD`)

      // 💡 אם יש מנהל – נעדכן אותו גם ב-AD
      if (managerId) {
        try {
          const manager = await Employee.findOne({ id: managerId })
          if (manager) {
            const dnManager = `CN=${manager.name},CN=Users,DC=IDM,DC=local`

            const setManagerCmd = [
              `$password = ConvertTo-SecureString '${adPass}' -AsPlainText -Force;`,
              `$cred = New-Object System.Management.Automation.PSCredential('${adUser}', $password);`,
              `Start-Sleep -Seconds 2;`,
              `Set-ADUser -Identity '${id}' -Manager '${dnManager}' -Credential $cred`,
            ].join(' ')

            console.log('🔁 Running Set-ADUser with:', setManagerCmd)

            exec(`powershell.exe -Command "${setManagerCmd}"`, (err2, stdout2, stderr2) => {
              if (err2 || stderr2.toLowerCase().includes('error')) {
                console.error('❌ Failed to set manager in AD:', stderr2)
              } else {
                console.log(`✅ Manager set in AD for user ${id}`)
              }
            })
          }
        } catch (e) {
          console.error('❌ Failed to fetch manager for AD:', e)
        }
      }

      return res.status(201).json({ message: 'Employee created successfully' })
    })
  } catch (err) {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
    res.json(employees)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
})

// Get employee by personal ID (תעודת זהות)
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id })
    if (!employee) return res.status(404).json({ error: 'Employee not found' })
    res.json(employee)
  } catch (err) {
    console.error('Error fetching employee:', err)
    res.status(500).json({ error: 'Failed to fetch employee' })
  }
})

// Update employee by ID
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body

    if (updates.firstName && updates.lastName) {
      updates.name = `${updates.firstName}-${updates.lastName}`
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )

    if (!updatedEmployee) return res.status(404).json({ error: 'Employee not found' })
    res.json(updatedEmployee)
  } catch (err) {
    console.error('❌ Update error:', err)
    res.status(500).json({ error: 'Failed to update employee' })
  }
})

module.exports = router