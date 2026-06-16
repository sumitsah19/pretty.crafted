import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUser, selectIsLoggedIn, selectAuthChecked } from '../store/slices/authSlice'

function hasAdminRole(user) {
  if (!user) return false
  const role = user.role || ''
  const roles = user.roles || []
  return role === 'ADMIN' || role === 'ROLE_ADMIN' ||
    roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')
}

export default function AdminProtectedRoute({ children }) {
  const authChecked = useSelector(selectAuthChecked)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const user = useSelector(selectUser)

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #EDE4D8', borderTopColor: '#C4704A', borderRadius: '50%' }} className="animate-spin-slow" />
      </div>
    )
  }

  if (!isLoggedIn || !hasAdminRole(user)) return <Navigate to="/admin/login" replace />

  return children
}
