const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  name: String,
  firstName: String,
  lastName: String,
  id: String,
  role: String,
  department: String,
  status: { type: String, default: 'Activated' },
  phone: String,
  email: String,
  start: String,
  end: String,
  birthday: String,
  password: String,
systemRole: {
  type: String,
  enum: ['worker', 'manager', 'hr', 'it'],
  required: true,
},
  managerId: {
    type: String,
    default: null,
  },
})

module.exports = mongoose.model('Employee', employeeSchema)