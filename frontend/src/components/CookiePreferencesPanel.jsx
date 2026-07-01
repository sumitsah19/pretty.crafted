import { useState } from 'react'
import { COOKIE_CATEGORIES, getCookieConsent, saveCookieConsent } from '../utils/cookieConsent'
import { setAnalyticsConsent } from '../analytics'

const TC = '#C4704A'
const DARK = '#2C1A0E'
const MID = '#6B4F3A'
const LIGHT = '#9C7A63'
const BEIGE = '#EDE4D8'
const SAGE = '#7A9A6B'

function initialPrefs() {
  const saved = getCookieConsent()
  return {
    functional: saved?.functional ?? false,
    analytics: saved?.analytics ?? false,
    marketing: saved?.marketing ?? false,
  }
}

function Toggle({ checked, disabled, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44, height: 26, borderRadius: 99, border: 'none', padding: 0, flexShrink: 0,
        background: checked ? TC : '#D9CBBF', position: 'relative',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.65 : 1, transition: 'background 0.2s',
      }}>
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
        background: 'white', boxShadow: '0 1px 3px rgba(44,26,14,0.25)', transition: 'left 0.2s',
      }} />
    </button>
  )
}

// Interactive cookie preference center — reachable from the Cookie Policy &
// Settings page. Persists to localStorage (see utils/cookieConsent.js) and
// gates PostHog analytics via setAnalyticsConsent (see analytics.js).
export default function CookiePreferencesPanel() {
  const [prefs, setPrefs] = useState(initialPrefs)
  const [saved, setSaved] = useState(false)

  const set = (key, val) => setPrefs(p => ({ ...p, [key]: val }))

  const persist = (next) => {
    saveCookieConsent(next)
    setAnalyticsConsent(next.analytics)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const save = () => persist(prefs)
  const acceptAll = () => { const next = { functional: true, analytics: true, marketing: true }; setPrefs(next); persist(next) }
  const rejectAll = () => { const next = { functional: false, analytics: false, marketing: false }; setPrefs(next); persist(next) }

  return (
    <div style={{ marginTop: 48, background: 'white', borderRadius: 20, border: `1px solid ${BEIGE}`, padding: '28px 26px', boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 6 }}>Manage Cookie Preferences</h2>
      <p style={{ fontSize: 13, color: LIGHT, marginBottom: 22, lineHeight: 1.6 }}>Choose which categories of cookies you're comfortable with. Essential cookies are always on since the site can't function without them.</p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {COOKIE_CATEGORIES.map((cat, i) => (
          <div key={cat.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0', borderBottom: i < COOKIE_CATEGORIES.length - 1 ? `1px solid ${BEIGE}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 4 }}>
                {cat.label}
                {cat.locked && <span style={{ fontSize: 11, fontWeight: 700, color: SAGE, marginLeft: 8 }}>Always on</span>}
              </div>
              <div style={{ fontSize: 12.5, color: MID, lineHeight: 1.6 }}>{cat.description}</div>
            </div>
            <Toggle checked={cat.locked ? true : !!prefs[cat.key]} disabled={cat.locked} onChange={v => set(cat.key, v)} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <button onClick={rejectAll} style={{ flex: '1 1 auto', padding: '12px 18px', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reject Non-Essential</button>
        <button onClick={acceptAll} style={{ flex: '1 1 auto', padding: '12px 18px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Accept All</button>
        <button onClick={save} style={{ flex: '1 1 auto', padding: '12px 18px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save Preferences</button>
      </div>

      {saved && <div style={{ marginTop: 14, fontSize: 13, color: '#3F7A2E', fontWeight: 700 }}>✓ Preferences saved</div>}
    </div>
  )
}
