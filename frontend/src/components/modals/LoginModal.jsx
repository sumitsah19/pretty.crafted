import { useState, useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login, register, googleLogin, clearError } from '../../store/slices/authSlice'
import { closeLogin } from '../../store/slices/uiSlice'
import { authApi } from '../../api/services'

const TC = '#C4704A'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function LoginModal() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((s) => s.auth)

  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')

  // ── Forgot password state ──────────────────────────────────────
  const [view, setView] = useState('main') // 'main' | 'forgot' | 'forgotSent'
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const hiddenGoogleBtn = useRef(null)

  // Close on Escape + lock body scroll while open (restoring whatever was set before)
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') dispatch(closeLogin()) }
    window.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [dispatch])

  // ── Google credential callback ─────────────────────────────────
  const handleGoogleCredential = useCallback(async (response) => {
    setGoogleLoading(true)
    setGoogleError('')
    try {
      await dispatch(googleLogin(response.credential)).unwrap()
      setDone(true)
      setTimeout(() => dispatch(closeLogin()), 1000)
    } catch (err) {
      setGoogleError(err || 'Google sign-in failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }, [dispatch])

  // ── Load Google Identity Services script ───────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const initGSI = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      })
      if (hiddenGoogleBtn.current) {
        window.google.accounts.id.renderButton(hiddenGoogleBtn.current, {
          type: 'standard', size: 'large', theme: 'outline',
          text: 'continue_with', shape: 'rectangular', width: 356,
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

  const handleGoogleClick = () => {
    if (!googleReady) return
    const btn = hiddenGoogleBtn.current?.querySelector('[role="button"]')
    if (btn) btn.click()
    else window.google?.accounts?.id?.prompt()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (tab === 'login') {
        await dispatch(login({ email, password })).unwrap()
      } else {
        await dispatch(register({ name, email, password })).unwrap()
      }
      setDone(true)
      setTimeout(() => dispatch(closeLogin()), 1000)
    } catch {
      // error stored in auth.error and displayed below
    }
  }

  const switchTab = (t) => {
    setTab(t)
    dispatch(clearError())
  }

  const openForgot = () => {
    setForgotEmail(email) // pre-fill with whatever was typed in the login form
    setForgotError('')
    setView('forgot')
    dispatch(clearError())
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    setForgotError('')
    try {
      await authApi.forgotPassword(forgotEmail.trim())
      setView('forgotSent')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || 'Something went wrong. Please try again.'
      setForgotError(typeof msg === 'string' ? msg : 'Something went wrong. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 14,
    border: '1.5px solid #EDE4D8', background: '#FDFAF7', color: '#2C1A0E',
    outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s',
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && dispatch(closeLogin())}>
      <div style={{ background: '#FAF7F2', borderRadius: 24, width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(44,26,14,0.22)', overflow: 'hidden' }} className="animate-fade-up">

        {/* Brand strip */}
        <div style={{ background: `linear-gradient(135deg, ${TC}, #A85A38)`, padding: '28px 32px 24px', textAlign: 'center', position: 'relative' }}>
          <button onClick={() => dispatch(closeLogin())} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🎁</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'white' }}>Pretty<span style={{ opacity: 0.75 }}>.</span>Crafted</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            {view === 'forgot' || view === 'forgotSent' ? 'Reset your password' : 'Your gifting account'}
          </div>
        </div>

        {/* ── FORGOT PASSWORD VIEW ── */}
        {view === 'forgot' && (
          <div style={{ padding: '28px 32px 32px' }}>
            <button type="button" onClick={() => setView('main')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9C7A63', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 20, fontFamily: "'DM Sans',sans-serif" }}>
              ← Back to Sign In
            </button>
            <p style={{ fontSize: 14, color: '#6B4F3A', marginBottom: 20, lineHeight: 1.5 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Email Address</label>
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@email.com" required autoFocus style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = '#EDE4D8'} />
              </div>
              {forgotError && (
                <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C44A4A' }}>
                  {forgotError}
                </div>
              )}
              <button type="submit" disabled={forgotLoading}
                style={{ padding: '14px', borderRadius: 99, border: 'none', background: forgotLoading ? '#EDE4D8' : TC, color: forgotLoading ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: forgotLoading ? 'default' : 'pointer', transition: 'all 0.2s', minHeight: 50 }}>
                {forgotLoading ? 'Sending...' : 'Send Reset Link →'}
              </button>
            </form>
          </div>
        )}

        {/* ── FORGOT PASSWORD SENT VIEW ── */}
        {view === 'forgotSent' && (
          <div style={{ padding: '28px 32px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#2C1A0E', marginBottom: 10 }}>
              Check your inbox!
            </div>
            <p style={{ fontSize: 14, color: '#6B4F3A', lineHeight: 1.6, marginBottom: 24 }}>
              We've sent a password reset link to <strong>{forgotEmail}</strong>.
              The link expires in 1 hour.
            </p>
            <p style={{ fontSize: 12, color: '#9C7A63', marginBottom: 24 }}>
              Didn't get the email? Check your spam folder, or{' '}
              <button type="button" onClick={() => { setView('forgot'); setForgotError('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: TC, fontSize: 12, padding: 0, fontFamily: "'DM Sans',sans-serif", textDecoration: 'underline' }}>
                try again
              </button>.
            </p>
            <button type="button" onClick={() => setView('main')}
              style={{ padding: '12px 32px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'none', color: TC, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Back to Sign In
            </button>
          </div>
        )}

        {/* ── TABS (hidden when in forgot flow) ── */}
        {view === 'main' && (
          <div style={{ display: 'flex', borderBottom: '1px solid #EDE4D8' }}>
            {[['login', 'Sign In'], ['signup', 'Create Account']].map(([t, label]) => (
              <button key={t} onClick={() => switchTab(t)}
                style={{ flex: 1, padding: '14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', color: tab === t ? TC : '#9C7A63', borderBottom: tab === t ? `2px solid ${TC}` : '2px solid transparent', marginBottom: -1 }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        {view === 'main' && <div style={{ padding: '28px 32px 32px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>{tab === 'login' ? 'Welcome back!' : 'Account created!'}</div>
              <div style={{ color: '#9C7A63', fontSize: 14, marginTop: 6 }}>Redirecting you...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tab === 'signup' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = '#EDE4D8'} />
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = '#EDE4D8'} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A' }}>Password</label>
                  {tab === 'login' && (
                    <button type="button" onClick={openForgot}
                      style={{ fontSize: 12, color: TC, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans',sans-serif", textDecoration: 'underline' }}>
                      Forgot password?
                    </button>
                  )}
                </div>
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

              {(error || googleError) && (
                <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C44A4A' }}>
                  {error || googleError}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ marginTop: 4, padding: '14px', borderRadius: 99, border: 'none', background: loading ? '#EDE4D8' : TC, color: loading ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s', minHeight: 50 }}>
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#EDE4D8' }} />
                <span style={{ fontSize: 12, color: '#9C7A63' }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: '#EDE4D8' }} />
              </div>

              {/* Google Sign-In */}
              <div style={{ position: 'relative' }}>
                <div ref={hiddenGoogleBtn} aria-hidden="true"
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }} />
                <button type="button" onClick={handleGoogleClick} disabled={!googleReady || googleLoading}
                  style={{ width: '100%', padding: '11px 8px', borderRadius: 12, border: `1.5px solid ${!googleReady ? '#EDE4D8' : '#d0ccc8'}`, background: 'white', cursor: (!googleReady || googleLoading) ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, color: googleLoading ? '#9C7A63' : '#4285F4', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 0.2s', opacity: !googleReady ? 0.6 : 1 }}
                  onMouseEnter={(e) => { if (googleReady && !googleLoading) e.currentTarget.style.borderColor = '#4285F4' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d0ccc8' }}>
                  {googleLoading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: '2px solid #EDE4D8', borderTopColor: '#4285F4', borderRadius: '50%' }} className="animate-spin-slow" />
                      Signing in with Google...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      {googleReady ? 'Continue with Google' : 'Loading Google Sign-In...'}
                    </>
                  )}
                </button>
              </div>

              {!GOOGLE_CLIENT_ID && (
                <div style={{ fontSize: 11, color: '#9C7A63', textAlign: 'center', marginTop: -8 }}>
                  Google Sign-In is not configured in this environment
                </div>
              )}
            </form>
          )}
        </div>}
      </div>
    </div>
  )
}
