const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const AttendanceRecord = require('../models/AttendanceRecord');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process');
require('dotenv').config();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

/** כלי עזר קטן: בדיקת הרשאה לפי systemRole */
const isHRorIT = (role) => role === 'hr' || role === 'it';
const isManager = (role) => role === 'manager';

/* === helper לגזירת ת״ז של המשתמש מה-token === */
async function resolvePersonalIdFromUser(user) {
  if (!user) return null;

  const candidates = [
    user.empId,
    user.employeeId,
    user.personalId,
    user.id,
  ]
    .map(v => (v == null ? '' : String(v)))
    .filter(Boolean);

  for (const cand of candidates) {
    if (/^\d{9}$/.test(cand)) return cand;
  }

  const objectId =
    (user._id && String(user._id)) ||
    (user.mongoId && String(user.mongoId)) ||
    null;
  if (objectId && mongoose.Types.ObjectId.isValid(objectId)) {
    const emp = await Employee.findById(objectId).lean();
    if (emp?.id) return emp.id;
  }

  if (user.email) {
    const emp = await Employee.findOne({ email: user.email }).lean();
    if (emp?.id) return emp.id;
  }

  const userName = user.username || user.userName || user.samAccountName || null;
  if (userName) {
    const emp = await Employee.findOne({ id: String(userName) }).lean();
    if (emp?.id) return emp.id;
  }

  return null;
}

/* === NEW: גזירת systemRole אפקטיבי מהטוקן או מה-DB (אם חסר בטוקן) === */
async function getEffectiveSysRole(user) {
  let sys = String(user?.systemRole || '').trim().toLowerCase();
  if (sys) return sys;

  const personalId = await resolvePersonalIdFromUser(user);
  if (!personalId) return '';

  const me = await Employee.findOne({ id: personalId }, 'systemRole').lean();
  return String(me?.systemRole || '').trim().toLowerCase();
}

/* ===================== POST /api/employees ===================== */
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
    } = req.body;

    console.log('📥 POST /api/employees body:', {
      firstName, lastName, id, role, roleId, email, systemRole, managerId
    });

    const existing = await Employee.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: 'Employee with this ID already exists' });
    }

    const name = `${firstName}-${lastName}`;
    const plainPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

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

      // ★ תוספת מינימלית: לסמן במונגו שחובה להחליף סיסמה (תואם ChangePasswordAtLogon ב-AD)
      mustChangePassword: true,
    });

    await employee.save();

    if (!roleId) {
      console.warn('⚠️ No roleId provided – usersCount not incremented');
    } else if (!mongoose.Types.ObjectId.isValid(roleId)) {
      console.error('❌ Invalid roleId format:', roleId);
    } else {
      try {
        const inc = await Role.findByIdAndUpdate(
          roleId,
          { $inc: { usersCount: 1 } },
          { new: true }
        );
        if (!inc) {
          console.error('❌ Role not found for roleId:', roleId);
        } else {
          console.log('✅ usersCount incremented for roleId', roleId, '→', inc.usersCount);
        }
      } catch (e) {
        console.error('❌ increment usersCount failed:', e.message);
      }
    }

    const adUser = process.env.AD_USERNAME;
    const adPass = process.env.AD_PASSWORD;
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
    ].join(' ');

    exec(`powershell.exe -Command "${psCreate}"`, async (err, stdout, stderr) => {
      if (err || (stderr && stderr.toLowerCase().includes('error'))) {
        console.error('AD Error (create):', stderr || err?.message);
        return res.status(500).json({ error: 'Employee created, but AD failed' });
      }

      console.log(`✅ User ${id} created in AD`);

      if (managerId) {
        try {
          const manager = await Employee.findOne({ id: managerId });
          if (manager) {
            const dnManager = `CN=${manager.name},CN=Users,DC=IDM,DC=local`;
            const setManagerCmd = [
              `$password = ConvertTo-SecureString '${adPass}' -AsPlainText -Force;`,
              `$cred = New-Object System.Management.Automation.PSCredential('${adUser}', $password);`,
              `Start-Sleep -Seconds 2;`,
              `Set-ADUser -Identity '${id}' -Manager '${dnManager}' -Credential $cred`,
            ].join(' ');
            exec(`powershell.exe -Command "${setManagerCmd}"`, (err2, stdout2, stderr2) => {
              if (err2 || (stderr2 && stderr2.toLowerCase().includes('error'))) {
                console.error('❌ Failed to set manager in AD:', stderr2 || err2?.message);
              } else {
                console.log(`✅ Manager set in AD for user ${id}`);
              }
            });
          }
        } catch (e) {
          console.error('❌ Failed to fetch manager for AD:', e);
        }
      }

      try {
        if (roleId && mongoose.Types.ObjectId.isValid(roleId)) {
          const perm = await Permission.findOne({ roleId }).lean();
          if (perm) {
            const allGroups = (perm.adGroups || [])
              .map((g) => String(g).trim())
              .filter(Boolean);

            if (allGroups.length) {
              const groupsQuoted = allGroups
                .map((g) => `'${g.replace(/'/g, "''")}'`)
                .join(',');

              const psGroups = [
                `Import-Module ActiveDirectory;`,
                `$password = ConvertTo-SecureString '${adPass}' -AsPlainText -Force;`,
                `$cred = New-Object System.Management.Automation.PSCredential('${adUser}', $password);`,
                `Start-Sleep -Seconds 3;`,
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
              ].join(' ');

              exec(`powershell.exe -Command "${psGroups}"`, (e3, out3 = '', err3 = '') => {
                console.log('PS Add-ADGroupMember stdout:\n', out3);
                if (err3) console.warn('PS Add-ADGroupMember stderr:\n', err3);
                const anyOk = /(^|\n)OK:/i.test(out3);
                const anyErr = /(^|\n)ERR:/i.test(out3) || (err3 && err3.toLowerCase().includes('error'));
                if (e3) {
                  console.error('❌ Add-ADGroupMember exec error:', e3.message);
                } else if (anyErr && !anyOk) {
                  console.error('❌ Failed to add user to groups (no OK lines). See stdout above.');
                } else {
                  console.log(`✅ Finished adding ${id} to role groups: ${allGroups.join(', ')}`);
                }
              });
            } else {
              console.log('ℹ️ No groups configured for this role.');
            }
          } else {
            console.log('ℹ️ No Permission doc for this role yet.');
          }
        } else {
          console.log('ℹ️ roleId missing/invalid – skipping group membership.');
        }
      } catch (e) {
        console.error('❌ Error while adding user to role groups:', e.message);
      }

      return res.status(201).json({ message: 'Employee created successfully' });
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===================== GET /api/employees ===================== */
router.get('/', auth, async (req, res) => {
  try {
    const rawUser = req.user || {};
    const sysRole = await getEffectiveSysRole(rawUser);

    const scope = String(req.query.scope || '').toLowerCase();
    const wantAll =
      String(req.query.all || '').toLowerCase() === '1' ||
      scope === 'all' || scope === '*' || scope === 'everything';

    const personalId = await resolvePersonalIdFromUser(rawUser);
    console.log('🔐 /api/employees requester:', {
      tokenId: rawUser.id,
      sysRole,
      scope,
      wantAll,
      resolvedPersonalId: personalId
    });

    let filter = {};

    if (isHRorIT(sysRole) && wantAll) {
      filter = {};
    } else if (scope === 'myreports') {
      filter = personalId ? { managerId: personalId } : { _id: null };
    } else if (isHRorIT(sysRole)) {
      filter = {};
    } else if (isManager(sysRole)) {
      filter = personalId ? { managerId: personalId } : { _id: null };
    } else {
      if (!personalId) return res.json([]);
      const hasReports = await Employee.exists({ managerId: personalId });
      filter = hasReports ? { managerId: personalId } : { id: personalId };
    }

    const employees = await Employee.find(filter).lean();
    return res.json(Array.isArray(employees) ? employees : []);
  } catch (err) {
    console.error('❌ /api/employees error:', err);
    return res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/* ===================== SUMMARY קודם ===================== */
router.get('/:id/summary', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.params.id });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const now = new Date();

    const start = req.query.start ? new Date(String(req.query.start)) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = req.query.end   ? new Date(String(req.query.end))   : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const hoursExpr = {
      $cond: [
        { $gt: ['$hours', 0] },
        '$hours',
        {
          $cond: [
            { $and: [
              { $eq: [ { $type: '$start' }, 'date' ] },
              { $eq: [ { $type: '$end'   }, 'date' ] },
            ]},
            { $max: [0, { $divide: [{ $subtract: ['$end', '$start'] }, 1000 * 60 * 60] }] },
            0
          ]
        }
      ]
    };

    const dateParsedAddFields = {
      $addFields: {
        dateParsed: {
          $switch: {
            branches: [
              { case: { $eq: [ { $type: '$date' }, 'date' ] }, then: '$date' },
              { case: { $and: [
                  { $eq: [ { $type: '$date' }, 'string' ] },
                  { $regexMatch: { input: '$date', regex: '^\\d{4}-\\d{2}-\\d{2}$' } }
                ]},
                then: { $dateFromString: { dateString: '$date', format: '%Y-%m-%d' } }
              },
              { case: { $and: [
                  { $eq: [ { $type: '$date' }, 'string' ] },
                  { $regexMatch: { input: '$date', regex: '^\\d{4}-\\d{2}-\\d{2}T' } }
                ]},
                then: { $toDate: '$date' }
              }
            ],
            default: null
          }
        }
      }
    };

    const yearAgg = await AttendanceRecord.aggregate([
      { $match: { employeeId: emp.id, type: { $in: ['vacation', 'sick'] } } },
      dateParsedAddFields,
      { $match: { dateParsed: { $ne: null, $gte: yearStart, $lte: yearEnd } } },
      { $group: { _id: '$type', days: { $sum: 1 } } }
    ]);

    const vacationTakenThisYear = yearAgg.find(x => x._id === 'vacation')?.days || 0;
    const sickTakenThisYear     = yearAgg.find(x => x._id === 'sick')?.days || 0;

    const remainingVacationDays = Math.max(0, (emp.baseVacationDays ?? 18) - vacationTakenThisYear);
    const remainingSickDays     = Math.max(0, (emp.baseSickDays ?? 30) - sickTakenThisYear);

    const rangeAgg = await AttendanceRecord.aggregate([
      { $match: { employeeId: emp.id } },
      dateParsedAddFields,
      { $match: { dateParsed: { $ne: null, $gte: start, $lte: end } } },
      { $group: { _id: '$type', hours: { $sum: hoursExpr } } }
    ]);

    const workHoursInRange = Number(((rangeAgg.find(x => x._id === 'work')?.hours) || 0).toFixed(2));
    const overtimeHoursInRange = Number(((rangeAgg.find(x => x._id === 'overtime')?.hours) || 0).toFixed(2));

    return res.json({
      employee: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        status: emp.status,
        baseVacationDays: emp.baseVacationDays,
        baseSickDays: emp.baseSickDays,
      },
      kpis: {
        remainingVacationDays,
        remainingSickDays,
        workHoursInRange,
        overtimeHoursInRange,
        vacationTakenThisYear,
        sickTakenThisYear,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ===================== GET /api/employees/:id (לפי ת״ז) ===================== */
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

/* ===================== PUT /api/employees/:id ===================== */
router.put('/:id', async (req, res) => {
  try {
    const param = String(req.params.id || '');
    const isOid = mongoose.Types.ObjectId.isValid(param);

    // פילטר לפי ObjectId או לפי "id" הארגוני (ת"ז)
    const filter = isOid ? { _id: param } : { id: param };

    // נטען את המסמך הקיים כדי שנוכל להשלים name נכון
    const prev = await Employee.findOne(filter);
    if (!prev) return res.status(404).json({ error: 'Employee not found' });

    // נשמור רק שדות שמותר לעדכן (כדי לא "לזרוק" שדות strict)
    const ALLOWED = [
      'firstName', 'lastName', 'phone', 'email', 'address', 'birthday',
      'department', 'position', 'role', 'roleId', 'managerId',
      'status', 'start', 'end'
    ];

    const updates = {};
    for (const k of ALLOWED) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        updates[k] = req.body[k];
      }
    }

    // מחשבים name גם אם שונה רק אחד מהם
    if ('firstName' in updates || 'lastName' in updates) {
      const fn = (updates.firstName ?? prev.firstName ?? '').toString();
      const ln = (updates.lastName  ?? prev.lastName  ?? '').toString();
      updates.name = [fn, ln].filter(Boolean).join('-');
    }

    // מבצעים עדכון עם $set + ולידציות ומחזירים את המסמך המעודכן
    const updatedEmployee = await Employee.findOneAndUpdate(
      filter,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    return res.json(updatedEmployee);
  } catch (err) {
    console.error('❌ Update error:', err);
    return res.status(500).json({ error: 'Failed to update employee' });
  }
});


module.exports = router;
