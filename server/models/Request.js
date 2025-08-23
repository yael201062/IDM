const mongoose = require('mongoose')

const requestSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  managerId: {
  type: String,
  required: false,
},
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'manager-approved', 'it-approved', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Request', requestSchema)
