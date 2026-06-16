import { useState, useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Navigate } from 'react-router-dom'
import { googleLogin, login, selectUser, selectAuthChecked } from '../store/slices/authSlice'

const TC = '#C4704A'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function isAdminUser(user) {
  if (!user) return false
  const role = user.role || ''
  const roles = user.roles || []
  return role === 'ADMIN' || role === 'ROLE_ADMIN' ||
    roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')
}

const NOT_ADMIN = 'This account does not have admin access.'

/**
 * Dedicated, unlinked admin sign-in. Google OAuth is the primary method; a
 * collapsed email/password form is kept as an emergency fallback for recovery
 * and lockout scenarios. Customer-facing login never exposes email/password.
 */
export default function AdminLoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const authChecked = useSelector(selectAuthChecked)

  const [googleReady, setGoogleReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [showEmergency, setShowEmergency] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const googleBtn = useRef(null)

  const finishLogin = useCallback((payloadUser) => {
    if (isAdminUser(payloadUser)) navigate('/admin', { replace: true })
    else setError(NOT_ADMIN)
  }, [navigate])

  // ── Google credential callback ─────────────────────────────────
  const handleGoogleCredential = useCallback(async (response) => {
    setBusy(true); setError('')
    try {
      const data = await dispatch(googleLogin(response.credential)).unwrap()
      finishLogin(data.user)
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Google sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [dispatch, finishLogin])

  // ── Load Google Identity Services + render the real button ─────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const initGSI = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      })
      if (googleBtn.current) {
        window.google.accounts.id.renderButton(googleBtn.current, {
          type: 'standard', size: 'large', theme: 'outline',
          text: 'signin_with', shape: 'rectangular', width: 320,
        })
      }
      setGoogleReady(true)
    }

    if (window.google?.accounts?.id) { initGSI(); return }

    const existing = document.getElementById('gsi-client-script')
    if (existing) {
      existing.addEventListener('load', initGSI, { once: true })
      return () => existing.removeEventListener('load', initGSI)
    }

    const script = document.createElement('script')
    script.id = 'gsi-client-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.addEventListener('load', initGSI, { once: true })
    document.head.appendChild(script)
    return () => script.removeEventListener('load', initGSI)
  }, [handleGoogleCredential])

  // Already signed in as an admin → straight to the dashboard.
  if (authChecked && isAdminUser(user)) return <Navigate to="/admin" replace />

  const handleEmergency = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setBusy(true); setError('')
    try {
      const data = await dispatch(login({ email: email.trim(), password })).unwrap()
      finishLogin(data.user)
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Login failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 14,
    border: '1.5px solid #EDE4D8', background: '#FDFAF7', color: '#2C1A0E',
    outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(44,26,14,0.16)', overflow: 'hidden', border: '1px solid #EDE4D8' }} className="animate-fade-up">

        {/* Brand strip */}
        <div style={{ background: `linear-gradient(135deg, ${TC}, #A85A38)`, padding: '32px 32px 26px', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>🔐</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'white' }}>Pretty<span style={{ opacity: 0.75 }}>.</span>Crafted</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin Sign In</div>
        </div>

        <div style={{ padding: '28px 32px 32px' }}>
          {error && (
            <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C44A4A', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Google — primary */}
          <p style={{ fontSize: 14, color: '#6B4F3A', textAlign: 'center', lineHeight: 1.5, margin: '0 0 16px' }}>
            Sign in with your authorized Google account.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
            {GOOGLE_CLIENT_ID
              ? <div ref={googleBtn} style={{ opacity: googleReady && !busy ? 1 : 0.6, pointerEvents: busy ? 'none' : 'auto' }} />
              : <div style={{ fontSize: 12, color: '#9C7A63', textAlign: 'center' }}>Google Sign-In is not configured in this environment.</div>}
          </div>

          {/* Emergency email/password — collapsed by default */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 0' }}>
            <div style={{ flex: 1, height: 1, background: '#EDE4D8' }} />
            <button type="button" onClick={() => { setShowEmergency(v => !v); setError('') }}
              style={{ fontSize: 12, color: '#9C7A63', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
              {showEmergency ? 'Hide emergency login' : 'Emergency login'}
            </button>
            <div style={{ flex: 1, height: 1, background: '#EDE4D8' }} />
          </div>

          {showEmergency && (
            <form onSubmit={handleEmergency} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@email.com" required style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = '#EDE4D8'} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = '#EDE4D8'} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9C7A63', fontSize: 16, padding: 4, display: 'flex', alignItems: 'center' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={busy}
                style={{ marginTop: 4, padding: '14px', borderRadius: 99, border: 'none', background: busy ? '#EDE4D8' : TC, color: busy ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: busy ? 'default' : 'pointer', transition: 'all 0.2s', minHeight: 50 }}>
                {busy ? 'Please wait...' : 'Sign In →'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href="/" style={{ fontSize: 12, color: '#9C7A63', textDecoration: 'none' }}>← Back to store</a>
          </div>
        </div>
      </div>
    </div>
  )
}
