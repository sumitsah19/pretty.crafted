import { Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { selectIsLoggedIn, selectAuthChecked } from '../store/slices/authSlice'
import { openLogin } from '../store/slices/uiSlice'

export default function ProtectedRoute({ children }) {
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const authChecked = useSelector(selectAuthChecked)
  const dispatch = useDispatch()

  useEffect(() => {
    if (authChecked && !isLoggedIn) dispatch(openLogin())
  }, [authChecked, isLoggedIn, dispatch])

  // Wait for token validation before making any redirect decision
  if (!authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #EDE4D8', borderTopColor: '#C4704A', borderRadius: '50%' }} className="animate-spin-slow" />
      </div>
    )
  }

  if (!isLoggedIn) return <Navigate to="/" replace />
  return children
}
