const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/employees', require('./routes/employees'))
app.use('/api/login', require('./routes/login'))
app.use('/api/attendance', require('./routes/attendance'))
app.use('/api/change-password', require('./routes/change-password'))
app.use('/api/requests', require('./routes/requests'))
app.use('/api/roles', require('./routes/roles'))
app.use('/api/permissions', require('./routes/permissions'))



mongoose.connect('mongodb://127.0.0.1:27017/IDM')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Mongo connection error:', err))

const PORT = 5000
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`))
