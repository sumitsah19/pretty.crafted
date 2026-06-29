import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { openBoxBuilder, openShop, setActiveProduct } from '../store/slices/uiSlice'
import { selectProducts } from '../store/slices/productsSlice'
import { useWindowWidth } from '../hooks/useWindowWidth'
import ProductCard, { ProductSkeleton } from './ui/ProductCard'
import { useProductFilters, ProductFilterBar } from './ui/ProductFilters'

/* ── Carousel cards ──────────────────────────────────────────
   A faithful port of the reference hero: a 3-card 3D carousel that
   auto-rotates in 120° steps, with the headline / eyebrow / subtext
   swapping to match whichever card is centred. Clicking the centred
   card opens the slide-up category overlay. */
const BASE_ANGLES = [0, 120, 240]

const CARDS = [
  {
    id: 0, src: '/hero/undraw_fatherhood_eldm.svg',
    label: 'For the Family', tagline: 'Moments they will treasure forever',
    badge: 'Bestseller', accent: '#e8a87c', shadow: 'rgba(232,168,124,0.45)',
    eyebrow: 'Perfect for Every Family', headline1: 'Give a Gift',
    headlineItalic: "They'll Cherish",
    subtext: 'Celebrate togetherness with keepsakes and experiences the whole family will treasure.',
    cta: 'Shop Family Gifts',
    // Family-friendly picks: anything for "everyone" or kids.
    match: p => p.recipient === 'anyone' || p.recipient === 'kids',
  },
  {
    id: 1, src: '/hero/undraw_cool-girl-avatar_fifz.svg',
    label: 'Gifts for Her', tagline: 'Thoughtfully curated, beautifully wrapped',
    badge: 'New Arrivals', accent: '#d97b8a', shadow: 'rgba(217,123,138,0.45)',
    eyebrow: 'Made for Her', headline1: 'Give a Gift',
    headlineItalic: "She'll Adore",
    subtext: 'Thoughtfully curated, beautifully wrapped gifts chosen with her heart in mind.',
    cta: 'Shop for Her',
    match: p => p.recipient === 'her',
  },
  {
    id: 2, src: '/hero/undraw_jewelry_39lx.svg',
    label: 'Fine Accessories', tagline: 'Timeless pieces for every occasion',
    badge: 'Premium', accent: '#c4a352', shadow: 'rgba(196,163,82,0.45)',
    eyebrow: 'Timeless Elegance', headline1: 'Give a Gift',
    headlineItalic: 'That Lasts',
    subtext: 'Exquisite accessories and fine jewellery for every milestone and occasion.',
    cta: 'Shop Accessories',
    match: p => /jewel|accessor/i.test(p.category || ''),
  },
]

const CAT_DATA = [
  {
    gradient: 'linear-gradient(160deg,#f7e8d8 0%,#fdf6ee 65%)',
    eyebrow: 'Gifts for Every Family', title: 'Made to be Shared',
    sub: 'Handcrafted treasures that bring families together — from cosy evenings to milestone moments.',
  },
  {
    gradient: 'linear-gradient(160deg,#f8dce8 0%,#fdf6ee 65%)',
    eyebrow: 'Gifts for Her', title: "She'll Absolutely Adore",
    sub: 'From delicate jewellery to botanical skincare — curated with her in mind, wrapped with love.',
  },
  {
    gradient: 'linear-gradient(160deg,#f5edcc 0%,#fdf6ee 65%)',
    eyebrow: 'Fine Accessories', title: 'Timeless. Handcrafted.',
    sub: "Exquisite pieces made to last — each one a little work of art for life's most special occasions.",
  },
]

function getConfig(w) {
  const mobile = w <= 860
  if (mobile) {
    const cardW = Math.min(230, w * 0.62)
    const radius = Math.round(cardW * 0.48)
    return { mobile: true, radius, sceneW: w, sceneH: 330, cardW, offset: Math.round(w / 2 - cardW / 2) }
  }
  return { mobile: false, radius: 220, sceneW: 560, sceneH: 400, cardW: 260, offset: 150 }
}

function styleFor(baseAngle, rotation, cfg) {
  const angle = ((baseAngle + rotation) % 360 + 360) % 360
  const rad = angle * Math.PI / 180
  const x = Math.sin(rad) * cfg.radius
  const z = Math.cos(rad) * cfg.radius
  const nz = (z + cfg.radius) / (2 * cfg.radius)
  return {
    x, z,
    scale: (cfg.mobile ? 0.55 : 0.62) + nz * (cfg.mobile ? 0.45 : 0.38),
    opacity: (cfg.mobile ? 0.18 : 0.30) + nz * (cfg.mobile ? 0.82 : 0.70),
    brightness: 0.55 + nz * 0.45,
  }
}

export default function Hero() {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const ww = useWindowWidth()
  const cfg = useMemo(() => getConfig(ww), [ww])
  const mobile = cfg.mobile

  const [rotation, setRotation] = useState(0)
  const [paused, setPaused] = useState(false)
  const [overlayIdx, setOverlayIdx] = useState(0) // which category's content is loaded
  const [overlayOpen, setOverlayOpen] = useState(false)
  const touchStartX = useRef(0)

  // The card whose face is nearest the viewer is "active".
  const activeIdx = useMemo(() => {
    let best = -Infinity, idx = 0
    BASE_ANGLES.forEach((b, i) => {
      const z = styleFor(b, rotation, cfg).z
      if (z > best) { best = z; idx = i }
    })
    return idx
  }, [rotation, cfg])

  // Headline copy fades out, swaps, fades back in when the active card changes.
  // copyShown is derived: it goes false the instant the active card changes (driving
  // the fade-out), then true again once displayIdx catches up after the delay.
  const [displayIdx, setDisplayIdx] = useState(0)
  const copyShown = displayIdx === activeIdx
  useEffect(() => {
    if (activeIdx === displayIdx) return
    const t = setTimeout(() => setDisplayIdx(activeIdx), 320)
    return () => clearTimeout(t)
  }, [activeIdx, displayIdx])

  // Auto-rotate one card every 3.2s unless hovered / swiping / overlay open.
  useEffect(() => {
    if (paused || overlayOpen) return
    const t = setInterval(() => setRotation(r => r - 120), 3200)
    return () => clearInterval(t)
  }, [paused, overlayOpen])

  // Lock body scroll while the category overlay is open.
  useEffect(() => {
    if (!overlayOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') setOverlayOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [overlayOpen])

  const goTo = useCallback(idx => {
    setRotation(r => {
      const cur = ((BASE_ANGLES[idx] + r) % 360 + 360) % 360
      return r + (cur <= 180 ? -cur : (360 - cur))
    })
  }, [])

  const onCardClick = idx => {
    if (idx === activeIdx) { setOverlayIdx(idx); setOverlayOpen(true) }
    else goTo(idx)
  }

  const card = CARDS[displayIdx]
  const px = mobile ? 24 : 56

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#fdf6ee', color: '#2a1a0e' }}>
      {/* soft mood tints */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(ellipse 80% 50% at 70% 50%, rgba(196,112,74,0.09), transparent 70%),' +
          'radial-gradient(ellipse 40% 60% at 15% 80%, rgba(232,168,124,0.07), transparent 60%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
        gridTemplateAreas: mobile
          ? '"htop" "hright" "hbottom"'
          : '"htop hright" "hbottom hright"',
        gridTemplateRows: mobile ? 'auto auto auto' : '1fr auto',
        alignItems: mobile ? undefined : 'stretch',
      }}>
        {/* ── TOP: eyebrow + headline + subtext ── */}
        <div style={{
          gridArea: 'htop',
          padding: mobile ? '44px 24px 20px' : '48px 56px 16px',
          display: 'flex', flexDirection: 'column',
          justifyContent: mobile ? 'flex-start' : 'center',
          alignItems: mobile ? 'center' : 'flex-start',
          textAlign: mobile ? 'center' : 'left',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: mobile ? 'center' : 'flex-start',
            opacity: copyShown ? 1 : 0,
            transform: copyShown ? 'translateY(0)' : 'translateY(-14px)',
            transition: 'opacity 0.32s ease, transform 0.32s ease',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 16px', borderRadius: 99,
              border: '1px solid #e0cdb8', background: '#f5e6d3',
              fontSize: 13, fontWeight: 500, color: '#7a5c40',
              marginBottom: 26, width: 'fit-content',
            }}>
              <span style={{ color: '#c4704a' }}>✦</span>
              <span>{card.eyebrow}</span>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: mobile ? 40 : 60, lineHeight: 1.06, fontWeight: 700,
              letterSpacing: '-0.02em', color: '#2a1a0e', margin: '0 0 20px',
            }}>
              {card.headline1}<br />
              <em style={{ fontStyle: 'italic', color: card.accent }}>{card.headlineItalic}</em>
            </h1>
            <p style={{
              fontSize: mobile ? 15 : 16, color: '#7a5c40', lineHeight: 1.68,
              maxWidth: mobile ? '100%' : 400, margin: 0,
            }}>{card.subtext}</p>
          </div>
        </div>

        {/* ── RIGHT: 3D carousel ── */}
        <div
          style={{
            gridArea: 'hright',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: mobile ? '20px 0 0' : '48px 20px',
            position: 'relative', zIndex: 2, width: mobile ? '100%' : undefined, overflow: 'hidden',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={e => { setPaused(true); touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            setPaused(false)
            const dx = e.changedTouches[0].clientX - touchStartX.current
            if (Math.abs(dx) > 40) setRotation(r => r + (dx > 0 ? 120 : -120))
          }}
        >
          <div style={{ position: 'relative', overflow: 'hidden', width: mobile ? '100%' : cfg.sceneW, height: cfg.sceneH }}>
            <div style={{ position: 'relative', width: cfg.sceneW, height: cfg.sceneH, margin: mobile ? '0 auto' : undefined }}>
              {CARDS.map((c, i) => {
                const s = styleFor(BASE_ANGLES[i], rotation, cfg)
                const isActive = i === activeIdx
                return (
                  <div
                    key={c.id}
                    onClick={() => onCardClick(i)}
                    style={{
                      position: 'absolute', top: '50%', left: 0, cursor: 'pointer',
                      width: cfg.cardW, marginTop: -Math.round(cfg.sceneH * 0.47),
                      transform: `translateX(${s.x + cfg.offset}px) scale(${s.scale})`,
                      opacity: s.opacity, filter: `brightness(${s.brightness})`,
                      zIndex: Math.round(s.z + cfg.radius),
                      transition: 'transform 0.9s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.85s ease, filter 0.85s ease',
                    }}
                  >
                    <div style={{
                      borderRadius: mobile ? 16 : 20, overflow: 'hidden',
                      background: '#fff8f0',
                      border: `1.5px solid ${isActive ? c.accent : '#e0cdb8'}`,
                      boxShadow: isActive
                        ? `0 20px 60px -10px ${c.shadow}, 0 4px 20px rgba(42,26,14,0.12)`
                        : '0 8px 32px rgba(42,26,14,0.08)',
                      transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
                    }}>
                      <div style={{
                        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', height: mobile ? 170 : 200,
                        background: `linear-gradient(135deg,${c.accent}28 0%,#fdf6ee 100%)`,
                      }}>
                        <span style={{
                          position: 'absolute', top: 10, left: 10, zIndex: 2,
                          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
                          color: '#fff8f0', whiteSpace: 'nowrap', background: c.accent,
                        }}>{c.badge}</span>
                        <img src={c.src} alt={c.label} draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 14 }} />
                      </div>
                      <div style={{ padding: mobile ? '12px 14px 16px' : '16px 18px 20px' }}>
                        <h3 style={{
                          fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#2a1a0e',
                          margin: '0 0 5px', fontSize: mobile ? 14 : 16,
                        }}>{c.label}</h3>
                        <p style={{ color: '#7a5c40', lineHeight: 1.45, fontSize: mobile ? 11.5 : 12.5, margin: 0 }}>{c.tagline}</p>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10,
                          fontWeight: 600, fontSize: mobile ? 11 : 12, color: c.accent,
                        }}>Explore →</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#7a5c40', marginTop: 10, minHeight: 20 }}>
            {CARDS[activeIdx].label}
          </div>
        </div>

        {/* ── BOTTOM: CTAs ── */}
        <div style={{
          gridArea: 'hbottom',
          padding: mobile ? '20px 24px 36px' : '24px 56px 56px',
          display: 'flex', flexDirection: 'column',
          alignItems: mobile ? 'center' : 'stretch',
        }}>
          <div style={{
            display: 'flex', gap: mobile ? 8 : 12,
            flexWrap: mobile ? 'nowrap' : 'wrap',
            justifyContent: mobile ? 'center' : 'flex-start',
            width: mobile ? '100%' : undefined,
          }}>
            <PrimaryBtn accent={card.accent} shadow={card.shadow} mobile={mobile}
              onClick={() => dispatch(openShop())}>
              {card.cta} {!mobile && <span style={{ display: 'inline-block' }}>→</span>}
            </PrimaryBtn>
            <SecondaryBtn mobile={mobile} onClick={() => dispatch(openBoxBuilder())}>
              Personalize Gift Box
            </SecondaryBtn>
          </div>
        </div>
      </div>

      {/* ── Category overlay ── */}
      <CategoryOverlay
        idx={overlayIdx}
        open={overlayOpen}
        products={products}
        onClose={() => setOverlayOpen(false)}
        onShop={() => { setOverlayOpen(false); dispatch(openShop()) }}
        onProductClick={p => { setOverlayOpen(false); dispatch(setActiveProduct(p)) }}
        px={px}
      />
    </div>
  )
}

function PrimaryBtn({ children, accent, shadow, mobile, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: mobile ? '13px 20px' : '13px 14px', borderRadius: 99, border: 'none',
        color: '#fdf6ee', fontWeight: 600, fontSize: mobile ? 13 : 14, fontFamily: 'inherit',
        cursor: 'pointer', whiteSpace: 'nowrap', background: accent,
        boxShadow: `0 8px 24px -6px ${shadow}`,
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'background 0.4s ease, box-shadow 0.4s ease, transform 0.2s ease',
      }}
    >{children}</button>
  )
}

function SecondaryBtn({ children, mobile, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center',
        padding: mobile ? '13px 20px' : '13px 14px', borderRadius: 99,
        background: hover ? '#f5e6d3' : 'transparent', color: '#2a1a0e',
        fontWeight: 500, fontSize: mobile ? 13 : 14, fontFamily: 'inherit',
        border: '1.5px solid #e0cdb8', cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'background 0.18s',
      }}
    >{children}</button>
  )
}

function CategoryOverlay({ idx, open, products, onClose, onShop, onProductClick, px }) {
  const data = CAT_DATA[idx]
  const card = CARDS[idx]

  // Real backend products for this category; fall back to the full catalogue
  // if nothing matches the filter, so the grid is never empty.
  const categoryProducts = useMemo(() => {
    const matched = products.filter(card.match)
    return matched.length ? matched : products
  }, [products, card])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200, background: '#fdf6ee', overflowY: 'auto',
      transform: open ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
      pointerEvents: open ? 'auto' : 'none',
    }}>
      <div style={{
        position: 'relative', minHeight: 320, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end', padding: '48px 32px 40px',
        textAlign: 'center', background: data.gradient,
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          color: '#2a1a0e', boxShadow: '0 2px 12px rgba(42,26,14,0.12)',
        }}>✕</button>
        <img src={card.src} alt={card.label} style={{ width: 160, height: 160, objectFit: 'contain', marginBottom: 12 }} />
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10, color: card.accent }}>{data.eyebrow}</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, lineHeight: 1.08, color: '#2a1a0e', margin: '0 0 12px' }}>{data.title}</h2>
        <p style={{ fontSize: 15, color: '#7a5c40', lineHeight: 1.65, maxWidth: 440, margin: '0 0 28px' }}>{data.sub}</p>
        <button onClick={onShop} style={{
          padding: '14px 32px', borderRadius: 99, border: 'none', color: '#fdf6ee', fontWeight: 600,
          fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', background: card.accent,
          boxShadow: `0 8px 24px -6px ${card.shadow}`,
        }}>{card.cta}</button>
      </div>

      <div style={{ padding: `28px ${px}px 60px`, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#2a1a0e', marginBottom: 18 }}>Curated for you</div>
        {/* key={idx} remounts the grid per category so the filter/sort state resets. */}
        <OverlayGrid
          key={idx}
          products={categoryProducts}
          accent={card.accent}
          loading={products.length === 0}
          onProductClick={onProductClick}
        />
      </div>
    </div>
  )
}

function OverlayGrid({ products, accent, loading, onProductClick }) {
  const { filters, activeFilter, setActiveFilter, sort, setSort, sorted } = useProductFilters(products)
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024
  return (
    <>
      <ProductFilterBar
        count={sorted.length}
        filters={filters}
        activeFilter={activeFilter}
        onFilter={setActiveFilter}
        sort={sort}
        onSort={setSort}
        accent={accent}
      />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3,1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? 12 : 20, marginTop: 6 }}>
        {loading
          ? Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => <ProductSkeleton key={i} />)
          : sorted.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
      </div>
    </>
  )
}
