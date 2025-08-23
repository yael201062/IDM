
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const Logout: React.FC = () => {
  const { logout } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    logout()
    // אפשר להראות הודעה קצרה עם state אם רוצים
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return null // לא צריך UI, הניתוב קורה מיד
}

export default Logout
