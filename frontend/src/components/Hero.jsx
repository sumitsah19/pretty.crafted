import { useDispatch } from 'react-redux'
import { openBoxBuilder } from '../store/slices/uiSlice'
import { useWindowWidth } from '../hooks/useWindowWidth'

const TC = '#C4704A'

export default function Hero({ onScrollTo }) {
  const dispatch = useDispatch()
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024

  return (
    <section style={{
      padding: isMobile ? '48px 20px 56px' : isTablet ? '60px 32px 72px' : '96px 48px 104px',
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      minHeight: isMobile ? 0 : 540,
      width: '100%', boxSizing: 'border-box',
    }}>
      {/* Full-bleed background image */}
      <div style={{
        position: 'absolute', inset: 0,
        background: "url('/hero-giftbox2.png') right center / cover",
        backgroundColor: '#EDE8E0',
        pointerEvents: 'none',
      }} />

      {/* Left scrim — fades image out so text stays readable */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: isMobile
          ? 'linear-gradient(180deg, rgba(250,247,242,0.97) 0%, rgba(250,247,242,0.9) 48%, rgba(250,247,242,0.5) 100%)'
          : 'linear-gradient(100deg, rgba(250,247,242,0.97) 0%, rgba(250,247,242,0.93) 34%, rgba(250,247,242,0.5) 56%, rgba(250,247,242,0) 80%)',
      }} />

      {/* Text content */}
      <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : 600, textAlign: isMobile ? 'center' : 'left' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', border: `1.5px solid ${TC}20`, borderRadius: 99, padding: '6px 14px', fontSize: 11, color: TC, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
          ✦ Handcrafted with Love
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 'clamp(32px,8vw,42px)' : 'clamp(38px,5vw,62px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 16, color: '#2C1A0E', textWrap: 'balance' }}>
          Gifts That Feel Like a Hug
          <span style={{ display: 'block', fontFamily: "'DM Sans',sans-serif", fontSize: '0.38em', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TC, marginTop: 10 }}>
            by Prettycrafted
          </span>
        </h1>
        <p style={{ fontSize: isMobile ? 16 : 18, color: '#6B4F3A', lineHeight: 1.65, marginBottom: 28, maxWidth: isMobile ? '100%' : 440 }}>
          Handcrafted with love, curated for the people who matter most.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <a href="/gift-boxes" onClick={e => { e.preventDefault(); dispatch(openBoxBuilder()) }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '14px 24px' : '16px 32px', borderRadius: 99, background: TC, color: 'white', fontWeight: 700, fontSize: isMobile ? 14 : 15, cursor: 'pointer', boxShadow: '0 6px 24px rgba(196,112,74,0.35)', transition: 'all 0.2s', minHeight: 48, textDecoration: 'none' }}>
            🎁 Build Your Gift Box
          </a>
          <a href="/shop" onClick={e => { e.preventDefault(); onScrollTo?.('featured-collection') }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '14px 22px' : '16px 32px', borderRadius: 99, border: '1.5px solid #D9CBBF', background: 'white', color: '#2C1A0E', fontWeight: 600, fontSize: isMobile ? 14 : 15, cursor: 'pointer', minHeight: 48, textDecoration: 'none' }}>
            Shop Now
          </a>
        </div>
      </div>
    </section>
  )
}
