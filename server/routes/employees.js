const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const Role = require('../models/Role')
const Permission = require('../models/Permission')
const bcrypt = require('bcryptjs')
const { exec } = require('child_process')
const mongoose = require('mongoose')
require('dotenv').config()

router.post('/', async (req, res) => {
  try {
    const {
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

    // הגדלת מונה ברול
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

    // יצירת משתמש ב-AD
    const adUser = process.env.AD_USERNAME
    const adPass = process.env.AD_PASSWORD
    const psCreate = [
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

    exec(`powershell.exe -Command "${psCreate}"`, async (err, stdout, stderr) => {
      if (err || (stderr && stderr.toLowerCase().includes('error'))) {
        console.error('AD Error (create):', stderr || err?.message)
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
                console.error('❌ Failed to set manager in AD:', stderr2 || err2?.message)
              } else {
                console.log(`✅ Manager set in AD for user ${id}`)
              }
            })
          }
        } catch (e) {
          console.error('❌ Failed to fetch manager for AD:', e)
        }
      }

      try {
        if (roleId && mongoose.Types.ObjectId.isValid(roleId)) {
          const perm = await Permission.findOne({ roleId }).lean()
          if (perm) {
            const allGroups = (perm.adGroups || [])
            .map((g) => String(g).trim())
            .filter(Boolean)


            if (allGroups.length) {
              const groupsQuoted = allGroups
                .map((g) => `'${g.replace(/'/g, "''")}'`)
                .join(',')

              const psGroups = [
                `Import-Module ActiveDirectory;`,
                `$password = ConvertTo-SecureString '${adPass}' -AsPlainText -Force;`,
                `$cred = New-Object System.Management.Automation.PSCredential('${adUser}', $password);`,
                // לפעמים ל-AD לוקח רגע לראות את המשתמש החדש
                `Start-Sleep -Seconds 3;`,
                // טען את אובייקט המשתמש
                `try { $u = Get-ADUser -Identity '${id}' -Credential $cred -ErrorAction Stop } catch { Write-Output ('ERR:USER:{0}' -f $_.Exception.Message); exit 0 }`,
                `$groups=@(${groupsQuoted});`,
                `foreach ($g in $groups) {`,
                `  try {`,
                `    $grp = Get-ADGroup -Identity $g -Credential $cred -ErrorAction Stop;`,
                `    Add-ADGroupMember -Identity $grp -Members $u -Credential $cred -ErrorAction Stop;`,
                `    Write-Output ('OK:{0}' -f $grp.SamAccountName)`,
                `  } catch {`,
                `    Write-Output ('ERR:{0}:{1}' -f $g, $_.Exception.Message)`,
                `  }`,
                `}`,
              ].join(' ')

              exec(`powershell.exe -Command "${psGroups}"`, (e3, out3 = '', err3 = '') => {
                console.log('PS Add-ADGroupMember stdout:\n', out3)
                if (err3) console.warn('PS Add-ADGroupMember stderr:\n', err3)
                const anyOk = /(^|\n)OK:/i.test(out3)
                const anyErr = /(^|\n)ERR:/i.test(out3) || (err3 && err3.toLowerCase().includes('error'))
                if (e3) {
                  console.error('❌ Add-ADGroupMember exec error:', e3.message)
                } else if (anyErr && !anyOk) {
                  console.error('❌ Failed to add user to groups (no OK lines). See stdout above.')
                } else {
                  console.log(`✅ Finished adding ${id} to role groups: ${allGroups.join(', ')}`)
                }
              })
            } else {
              console.log('ℹ️ No groups configured for this role.')
            }
          } else {
            console.log('ℹ️ No Permission doc for this role yet.')
          }
        } else {
          console.log('ℹ️ roleId missing/invalid – skipping group membership.')
        }
      } catch (e) {
        console.error('❌ Error while adding user to role groups:', e.message)
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
