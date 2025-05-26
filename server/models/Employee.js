const mongoose = require('mongoose')

const EmployeeSchema = new mongoose.Schema({
  name: String,
  firstName: String,
  lastName: String,
  id: String,
  role: String,
  phone: String,
  email: String,
  start: String,
  end: String,
  password: { type: String, required: true },
  vacationDays: { type: Number, default: 18 },
  sickDays: { type: Number, default: 30 },
  workHours: { type: Number, default: 0 },
  birthday: String,
  mustChangePassword: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

})

module.exports = mongoose.model('Employee', EmployeeSchema)
