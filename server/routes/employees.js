const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const Role = require('../models/Role')
const bcrypt = require('bcryptjs')
const { exec } = require('child_process')
const mongoose = require('mongoose')           // 🆕 נדרש לולידציה של ObjectId
require('dotenv').config()

// ▶ יצירת עובד חדש
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      id,
      role,            // שם הרול (לטייטל/תצוגה/AD)
      roleId,          // מזהה רול אמיתי (ObjectId מ-roles)
      phone,
      email,
      start,
      end,
      birthday,
      systemRole,
      department,
      managerId,
    } = req.body

    console.log('📥 POST /api/employees body:', {
      firstName, lastName, id, role, roleId, email, systemRole, managerId
    })

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
      roleId,
      phone,
      email,
      start,
      end,
      birthday,
      department,
      password: hashedPassword,
      systemRole,
      managerId,
    })

    await employee.save()

    // 🆕 להגדיל מונה ברול שנבחר (עם בדיקת תוקף וזיהוי שגיאות)
    if (!roleId) {
      console.warn('⚠️ No roleId provided – usersCount not incremented')
    } else if (!mongoose.Types.ObjectId.isValid(roleId)) {
      console.error('❌ Invalid roleId format:', roleId)
    } else {
      try {
        const inc = await Role.findByIdAndUpdate(
          roleId,
          { $inc: { usersCount: 1 } },
          { new: true }
        )
        if (!inc) {
          console.error('❌ Role not found for roleId:', roleId)
        } else {
          console.log('✅ usersCount incremented for roleId', roleId, '→', inc.usersCount)
        }
      } catch (e) {
        console.error('❌ increment usersCount failed:', e.message)
      }
    }

    // PowerShell command to create AD user (ללא שינוי)
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
      if (err || (stderr && stderr.toLowerCase().includes('error'))) {
        console.error('AD Error:', stderr)
        return res.status(500).json({ error: 'Employee created, but AD failed' })
      }

      console.log(`✅ User ${id} created in AD`)

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
            exec(`powershell.exe -Command "${setManagerCmd}"`, (err2, stdout2, stderr2) => {
              if (err2 || (stderr2 && stderr2.toLowerCase().includes('error'))) {
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

// Update employee by ID (Mongo _id)
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body

    const prev = await Employee.findById(req.params.id)
    if (!prev) return res.status(404).json({ error: 'Employee not found' })

    if (updates.firstName && updates.lastName) {
      updates.name = `${updates.firstName}-${updates.lastName}`
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )

    const prevRoleId = String(prev.roleId || '')
    const nextRoleId = String(updatedEmployee.roleId || '')
    if (prevRoleId !== nextRoleId) {
      if (prev.roleId) {
        await Role.findByIdAndUpdate(prev.roleId, { $inc: { usersCount: -1 } }).catch(() => {})
        console.log('↘️ decremented usersCount for roleId', prev.roleId)
      }
      if (updatedEmployee.roleId) {
        await Role.findByIdAndUpdate(updatedEmployee.roleId, { $inc: { usersCount: 1 } }).catch(() => {})
        console.log('↗️ incremented usersCount for roleId', updatedEmployee.roleId)
      }
    }

    res.json(updatedEmployee)
  } catch (err) {
    console.error('❌ Update error:', err)
    res.status(500).json({ error: 'Failed to update employee' })
  }
})

module.exports = router
