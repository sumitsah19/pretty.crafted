import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { openBoxBuilder, openHamperShop, setActiveProduct } from '../store/slices/uiSlice'
import { heroCardsApi, productsApi } from '../api/services'

const TC = '#C4704A'

/* ── Song / box data ─────────────────────────────────────── */
const SONGS = [
  { id: '1',  title: 'Velvet Box',       albumName: 'Classic' },
  { id: '2',  title: 'Blossom Crate',    albumName: 'Spring Edit' },
  { id: '3',  title: 'Golden Hour',      albumName: 'Luxe' },
  { id: '4',  title: 'Midnight Memoir',  albumName: 'Dark Romance' },
  { id: '5',  title: 'Petal & Pine',     albumName: 'Botanical' },
  { id: '6',  title: 'Copper Dream',     albumName: 'Terracotta' },
  { id: '7',  title: 'Sage & Cedar',     albumName: 'Forest' },
  { id: '8',  title: 'Rose & Honey',     albumName: 'Sweet' },
  { id: '9',  title: 'Linen & Light',    albumName: 'Minimal' },
  { id: '10', title: 'Spice Market',     albumName: 'Festive' },
  { id: '11', title: 'Ocean Calm',       albumName: 'Serenity' },
  { id: '12', title: 'Amber Afternoon',  albumName: 'Warm' },
  { id: '13', title: 'Wildflower',       albumName: 'Meadow' },
  { id: '14', title: 'Ivory & Ink',      albumName: 'Stationery' },
  { id: '15', title: 'Hearth & Home',    albumName: 'Cosy' },
  { id: '16', title: 'Desert Bloom',     albumName: 'Arid' },
  { id: '17', title: 'Crimson Joy',      albumName: 'Festival' },
  { id: '18', title: 'Mint Reverie',     albumName: 'Fresh' },
  { id: '19', title: 'Stellar',          albumName: 'Night Sky' },
]

const BOX_COVERS = [
  'linear-gradient(135deg,#C4704A,#8B3A2A)',
  'linear-gradient(135deg,#D4956A,#F0C8A0)',
  'linear-gradient(135deg,#C08A1E,#F0D060)',
  'linear-gradient(135deg,#2C1A0E,#6B4F3A)',
  'linear-gradient(135deg,#7A9A6B,#B8D4A8)',
  'linear-gradient(135deg,#C4704A,#E8A070)',
  'linear-gradient(135deg,#4A6B7A,#8AACB8)',
  'linear-gradient(135deg,#9A6B4A,#C4956A)',
  'linear-gradient(135deg,#E8D4B8,#C4A880)',
  'linear-gradient(135deg,#8B4513,#D2691E)',
  'linear-gradient(135deg,#4682B4,#87CEEB)',
  'linear-gradient(135deg,#DAA520,#FFD700)',
  'linear-gradient(135deg,#6B8E23,#9ACD32)',
  'linear-gradient(135deg,#F5F5DC,#D2B48C)',
  'linear-gradient(135deg,#B8860B,#FFD700)',
  'linear-gradient(135deg,#CD853F,#F4A460)',
  'linear-gradient(135deg,#DC143C,#FF6B6B)',
  'linear-gradient(135deg,#20B2AA,#48D1CC)',
  'linear-gradient(135deg,#191970,#4169E1)',
]

const BOX_PRICES = [1299,1899,2499,999,1599,3299,1199,2199,899,1799,1499,2799,1099,1999,2699,1399,1699,1299,2999]
const BOX_TAGS   = ['Bestseller','New',null,null,'Bestseller',null,'New',null,null,'Bestseller',null,null,'New',null,null,null,'Bestseller',null,null]
const BOX_CATS   = ['Gift Boxes','Botanical Boxes','Luxe Boxes','Dark Gift Boxes','Botanical Boxes','Terracotta Boxes','Wellness Boxes','Sweet Gift Boxes','Minimal Boxes','Festive Boxes','Serenity Boxes','Warm Boxes','Botanical Boxes','Stationery Boxes','Cosy Boxes','Desert Boxes','Festival Boxes','Fresh Boxes','Celestial Boxes']
const BOX_RECIP  = ['her','her','her','him','her','her','anyone','her','anyone','anyone','her','anyone','her','anyone','anyone','her','anyone','her','anyone']

function getBoxCover(song) {
  const idx = (parseInt(song.id) - 1) % BOX_COVERS.length
  return { gradient: BOX_COVERS[idx], title: song.title }
}

const BOX_PRODUCTS = SONGS.map((song, i) => {
  const cover = getBoxCover(song)
  return {
    id: 1000 + parseInt(song.id),
    name: song.title,
    category: BOX_CATS[i] || 'Gift Boxes',
    price: BOX_PRICES[i] || 1499,
    recipient: BOX_RECIP[i] || 'anyone',
    bg: cover.gradient,
    tag: BOX_TAGS[i] || null,
  }
})

/* ── Reflection ──────────────────────────────────────────── */
function Reflection({ gradient, imageUrl }) {
  if (!gradient && !imageUrl) return null
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, width: '100%', height: '100%',
      borderRadius: 8, pointerEvents: 'none', userSelect: 'none',
      background: imageUrl ? `#EDE4D8 url(${imageUrl}) center/cover` : gradient,
      transform: 'scaleY(-1)', opacity: 0.3,
      WebkitMaskImage: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 55%)',
      maskImage: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 55%)',
      filter: 'blur(1px) brightness(0.7)',
    }} />
  )
}

const ROTATION = 52
const AUTOPLAY_SPEED = 0.004

function buildTransform(offset, spacing) {
  const dist = Math.abs(offset)
  const sign = offset > 0 ? 1 : -1
  const z  = Math.max(-350, -85 * Math.min(dist, 4))
  const rot = sign * -ROTATION * Math.min(1, dist)
  const tx  = sign * spacing * dist
  return `translateX(${tx}px) translateZ(${z}px) rotateY(${rot}deg)`
}

/* ── CoverFlow ───────────────────────────────────────────── */
function CoverFlow({ songs, currentIndex, setCurrentIndex, onSongSelect, albumSize, isMobile, autoplay, contained, selectedCardIdx, onCardClick }) {
  const N = songs.length
  const SPACING = isMobile ? 100 : 140
  const SNAP_LERP = 0.12
  const PAUSE_DELAY = 2800

  const posRef        = useRef(typeof currentIndex === 'number' ? currentIndex : 0)
  const snapTargetRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartPos  = useRef(0)
  const pausedRef     = useRef(false)
  const pauseTimer    = useRef(null)
  const rafRef        = useRef(null)
  const lastCenterRef = useRef(-1)
  const cardRefs      = useRef([])
  const selectedElRefs= useRef([])
  const stageRef      = useRef(null)
  const selectedIdxRef= useRef(typeof selectedCardIdx === 'number' ? selectedCardIdx : -1)
  const _cardCbs      = useRef({})
  const _selCbs       = useRef({})

  // eslint-disable-next-line react-hooks/refs
  selectedIdxRef.current = typeof selectedCardIdx === 'number' ? selectedCardIdx : -1



  const updateDOM = useCallback(() => {
    const pos = posRef.current
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      let offset = i - pos
      while (offset >  N / 2) offset -= N
      while (offset < -N / 2) offset += N
      const dist = Math.abs(offset)
      el.style.transform = buildTransform(offset, SPACING)
      el.style.zIndex    = Math.round(2000 - dist * 100)
      el.style.opacity   = dist > 4.5 ? Math.max(0, 1 - (dist - 4.5) * 0.6) : 1
      const selEl = selectedElRefs.current[i]
      if (selEl) selEl.style.opacity = selectedIdxRef.current === i ? '1' : '0'
    })
  }, [N, SPACING])

  const live = useRef({})
  // eslint-disable-next-line react-hooks/refs
  live.current = { autoplay, songs, setCurrentIndex, onSongSelect, updateDOM }

  useEffect(() => {
    const tick = () => {
      const { autoplay: ap, songs: s, setCurrentIndex: sci, onSongSelect: oss, updateDOM: upd } = live.current
      const n = s.length
      if (!n) { rafRef.current = requestAnimationFrame(tick); return }

      if (ap && !isDraggingRef.current && !pausedRef.current && snapTargetRef.current === null) {
        posRef.current = (posRef.current + AUTOPLAY_SPEED + n) % n
      }
      if (snapTargetRef.current !== null) {
        let diff = snapTargetRef.current - posRef.current
        if (diff >  n / 2) diff -= n
        if (diff < -n / 2) diff += n
        if (Math.abs(diff) < 0.008) {
          posRef.current = (snapTargetRef.current % n + n) % n
          snapTargetRef.current = null
        } else {
          posRef.current = (posRef.current + diff * SNAP_LERP + n) % n
        }
      }
      upd()
      const newCenter = (Math.round(posRef.current) % n + n) % n
      if (newCenter !== lastCenterRef.current) {
        lastCenterRef.current = newCenter
        sci && sci(newCenter)
        oss && oss(s[newCenter], newCenter)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    if (!autoplay && !isDraggingRef.current && typeof currentIndex === 'number') {
      snapTargetRef.current = currentIndex
    }
  }, [currentIndex, autoplay])

  const pause = () => { pausedRef.current = true; clearTimeout(pauseTimer.current) }
  const scheduleResume = () => {
    clearTimeout(pauseTimer.current)
    pauseTimer.current = setTimeout(() => { pausedRef.current = false }, PAUSE_DELAY)
  }

  const startDrag = (x) => {
    isDraggingRef.current = true
    dragStartXRef.current = x
    dragStartPos.current  = posRef.current
    snapTargetRef.current = null
    pause()
    if (stageRef.current) stageRef.current.style.cursor = 'grabbing'
  }
  const moveDrag = (x) => {
    if (!isDraggingRef.current) return
    const delta = -(x - dragStartXRef.current) / Math.max(albumSize * 0.55, 60)
    posRef.current = ((dragStartPos.current + delta) % N + N) % N
  }
  const endDrag = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    if (stageRef.current) stageRef.current.style.cursor = 'grab'
    const nearest = (Math.round(posRef.current) % N + N) % N
    snapTargetRef.current = nearest
    scheduleResume()
    if (onCardClick) onCardClick(songs[nearest], nearest)
  }

  const handleWheel = (e) => {
    const dx = Math.abs(e.deltaX), dy = Math.abs(e.deltaY)
    if (dx < 3 && dy > dx) return
    e.preventDefault()
    pause()
    posRef.current = ((posRef.current + e.deltaX / Math.max(albumSize * 0.7, 80)) % N + N) % N
    snapTargetRef.current = (Math.round(posRef.current) % N + N) % N
    scheduleResume()
  }

  const getCardCb = (i) => (_cardCbs.current[i] ??= (el) => { cardRefs.current[i] = el })
  const getSelCb  = (i) => (_selCbs.current[i]  ??= (el) => { selectedElRefs.current[i] = el })

  return (
    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 300 }}>
      <div
        ref={stageRef}
        style={{
          position: 'relative', height: albumSize + 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          userSelect: 'none', perspective: '1500px', perspectiveOrigin: 'center center',
          overflow: contained ? 'hidden' : 'visible', cursor: 'grab',
        }}
        onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX) }}
        onMouseMove={(e) => { if (isDraggingRef.current) { e.preventDefault(); moveDrag(e.clientX) } }}
        onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={(e) => startDrag(e.touches[0].clientX)}
        onTouchMove={(e) => { e.preventDefault(); moveDrag(e.touches[0].clientX) }}
        onTouchEnd={endDrag}
        onWheel={handleWheel}
      >
        {songs.map((song, index) => {
          const cover = getBoxCover(song)
          const hasImage = !!song.imageUrl
          const cardTitle = song.title || cover.title
          return (
            <div
              key={song.id}
              ref={getCardCb(index)}
              style={{ position: 'absolute', userSelect: 'none', transformOrigin: 'center center', transformStyle: 'preserve-3d' }}
              onClick={() => {
                if (!isDraggingRef.current) {
                  pause()
                  snapTargetRef.current = index
                  if (onCardClick) onCardClick({ ...song, cover: cover.gradient }, index)
                  else scheduleResume()
                }
              }}
            >
              <div style={{ position: 'relative', width: albumSize, height: albumSize }}>
                {/* Selected overlay */}
                <div ref={getSelCb(index)} style={{ position: 'absolute', inset: 0, borderRadius: 8, opacity: 0, pointerEvents: 'none', zIndex: 10, transition: 'opacity 0.25s' }}>
                  <div style={{ position: 'absolute', inset: -2, borderRadius: 10, border: '2px solid #C4704A', boxShadow: '0 0 18px rgba(196,112,74,0.5)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: '0 0 8px 8px', background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)', padding: '22px 6px 7px', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#C4704A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>✓ Box Selected</span>
                  </div>
                </div>

                {/* Box cover art */}
                <div style={{
                  width: '100%', height: '100%', borderRadius: 8,
                  background: hasImage ? '#EDE4D8' : cover.gradient,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {hasImage ? (
                    <img src={song.imageUrl} alt={cardTitle} draggable={false}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, userSelect: 'none', pointerEvents: 'none' }} />
                  ) : (
                    <>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 30%, transparent 60%)', borderRadius: 8 }} />
                      {/* Ribbon decoration */}
                      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: '100%', background: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', height: 2, width: '100%', background: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: albumSize * 0.22, height: albumSize * 0.22, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: albumSize * 0.12, zIndex: 2 }}>🎀</div>
                    </>
                  )}
                  {/* Title */}
                  {cardTitle && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 8px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', borderRadius: '0 0 8px 8px', zIndex: 3 }}>
                      <p style={{ margin: 0, fontSize: Math.max(9, albumSize * 0.07), fontWeight: 700, color: '#fff', textAlign: 'center', letterSpacing: '0.04em', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: '0 6px' }}>{cardTitle}</p>
                    </div>
                  )}
                </div>

                <Reflection gradient={hasImage ? null : cover.gradient} imageUrl={hasImage ? song.imageUrl : null} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── GiftBoxCTASection ───────────────────────────────────── */
export default function GiftBoxCTASection({ isHero = true }) {
  const dispatch = useDispatch()
  const [heroCards, setHeroCards] = useState(null)
  const [boxIdx, setBoxIdx] = useState(Math.floor(SONGS.length / 2))
  const [mobile, setMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Fetch admin-managed hero cards; fall back to the built-in gradient boxes on error/empty.
  useEffect(() => {
    let cancelled = false
    heroCardsApi.list()
      .then(({ data }) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return
        setHeroCards(data)
        setBoxIdx(Math.floor(data.length / 2))
      })
      .catch(() => { /* keep gradient fallback */ })
    return () => { cancelled = true }
  }, [])

  const albumSize = mobile ? 140 : 172

  // Map hero-card DTOs into the CoverFlow's card shape, or use the gradient SONGS fallback.
  const cards = useMemo(() => {
    if (heroCards && heroCards.length) {
      return heroCards.map(c => ({
        id: 'hero-' + c.id,
        title: c.title || '',
        imageUrl: c.imageUrl,
        type: c.type,
        linkedProductId: c.linkedProductId,
      }))
    }
    return SONGS
  }, [heroCards])

  const handleCardClick = async (card) => {
    // Hero cards (real images) deep-link to a product or open the hamper shop.
    if (card.imageUrl) {
      if (card.type === 'HAMPER') { dispatch(openHamperShop()); return }
      if (card.linkedProductId) {
        try {
          const { data } = await productsApi.byId(card.linkedProductId)
          dispatch(setActiveProduct(data))
        } catch { /* product unavailable — no-op */ }
      }
      return
    }
    const idx = SONGS.findIndex(s => s.id === card.id)
    if (idx >= 0) dispatch(setActiveProduct(BOX_PRODUCTS[idx]))
  }

  return (
    <section style={{
      background: '#fff',
      borderRadius: mobile ? 20 : 28,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 4px 32px rgba(44,26,14,0.08)',
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      {/* Header — hero mode */}
      {isHero && (
        <div style={{ position: 'relative', padding: mobile ? '32px 20px 0' : '40px 40px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TC, margin: '0 0 14px' }}>
            CRAFTED WITH LOVE
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: mobile ? 'clamp(22px,6vw,32px)' : 'clamp(28px,3.5vw,44px)', fontWeight: 700, lineHeight: 1.12, color: '#1a1a1a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Gifts That Feel Like a Hug
          </h2>
          <p style={{ fontSize: mobile ? 14 : 15, fontStyle: 'italic', color: TC, margin: 0 }}>
            Trending Hampers &amp; Gift Products
          </p>
        </div>
      )}

      {/* Header — standalone section below Featured Collection */}
      {!isHero && (
        <div style={{ position: 'relative', padding: mobile ? '32px 20px 0' : '40px 40px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TC, margin: '0 0 14px' }}>
            BUILD YOUR OWN BOX
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: mobile ? 'clamp(22px,6vw,32px)' : 'clamp(28px,3.5vw,44px)', fontWeight: 700, lineHeight: 1.12, color: '#1a1a1a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            A Box as Unique as Your Moment
          </h2>
          <p style={{ fontSize: mobile ? 14 : 15, fontStyle: 'italic', color: TC, margin: 0 }}>
            Your box, your choices, your way
          </p>
        </div>
      )}

      {/* CoverFlow */}
      <div style={{ marginTop: isHero ? 20 : 0 }}>
        <CoverFlow
          songs={cards}
          currentIndex={boxIdx}
          setCurrentIndex={setBoxIdx}
          onSongSelect={(_, idx) => { if (idx != null) setBoxIdx(idx) }}
          albumSize={albumSize}
          isMobile={mobile}
          autoplay={true}
          contained={true}
          selectedCardIdx={null}
          onCardClick={handleCardClick}
        />
      </div>

      {/* CTA row */}
      <div style={{ padding: mobile ? '16px 20px 28px' : '18px 40px 32px', display: 'flex', justifyContent: 'center', gap: 12 }}>
        {isHero && <BuyHampersBtn mobile={mobile} onClick={() => dispatch(openHamperShop())} />}
        <BuildOwnBtn mobile={mobile} onClick={() => dispatch(openBoxBuilder())} />
      </div>
    </section>
  )
}

function BuyHampersBtn({ mobile, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: mobile ? '13px 28px' : '14px 36px',
        borderRadius: 99, border: `2px solid ${TC}`,
        background: hovered ? TC : 'transparent',
        color: hovered ? '#fff' : TC,
        fontWeight: 700, fontSize: mobile ? 14 : 15,
        cursor: 'pointer', letterSpacing: '0.01em',
        transition: 'all 0.2s', minHeight: 48, fontFamily: 'inherit',
      }}
    >
      Buy Hampers
    </button>
  )
}

function BuildOwnBtn({ mobile, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: mobile ? '13px 28px' : '14px 36px',
        borderRadius: 99, border: 'none',
        background: 'linear-gradient(135deg,#C4704A,#B05F3C)',
        color: '#fff', fontWeight: 700, fontSize: mobile ? 14 : 15,
        cursor: 'pointer', letterSpacing: '0.01em',
        boxShadow: hovered ? '0 10px 28px rgba(196,112,74,0.4)' : '0 6px 20px rgba(196,112,74,0.35)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s', minHeight: 48, fontFamily: 'inherit',
      }}
    >
      Build your own
    </button>
  )
}
