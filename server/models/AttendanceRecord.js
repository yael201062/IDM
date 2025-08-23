// models/AttendanceRecord.js
const mongoose = require('mongoose')

const AttendanceRecordSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },   // זה ה-id הארגוני (לא _id)
  date: { type: Date, required: true },           // היום (לנוחות דוחות/אגרגציות)
  dateKey: { type: String, required: true },      // 'YYYY-MM-DD' — מפתח לוגי יציב
  start: { type: Date, default: null },
  end:   { type: Date, default: null },
  type:  { type: String, enum: ['work', 'vacation', 'sick'], default: 'work' },
  hours: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true })

// אינדקס ייחודי — רשומה אחת ליום לעובד
AttendanceRecordSchema.index({ employeeId: 1, dateKey: 1 }, { unique: true })

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema)
