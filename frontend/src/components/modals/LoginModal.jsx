import { useState, useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { googleLogin, otpLogin, clearError } from '../../store/slices/authSlice'
import { closeLogin } from '../../store/slices/uiSlice'

const TC = '#C4704A'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// MSG91 OTP widget. Widget ID + Token Auth are public, widget-scoped values
// (safe in the frontend); the secret AuthKey lives only on the backend.
const MSG91_WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID || '36666d6e7743373331303331'
const MSG91_TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH
// DOM id MSG91 renders its anti-abuse captcha into. Without a valid target the
// widget's captcha render callback throws — so it must always exist in the DOM.
const MSG91_CAPTCHA_ID = 'msg91-captcha'
const RESEND_COOLDOWN = 30 // seconds before "Resend OTP" re-enables

export default function LoginModal() {
  const dispatch = useDispatch()
  const { error } = useSelector((s) => s.auth)

  const [done, setDone] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')

  // Customer auth is Google or Phone OTP only — no email/password.
  const [view, setView] = useState('main') // 'main' | 'phone'

  // ── Phone OTP (MSG91 widget) state ─────────────────────────────
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [msg91Ready, setMsg91Ready] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const resendTimer = useRef(null)

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

  // ── Load MSG91 OTP widget + expose sendOtp / verifyOtp / retryOtp ──
  useEffect(() => {
    if (!MSG91_TOKEN_AUTH) return

    const initWidget = () => {
      if (typeof window.initSendOTP !== 'function') return
      window.initSendOTP({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        exposeMethods: true, // attaches window.sendOtp / verifyOtp / retryOtp
        captchaRenderId: MSG91_CAPTCHA_ID, // valid render target so captcha doesn't throw
        success: () => {},   // per-call callbacks below drive the flow
        failure: () => {},
      })
      setMsg91Ready(true)
    }

    if (typeof window.initSendOTP === 'function') { initWidget(); return }

    const existing = document.getElementById('msg91-otp-script')
    if (existing) {
      existing.addEventListener('load', initWidget, { once: true })
      return () => existing.removeEventListener('load', initWidget)
    }

    const script = document.createElement('script')
    script.id = 'msg91-otp-script'
    script.src = 'https://verify.msg91.com/otp-provider.js'
    script.async = true
    script.addEventListener('load', initWidget, { once: true })
    document.body.appendChild(script)
    return () => script.removeEventListener('load', initWidget)
  }, [])

  // Clear the resend countdown timer on unmount
  useEffect(() => () => { if (resendTimer.current) clearInterval(resendTimer.current) }, [])

  const startResendCooldown = () => {
    setResendIn(RESEND_COOLDOWN)
    if (resendTimer.current) clearInterval(resendTimer.current)
    resendTimer.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) { clearInterval(resendTimer.current); return 0 }
        return s - 1
      })
    }, 1000)
  }

  const handleSendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) { setOtpError('Enter a valid 10-digit Indian mobile number'); return }
    if (!msg91Ready || typeof window.sendOtp !== 'function') {
      setOtpError('OTP service is still loading — please wait a moment.'); return
    }
    setOtpError(''); setOtpLoading(true)
    window.sendOtp(
      '91' + mobile,
      () => { setOtpLoading(false); setOtpSent(true); setOtp(''); setView('phone'); startResendCooldown() },
      (err) => { setOtpLoading(false); setOtpError(err?.message || 'Could not send OTP. Please try again.') },
    )
  }

  const handleVerifyOtp = () => {
    if (!/^\d{4,6}$/.test(otp)) { setOtpError('Enter the OTP you received'); return }
    if (typeof window.verifyOtp !== 'function') { setOtpError('OTP service unavailable. Please retry.'); return }
    setOtpError(''); setOtpLoading(true)
    window.verifyOtp(
      otp,
      async (data) => {
        // On success MSG91 returns the access token in data.message
        const accessToken = data?.message
        if (!accessToken) { setOtpLoading(false); setOtpError('Verification failed. Please try again.'); return }
        try {
          await dispatch(otpLogin({ accessToken, phone: mobile })).unwrap()
          setDone(true); setView('main')
          setTimeout(() => dispatch(closeLogin()), 1000)
        } catch (e) {
          setOtpError(typeof e === 'string' ? e : 'Login failed. Please try again.')
        } finally {
          setOtpLoading(false)
        }
      },
      (err) => { setOtpLoading(false); setOtpError(err?.message || 'Invalid OTP. Please try again.') },
    )
  }

  const handleResendOtp = () => {
    if (resendIn > 0 || typeof window.retryOtp !== 'function') return
    setOtpError('')
    window.retryOtp(
      '11', // MSG91 channel: '11'=SMS, '4'=Voice, '3'=Email, '12'=WhatsApp (mandatory)
      () => startResendCooldown(),
      (err) => setOtpError(err?.message || 'Could not resend OTP.'),
    )
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 14,
    border: '1.5px solid #EDE4D8', background: '#FDFAF7', color: '#2C1A0E',
    outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s',
  }

  // zIndex above every other modal (box builder 1200, drawers 1201): login can be
  // requested mid-flow and must overlay the still-mounted modal underneath.
  return (
    <div className="modal-backdrop" style={{ zIndex: 1300 }} onClick={(e) => e.target === e.currentTarget && dispatch(closeLogin())}>
      <div style={{ background: '#FAF7F2', borderRadius: 24, width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(44,26,14,0.22)', overflow: 'hidden' }} className="animate-fade-up">

        {/* Brand strip */}
        <div style={{ background: `linear-gradient(135deg, ${TC}, #A85A38)`, padding: '28px 32px 24px', textAlign: 'center', position: 'relative' }}>
          <button onClick={() => dispatch(closeLogin())} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🎁</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'white' }}>Pretty<span style={{ opacity: 0.75 }}>.</span>Crafted</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            {view === 'phone' ? 'Sign in with your mobile' : 'Your gifting account'}
          </div>
        </div>

        {/* ── PHONE / OTP VIEW ── */}
        {view === 'phone' && (
          <div style={{ padding: '28px 32px 32px' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>Welcome!</div>
                <div style={{ color: '#9C7A63', fontSize: 14, marginTop: 6 }}>Redirecting you...</div>
              </div>
            ) : (
              <>
                <button type="button" onClick={() => { setView('main'); setOtpError(''); dispatch(clearError()) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9C7A63', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 20, fontFamily: "'DM Sans',sans-serif" }}>
                  ← Back to Sign In
                </button>

                <p style={{ fontSize: 14, color: '#6B4F3A', marginBottom: 20, lineHeight: 1.5 }}>
                  {otpSent
                    ? <>Enter the OTP sent to <strong style={{ color: '#2C1A0E' }}>+91 {mobile}</strong>.</>
                    : 'We\'ll send a one-time password to your mobile number.'}
                </p>

                {/* Mobile number */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Mobile Number</label>
                  <div style={{ display: 'flex', alignItems: 'stretch', border: '1.5px solid #EDE4D8', borderRadius: 12, background: '#FDFAF7', overflow: 'hidden' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14, fontWeight: 600, color: '#6B4F3A', background: '#F3ECE3', borderRight: '1.5px solid #EDE4D8' }}>+91</span>
                    <input
                      type="tel" inputMode="numeric" value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number" disabled={otpSent} autoFocus
                      style={{ flex: 1, padding: '13px 16px', fontSize: 14, border: 'none', outline: 'none', background: 'transparent', color: '#2C1A0E', fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.04em' }} />
                    {otpSent && (
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setOtpError(''); setResendIn(0) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: TC, fontSize: 12, fontWeight: 600, padding: '0 14px', fontFamily: "'DM Sans',sans-serif" }}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP input — shown once an OTP has been sent */}
                {otpSent && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Enter OTP</label>
                    <input
                      type="tel" inputMode="numeric" value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••" autoFocus style={{ ...inputStyle, letterSpacing: '0.5em', textAlign: 'center', fontSize: 18 }}
                      onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = '#EDE4D8'} />
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <button type="button" onClick={handleResendOtp} disabled={resendIn > 0}
                        style={{ background: 'none', border: 'none', cursor: resendIn > 0 ? 'default' : 'pointer', color: resendIn > 0 ? '#9C7A63' : TC, fontSize: 12, fontWeight: 600, padding: 0, fontFamily: "'DM Sans',sans-serif", textDecoration: resendIn > 0 ? 'none' : 'underline' }}>
                        {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}

                {otpError && (
                  <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C44A4A', marginBottom: 14 }}>
                    {otpError}
                  </div>
                )}

                {!otpSent ? (
                  <button type="button" onClick={handleSendOtp} disabled={otpLoading || !msg91Ready}
                    style={{ width: '100%', padding: '14px', borderRadius: 99, border: 'none', background: (otpLoading || !msg91Ready) ? '#EDE4D8' : TC, color: (otpLoading || !msg91Ready) ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: (otpLoading || !msg91Ready) ? 'default' : 'pointer', transition: 'all 0.2s', minHeight: 50 }}>
                    {otpLoading ? 'Sending OTP...' : msg91Ready ? 'Send OTP →' : 'Loading...'}
                  </button>
                ) : (
                  <button type="button" onClick={handleVerifyOtp} disabled={otpLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: 99, border: 'none', background: otpLoading ? '#EDE4D8' : TC, color: otpLoading ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: otpLoading ? 'default' : 'pointer', transition: 'all 0.2s', minHeight: 50 }}>
                    {otpLoading ? 'Verifying...' : 'Verify & Continue →'}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── MAIN VIEW — Google + Phone OTP only ── */}
        {view === 'main' && <div style={{ padding: '28px 32px 32px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>Welcome!</div>
              <div style={{ color: '#9C7A63', fontSize: 14, marginTop: 6 }}>Redirecting you...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: '#6B4F3A', textAlign: 'center', lineHeight: 1.5, margin: '0 0 4px' }}>
                Login or sign up in seconds — no password needed.
              </p>

              {/* Mobile number — primary; Continue sends the OTP */}
              {MSG91_TOKEN_AUTH && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Mobile Number</label>
                  <div style={{ display: 'flex', alignItems: 'stretch', border: '1.5px solid #EDE4D8', borderRadius: 12, background: '#FDFAF7', overflow: 'hidden' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14, fontWeight: 600, color: '#6B4F3A', background: '#F3ECE3', borderRight: '1.5px solid #EDE4D8' }}>+91</span>
                    <input
                      type="tel" inputMode="numeric" value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp() }}
                      placeholder="Mobile number" autoFocus
                      style={{ flex: 1, padding: '13px 16px', fontSize: 14, border: 'none', outline: 'none', background: 'transparent', color: '#2C1A0E', fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.04em' }} />
                  </div>
                </div>
              )}

              {(error || googleError || otpError) && (
                <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C44A4A' }}>
                  {error || googleError || otpError}
                </div>
              )}

              {MSG91_TOKEN_AUTH && (
                <button type="button" onClick={handleSendOtp} disabled={otpLoading || !msg91Ready}
                  style={{ width: '100%', padding: '14px', borderRadius: 99, border: 'none', background: (otpLoading || !msg91Ready) ? '#EDE4D8' : TC, color: (otpLoading || !msg91Ready) ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: (otpLoading || !msg91Ready) ? 'default' : 'pointer', transition: 'all 0.2s', minHeight: 50 }}>
                  {otpLoading ? 'Sending OTP...' : msg91Ready ? 'Continue →' : 'Loading...'}
                </button>
              )}

              {/* Divider — only when both methods are available */}
              {MSG91_TOKEN_AUTH && GOOGLE_CLIENT_ID && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#EDE4D8' }} />
                  <span style={{ fontSize: 12, color: '#9C7A63' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: '#EDE4D8' }} />
                </div>
              )}

              {/* Google Sign-In */}
              {GOOGLE_CLIENT_ID && <div style={{ position: 'relative' }}>
                <div ref={hiddenGoogleBtn} aria-hidden="true"
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }} />
                <button type="button" onClick={handleGoogleClick} disabled={!googleReady || googleLoading}
                  style={{ width: '100%', padding: '13px 8px', borderRadius: 12, border: `1.5px solid ${!googleReady ? '#EDE4D8' : '#d0ccc8'}`, background: 'white', cursor: (!googleReady || googleLoading) ? 'default' : 'pointer', fontWeight: 600, fontSize: 14, color: googleLoading ? '#9C7A63' : '#4285F4', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 0.2s', opacity: !googleReady ? 0.6 : 1 }}
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
              </div>}

              {!GOOGLE_CLIENT_ID && !MSG91_TOKEN_AUTH && (
                <div style={{ fontSize: 11, color: '#9C7A63', textAlign: 'center' }}>
                  No sign-in methods are configured in this environment
                </div>
              )}
            </div>
          )}
        </div>}

        {/* MSG91 anti-abuse captcha target — must stay mounted across views so
            both sendOtp (main) and retryOtp (phone) have a valid render target.
            Empty (0 height) unless the widget actually renders a captcha. */}
        <div id={MSG91_CAPTCHA_ID} style={{ display: 'flex', justifyContent: 'center', padding: '0 32px' }} />
      </div>
    </div>
  )
}
