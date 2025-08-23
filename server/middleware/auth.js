const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    console.warn('🔴 No Authorization header')
    return res.status(403).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'verySecretKey')
    console.log('✅ Token verified:', decoded)
    req.user = decoded
    next()
  } catch (err) {
    console.error('❌ Token verification failed:', err.message)
    return res.status(403).json({ error: 'Invalid token' })
  }
}
