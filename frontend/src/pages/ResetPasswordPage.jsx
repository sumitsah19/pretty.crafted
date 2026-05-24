import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { openLogin } from '../store/slices/uiSlice'
import { authApi } from '../api/services'

const TC = '#C4704A'

const inputStyle = {
  width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 14,
  border: '1.5px solid #EDE4D8', background: '#FDFAF7', color: '#2C1A0E',
  outline: 'none', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box',
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState('form') // 'form' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  // No token in URL → invalid link
  if (!token) {
    return (
      <PageShell>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
        <h2 style={headingStyle}>Invalid Reset Link</h2>
        <p style={subStyle}>This password reset link is missing or invalid. Please request a new one.</p>
        <BackButton onClick={() => { navigate('/'); setTimeout(() => dispatch(openLogin()), 100) }}>
          Back to Sign In
        </BackButton>
      </PageShell>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg("Passwords don't match.")
      return
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.')
      return
    }
    setErrorMsg('')
    setStatus('loading')
    try {
      await authApi.resetPassword(token, password)
      setStatus('success')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || 'This link has expired or already been used. Please request a new one.'
      setStatus('error')
      setErrorMsg(typeof msg === 'string' ? msg : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <PageShell>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={headingStyle}>Password Reset!</h2>
        <p style={subStyle}>Your password has been updated successfully. You can now sign in with your new password.</p>
        <BackButton onClick={() => { navigate('/'); setTimeout(() => dispatch(openLogin()), 100) }}>
          Sign In Now
        </BackButton>
      </PageShell>
    )
  }

  if (status === 'error') {
    return (
      <PageShell>
        <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
        <h2 style={headingStyle}>Link Expired</h2>
        <p style={{ color: '#C44A4A', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>{errorMsg}</p>
        <BackButton onClick={() => { navigate('/'); setTimeout(() => dispatch(openLogin()), 100) }}>
          Request New Link
        </BackButton>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <h2 style={{ ...headingStyle, marginBottom: 8 }}>Set New Password</h2>
      <p style={{ ...subStyle, marginBottom: 28 }}>Choose a strong password for your Pretty.Crafted account.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
        <div>
          <label style={labelStyle}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoFocus
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={(e) => e.target.style.borderColor = TC}
              onBlur={(e) => e.target.style.borderColor = '#EDE4D8'}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9C7A63', fontSize: 16, padding: 4 }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Confirm Password</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
            required
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = TC}
            onBlur={(e) => e.target.style.borderColor = '#EDE4D8'}
          />
        </div>

        {/* Password strength hint */}
        {password.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {[8, 12, 16].map((threshold, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: password.length >= threshold ? (i === 0 ? '#F59E0B' : i === 1 ? '#3B82F6' : '#22C55E') : '#EDE4D8', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C44A4A' }}>
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{ padding: '14px', borderRadius: 99, border: 'none', background: status === 'loading' ? '#EDE4D8' : TC, color: status === 'loading' ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: status === 'loading' ? 'default' : 'pointer', transition: 'all 0.2s', minHeight: 50 }}>
          {status === 'loading' ? 'Saving...' : 'Save New Password →'}
        </button>
      </form>
    </PageShell>
  )
}

// ── Shared layout helpers ──────────────────────────────────────────

function PageShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(44,26,14,0.1)' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#2C1A0E', marginBottom: 32 }}>
          Pretty<span style={{ color: TC }}>.</span>Crafted
        </div>
        {children}
      </div>
    </div>
  )
}

function BackButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '13px 32px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
      {children}
    </button>
  )
}

const headingStyle = {
  fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#2C1A0E', marginBottom: 8,
}
const subStyle = {
  color: '#6B4F3A', fontSize: 14, lineHeight: 1.6, marginBottom: 28,
}
const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6,
}
