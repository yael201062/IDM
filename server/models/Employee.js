const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  name: String,
  firstName: String,
  lastName: String,
  id: String,

  // שם הרול נשאר להצגה / AD
  role: String,

  // 🆕 קישור לרול לצורך ספירת usersCount
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },

  department: String,
  status: { type: String, default: 'Activated' },
  phone: String,
  email: String,
  start: String,
  end: String,
  birthday: String,
  password: String,
  address: String,
systemRole: {
  type: String,
  enum: ['worker', 'manager', 'hr', 'it'],
  required: true,
},
  managerId: {
    type: String,
    default: null,
  },
   baseVacationDays: { type: Number, default: 18 },
  baseSickDays:     { type: Number, default: 30 },
}, { timestamps: true });


module.exports = mongoose.model('Employee', employeeSchema)
