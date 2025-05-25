const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const { exec } = require('child_process')
require('dotenv').config()

router.post('/', async (req, res) => {
  try {
    const emp = new Employee(req.body)
    await emp.save()

    const { name, id, role, email } = req.body
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
      `-AccountPassword (ConvertTo-SecureString 'Password123!' -AsPlainText -Force)`,
      `-Enabled $true`,
      `-ChangePasswordAtLogon $true`,
      `-Path 'CN=Users,DC=IDM,DC=local'`,
      `-Credential $cred`
    ].join(' ')

    exec(`powershell.exe -Command "${psCommand}"`, (err, stdout, stderr) => {
      console.log('STDOUT:', stdout)
      console.log('STDERR:', stderr)

      if (err || stderr.toLowerCase().includes('error') || stderr.toLowerCase().includes('denied')) {
        console.error(`AD Error: ${stderr}`)
        return res.status(500).json({ error: 'Employee saved, but failed to create AD user' })
      } else {
        console.log(`AD User created successfully`)
        return res.status(201).json({ message: 'Employee created and AD user added' })
      }
    })
  } catch (err) {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

//get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
    res.json(employees)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
})

//get employee by id
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) return res.status(404).json({ error: 'Employee not found' })
    res.json(employee)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee' })
  }
})


module.exports = router


// const express = require('express')
// const router = express.Router()
// const Employee = require('../models/Employee')
// const { exec } = require('child_process')
// const bcrypt = require('bcryptjs')
// require('dotenv').config()

// router.post('/', async (req, res) => {
//   try {
//     const { name, id, role, phone, email, start, end } = req.body
//     const adUser = process.env.AD_USERNAME
//     const adPass = process.env.AD_PASSWORD

//     const plainPassword = 'Password123!'
//     const hashedPassword = await bcrypt.hash(plainPassword, 10)

//     const emp = new Employee({
//       name,
//       id,
//       role,
//       phone,
//       email,
//       start,
//       end,
//       password: hashedPassword,
//     })
//     await emp.save()

//     const psCommand = [
//       `$password = ConvertTo-SecureString '${adPass}' -AsPlainText -Force;`,
//       `$cred = New-Object System.Management.Automation.PSCredential('${adUser}', $password);`,
//       `New-ADUser`,
//       `-Name '${name}'`,
//       `-DisplayName '${name}'`,
//       `-SamAccountName '${id}'`,
//       `-UserPrincipalName '${id}@idm.local'`,
//       `-Title '${role}'`,
//       `-EmailAddress '${email}'`,
//       `-AccountPassword (ConvertTo-SecureString '${plainPassword}' -AsPlainText -Force)`,
//       `-Enabled $true`,
//       `-ChangePasswordAtLogon $true`,
//       `-Path 'CN=Users,DC=IDM,DC=local'`,
//       `-Credential $cred`
//     ].join(' ')

//     exec(`powershell.exe -Command "${psCommand}"`, (err, stdout, stderr) => {
//       console.log('STDOUT:', stdout)
//       console.log('STDERR:', stderr)

//       if (err || stderr.toLowerCase().includes('error') || stderr.toLowerCase().includes('denied')) {
//         console.error(`AD Error: ${stderr}`)
//         return res.status(500).json({ error: 'Employee saved, but failed to create AD user' })
//       } else {
//         console.log(`AD User created successfully`)
//         return res.status(201).json(emp)
//       }
//     })
//   } catch (err) {
//     console.error('Server error:', err)
//     res.status(500).json({ error: 'Server error' })
//   }
// })

// // get all employees
// router.get('/', async (req, res) => {
//   try {
//     const employees = await Employee.find()
//     res.json(employees)
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch employees' })
//   }
// })

// // get employee by id
// router.get('/:id', async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.params.id)
//     if (!employee) return res.status(404).json({ error: 'Employee not found' })
//     res.json(employee)
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch employee' })
//   }
// })

// module.exports = router
