const mongoose = require('mongoose')

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true }, // תעודת זהות
  date: { type: String, required: true },
  start: String,
  end: String,
  type: { type: String, enum: ['work', 'vacation', 'sick'], required: true },
  hours: { type: Number, default: 0 },
})

module.exports = mongoose.model('AttendanceRecord', attendanceSchema)
