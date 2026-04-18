import { Navigate } from 'react-router-dom'
import { getStoredUser } from '../hooks/useAuth'

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = getStoredUser()

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}
