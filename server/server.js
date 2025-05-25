const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const employeeRoutes = require('./routes/employees')
const loginRoutes = require('./routes/login')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/employees', employeeRoutes)
app.use('/api/login', loginRoutes)
app.use('api/me', employeeRoutes) 

mongoose.connect('mongodb://127.0.0.1:27017/IDM')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(' eror:', err))

const PORT = 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
