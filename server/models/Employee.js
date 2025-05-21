const mongoose = require('mongoose')

const EmployeeSchema = new mongoose.Schema({
  name: String,
  id: String,
  role: String,
  phone: String,
  email: String,
  start: String,
  end: String,
})

module.exports = mongoose.model('Employee', EmployeeSchema)
