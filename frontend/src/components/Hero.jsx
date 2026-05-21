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
      padding: isMobile ? '48px 20px 56px' : isTablet ? '60px 32px 72px' : '80px 48px 100px',
      background: 'linear-gradient(135deg, #F5EDE0 0%, #FAF7F2 50%, #EDE8E0 100%)',
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'center', gap: isMobile ? 40 : 60,
      position: 'relative', overflow: 'hidden',
      width: '100%', boxSizing: 'border-box',
    }}>
      <div style={{ position: 'absolute', top: -80, right: 120, width: 300, height: 300, borderRadius: '50%', background: 'rgba(196,112,74,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: 80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(122,154,107,0.08)', pointerEvents: 'none' }} />

      <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 560, textAlign: isMobile ? 'center' : 'left' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', border: `1.5px solid ${TC}20`, borderRadius: 99, padding: '6px 14px', fontSize: 11, color: TC, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
          ✦ Handcrafted with Love
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 'clamp(32px,8vw,42px)' : 'clamp(38px,5vw,62px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 16, color: '#2C1A0E' }}>
          Gifts That Feel Like a Hug
        </h1>
        <p style={{ fontSize: isMobile ? 16 : 18, color: '#6B4F3A', lineHeight: 1.65, marginBottom: 28, maxWidth: isMobile ? '100%' : 440 }}>
          Handcrafted with love, curated for the people who matter most.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <button onClick={() => dispatch(openBoxBuilder())}
            style={{ padding: isMobile ? '14px 24px' : '16px 32px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: isMobile ? 14 : 15, cursor: 'pointer', boxShadow: '0 6px 24px rgba(196,112,74,0.35)', transition: 'all 0.2s', minHeight: 48 }}>
            🎁 Build Your Gift Box
          </button>
          <button onClick={() => onScrollTo?.('featured-collection')}
            style={{ padding: isMobile ? '14px 22px' : '16px 32px', borderRadius: 99, border: '1.5px solid #D9CBBF', background: 'white', color: '#2C1A0E', fontWeight: 600, fontSize: isMobile ? 14 : 15, cursor: 'pointer', minHeight: 48 }}>
            Shop Now
          </button>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 16 : 24, marginTop: 32, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          {[['🤲', 'Handcrafted'], ['🌿', 'Eco Packaging'], ['💌', 'Gift Wrapping'], ['⭐', '4.9 Reviews']].map(([e, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: isMobile ? 12 : 13, color: '#6B4F3A', fontWeight: 500 }}>
              <span>{e}</span><span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="float-anim" style={{ width: isTablet ? 240 : 320, height: isTablet ? 240 : 320, background: 'white', borderRadius: '30% 70% 60% 40% / 50% 40% 60% 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 80px rgba(196,112,74,0.18)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: isTablet ? 72 : 100 }}>🎁</div>
            {[{ e: '🕯️', x: '-30%', y: '-30%' }, { e: '💍', x: '110%', y: '-20%' }, { e: '🌿', x: '-35%', y: '70%' }, { e: '☕', x: '110%', y: '65%' }].map((item, i) => (
              <div key={i} style={{ position: 'absolute', left: item.x, top: item.y, background: 'white', borderRadius: '50%', width: isTablet ? 44 : 54, height: isTablet ? 44 : 54, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isTablet ? 18 : 24, boxShadow: '0 4px 16px rgba(44,26,14,0.12)', animation: `float ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }}>
                {item.e}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
