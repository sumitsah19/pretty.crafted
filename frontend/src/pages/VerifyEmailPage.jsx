import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { verifyEmail } from '../store/slices/authSlice'

const TC = '#C4704A'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // A missing token is known before the first render — start in the error state directly.
  const token = searchParams.get('token')
  const [status, setStatus] = useState(token ? 'verifying' : 'error') // verifying | success | error
  const [errorMsg, setErrorMsg] = useState(token ? '' : 'Missing verification token.')

  useEffect(() => {
    if (!token) return

    dispatch(verifyEmail(token))
      .unwrap()
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err || 'Verification failed. The link may be expired or already used.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(44,26,14,0.1)' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#2C1A0E', marginBottom: 32 }}>
          Pretty<span style={{ color: TC }}>.</span>Crafted
        </div>

        {status === 'verifying' && (
          <>
            <div style={{ width: 48, height: 48, border: `4px solid #EDE4D8`, borderTopColor: TC, borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 17, fontWeight: 600, color: '#2C1A0E' }}>Verifying your email...</div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: '#2C1A0E', marginBottom: 8 }}>Email Verified!</div>
            <div style={{ color: '#6B4F3A', fontSize: 14, marginBottom: 32 }}>Your account is now fully active. You can start shopping.</div>
            <button
              onClick={() => navigate('/')}
              style={{ padding: '13px 32px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Go to Store
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: '#2C1A0E', marginBottom: 8 }}>Verification Failed</div>
            <div style={{ color: '#C44A4A', fontSize: 14, marginBottom: 32 }}>{errorMsg}</div>
            <button
              onClick={() => navigate('/')}
              style={{ padding: '13px 32px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Back to Store
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
