import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeBoxBuilder, openCart, openLogin, openHamperShop } from '../../store/slices/uiSlice'
import { addBox } from '../../store/slices/cartSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { selectIsLoggedIn } from '../../store/slices/authSlice'
import { giftBoxApi, buildBoxApi } from '../../api/services'
import { useWindowWidth } from '../../hooks/useWindowWidth'

const TC = '#C4704A'
const GOLD = '#C08A1E'

/* ── Box CoverFlow data ─────────────────────────────────── */
const SONGS = [
  { id: '1',  title: 'Velvet Box',      albumName: 'Classic' },
  { id: '2',  title: 'Blossom Crate',   albumName: 'Spring Edit' },
  { id: '3',  title: 'Golden Hour',     albumName: 'Luxe' },
  { id: '4',  title: 'Midnight Memoir', albumName: 'Dark Romance' },
  { id: '5',  title: 'Petal & Pine',    albumName: 'Botanical' },
  { id: '6',  title: 'Copper Dream',    albumName: 'Terracotta' },
  { id: '7',  title: 'Sage & Cedar',    albumName: 'Forest' },
  { id: '8',  title: 'Rose & Honey',    albumName: 'Sweet' },
  { id: '9',  title: 'Linen & Light',   albumName: 'Minimal' },
  { id: '10', title: 'Spice Market',    albumName: 'Festive' },
  { id: '11', title: 'Ocean Calm',      albumName: 'Serenity' },
  { id: '12', title: 'Amber Afternoon', albumName: 'Warm' },
  { id: '13', title: 'Wildflower',      albumName: 'Meadow' },
  { id: '14', title: 'Ivory & Ink',     albumName: 'Stationery' },
  { id: '15', title: 'Hearth & Home',   albumName: 'Cosy' },
  { id: '16', title: 'Desert Bloom',    albumName: 'Arid' },
  { id: '17', title: 'Crimson Joy',     albumName: 'Festival' },
  { id: '18', title: 'Mint Reverie',    albumName: 'Fresh' },
  { id: '19', title: 'Stellar',         albumName: 'Night Sky' },
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

const BOX_CONFIG = {
  Small:  { max: 2, price: 1499, desc: 'Perfect for a personal touch', apiKey: 'SMALL' },
  Medium: { max: 4, price: 2999, desc: 'A complete curated experience', apiKey: 'MEDIUM' },
  Large:  { max: 6, price: 4999, desc: 'The ultimate gift collection',  apiKey: 'LARGE' },
}

/* Wrap options — keys/names/costs mirror the backend WrapType enum. */
const WRAPS = [
  { key: 'STANDARD',  name: 'Standard Pink',  price: 0 },
  { key: 'ROSE_GOLD', name: 'Rose Gold Foil', price: 79 },
  { key: 'FLORAL',    name: 'Floral Ribbon',  price: 49 },
  { key: 'LUXURY',    name: 'Luxury Velvet',  price: 129 },
]
const MSG_MAX = 150

/* ── Category gradient for product tiles ────────────────── */
const CAT_GRADIENT = {
  'Candles & Scents':   'linear-gradient(135deg,#f7e4c1,#e8c97a)',
  'Handmade Jewelry':   'linear-gradient(135deg,#f7e4c1,#e8c97a)',
  'Ceramics':           'linear-gradient(135deg,#f5e8dc,#c9956b)',
  'Art Prints':         'linear-gradient(135deg,#f0ece4,#c4b49a)',
  'Skincare':           'linear-gradient(135deg,#fde8f0,#f5b8cc)',
  'Books & Stationery': 'linear-gradient(135deg,#eaf0f8,#8ab0d0)',
  'Food & Gourmet':     'linear-gradient(135deg,#f5e8dc,#c9956b)',
  'Plants':             'linear-gradient(135deg,#e8f0e8,#b5d4b5)',
}

/* ── Helpers ────────────────────────────────────────────── */
function getBoxCover(song) {
  // Built-in boxes have numeric ids; admin boxes use "box-<id>" and carry buildBoxId. Either way,
  // derive a stable gradient (only shown as a backdrop when there's no uploaded image).
  const raw = song.buildBoxId ?? parseInt(song.id, 10)
  const n = Number(raw)
  const idx = ((Number.isFinite(n) ? n : 1) - 1 + BOX_COVERS.length) % BOX_COVERS.length
  return { gradient: BOX_COVERS[idx], title: song.title }
}

function fmtInr(n) { return '₹' + n.toLocaleString('en-IN') }

/* ── Reflection ─────────────────────────────────────────── */
function Reflection({ gradient, imageUrl }) {
  if (!gradient && !imageUrl) return null
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, width: '100%', height: '100%',
      borderRadius: 8, pointerEvents: 'none', userSelect: 'none',
      background: imageUrl ? `#EDE4D8 url(${imageUrl}) center/cover` : gradient,
      transform: 'scaleY(-1)', opacity: 0.3,
      WebkitMaskImage: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 55%)',
      maskImage:       'linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 55%)',
      filter: 'blur(1px) brightness(0.7)',
    }} />
  )
}

/* ── CoverFlow ───────────────────────────────────────────── */
const ROTATION = 52
const AUTOPLAY_SPEED = 0.004

function buildTransform(offset, spacing) {
  const dist = Math.abs(offset)
  const sign = offset > 0 ? 1 : -1
  const z   = Math.max(-350, -85 * Math.min(dist, 4))
  const rot = sign * -ROTATION * Math.min(1, dist)
  const tx  = sign * spacing * dist
  return `translateX(${tx}px) translateZ(${z}px) rotateY(${rot}deg)`
}

function CoverFlow({ songs, currentIndex, setCurrentIndex, onSongSelect, albumSize, isMobile, autoplay, contained, selectedCardIdx, onCardClick }) {
  const N = songs.length
  const SPACING = isMobile ? 100 : 140
  const SNAP_LERP  = 0.12
  const PAUSE_DELAY = 2800

  const posRef         = useRef(typeof currentIndex === 'number' ? currentIndex : 0)
  const snapTargetRef  = useRef(null)
  const isDraggingRef  = useRef(false)
  const dragStartXRef  = useRef(0)
  const dragStartPos   = useRef(0)
  const pausedRef      = useRef(false)
  const pauseTimer     = useRef(null)
  const rafRef         = useRef(null)
  const lastCenterRef  = useRef(-1)
  const cardRefs       = useRef([])
  const selectedElRefs = useRef([])
  const stageRef       = useRef(null)
  const selectedIdxRef = useRef(typeof selectedCardIdx === 'number' ? selectedCardIdx : -1)
  const _cardCbs       = useRef({})
  const _selCbs        = useRef({})

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
                {/* Selection overlay */}
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
                      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: '100%', background: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', height: 2, width: '100%', background: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: albumSize * 0.22, height: albumSize * 0.22, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: albumSize * 0.12, zIndex: 2 }}>🎀</div>
                    </>
                  )}
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

/* ── Main ────────────────────────────────────────────────── */
export default function GiftBoxModal() {
  const dispatch    = useDispatch()
  const products    = useSelector(selectProducts)
  const isLoggedIn  = useSelector(selectIsLoggedIn)
  const ww          = useWindowWidth()
  const isMobile    = ww < 640
  const navH        = isMobile ? 60 : 72

  const [view, setView]                 = useState('form') // 'form' | 'preview'
  const [boxSize, setBoxSize]           = useState('Medium')
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedCoverIdx, setSelectedCoverIdx] = useState(null)
  const [buildBoxes, setBuildBoxes]     = useState(null)
  const [boxIdx, setBoxIdx]             = useState(Math.floor(SONGS.length / 2))
  const [recipient, setRecipient]       = useState('everyone')
  const [activeCategory, setActiveCategory] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showAllProducts, setShowAllProducts]   = useState(false)
  const [shakeBox, setShakeBox]         = useState(false)
  const [shakeProds, setShakeProds]     = useState(false)
  const [sizeWarning, setSizeWarning]   = useState(null)
  const [wrapType, setWrapType]         = useState('STANDARD')
  const [giftMessage, setGiftMessage]   = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  const boxRef     = useRef(null)
  const productRef = useRef(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') dispatch(closeBoxBuilder()) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [dispatch])

  // Load the admin-curated "Build Your Own Box" designs; fall back to the built-in gradient boxes
  // when none are configured (or on error) so the builder always has something to pick.
  useEffect(() => {
    let cancelled = false
    buildBoxApi.list()
      .then(({ data }) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return
        setBuildBoxes(data)
        setBoxIdx(Math.floor(data.length / 2))
      })
      .catch(() => { /* keep gradient fallback */ })
    return () => { cancelled = true }
  }, [])

  // CoverFlow cards: real admin boxes (carrying buildBoxId + image) or the gradient SONGS fallback.
  const cards = useMemo(() => {
    if (buildBoxes && buildBoxes.length) {
      return buildBoxes.map(b => ({
        id: 'box-' + b.id,
        buildBoxId: b.id,
        title: b.title || 'Gift Box',
        imageUrl: b.imageUrl,
        boxPrice: Number(b.price) || 0,
      }))
    }
    return SONGS
  }, [buildBoxes])

  const BOX_MAX   = BOX_CONFIG[boxSize].max
  const wrapPrice = WRAPS.find(w => w.key === wrapType)?.price || 0
  const boxPrice  = BOX_CONFIG[boxSize].price + (selectedCard?.boxPrice || 0) + wrapPrice

  /* Filter products by recipient + category */
  const byRecipient = products.filter(p => {
    if (recipient === 'everyone') return true
    return p.recipient === recipient || !p.recipient || p.recipient === 'anyone'
  })
  const categories   = [...new Set(byRecipient.map(p => p.category).filter(Boolean))]
  const byCategory   = activeCategory ? byRecipient.filter(p => p.category === activeCategory) : byRecipient
  const displayProds = showAllProducts ? byCategory : byCategory.slice(0, 6)

  const toggleProduct = (product) => {
    const isSelected = selectedProducts.some(p => p.id === product.id)
    if (!isSelected && selectedProducts.length >= BOX_MAX) return
    setSelectedProducts(prev =>
      isSelected ? prev.filter(p => p.id !== product.id) : [...prev, product]
    )
  }

  const handleContinue = () => {
    if (!selectedCard) {
      setShakeBox(true)
      setTimeout(() => setShakeBox(false), 700)
      boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }
    if (selectedProducts.length < 1) {
      setShakeProds(true)
      setTimeout(() => setShakeProds(false), 700)
      productRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }
    setView('preview')
  }

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      dispatch(closeBoxBuilder())
      dispatch(openLogin())
      return
    }
    setSaving(true); setError('')
    try {
      const { data } = await giftBoxApi.create({
        size: BOX_CONFIG[boxSize].apiKey,
        wrapType,
        customMessage: giftMessage.trim() || null,
        productIds: selectedProducts.map(p => p.id),
        // Persist the chosen box. Admin boxes send buildBoxId (server snapshots title/image);
        // built-in gradient boxes have no DB row, so just send their label.
        buildBoxId: selectedCard?.buildBoxId ?? null,
        boxTitle: selectedCard?.title ?? null,
      })
      dispatch(addBox(data))
      dispatch(closeBoxBuilder())
      dispatch(openCart())
    } catch (e) {
      setError(e.response?.data?.message || 'Could not add gift box. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, top: navH, zIndex: 1200, background: '#FAF7F2', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes pc-shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(6px)}45%{transform:translateX(-5px)}60%{transform:translateX(5px)}75%{transform:translateX(-3px)}90%{transform:translateX(3px)}}.pc-shake{animation:pc-shake 0.6s ease;border:2px solid #e53e3e!important;background:rgba(229,62,62,0.04)!important;}.gb-pills::-webkit-scrollbar{display:none}`}</style>

      {/* Floating close button */}
      <button
        onClick={() => dispatch(closeBoxBuilder())}
        style={{ position: 'fixed', top: navH + 14, right: 20, zIndex: 1210, width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 20, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
      >×</button>

      {/* ── FORM VIEW ─────────────────────────────────────────── */}
      {view === 'form' && (
        <>
          {/* Top section with header, placeholder, CoverFlow, size tabs */}
          <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px clamp(20px,5vw,72px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🎁</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.01em', fontFamily: "'Playfair Display',serif" }}>Build Your Gift Box</span>
              </div>
              <button type="button" onClick={() => { dispatch(closeBoxBuilder()); dispatch(openHamperShop()) }}
                style={{ padding: '9px 16px', borderRadius: 99, border: '1px solid rgba(196,112,74,0.35)', background: 'rgba(196,112,74,0.06)', cursor: 'pointer', color: TC, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', letterSpacing: '0.01em', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,112,74,0.14)'; e.currentTarget.style.borderColor = TC }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(196,112,74,0.06)'; e.currentTarget.style.borderColor = 'rgba(196,112,74,0.35)' }}>
                Shop Curated Box
              </button>
            </div>

            {/* Selected box placeholder */}
            <div style={{ margin: '14px clamp(20px,5vw,72px) 0', padding: '12px 16px', borderRadius: 12, border: `2px dashed ${selectedCard ? 'rgba(196,112,74,0.4)' : 'rgba(0,0,0,0.15)'}`, background: selectedCard ? 'rgba(196,112,74,0.04)' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 44, transition: 'all 0.2s' }}>
              {selectedCard ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: selectedCard.imageUrl ? `#EDE4D8 url(${selectedCard.imageUrl}) center/cover` : selectedCard.cover, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', fontFamily: "'Playfair Display',serif" }}>{selectedCard.title}</span>
                  <span style={{ fontSize: 11, color: TC, fontWeight: 500 }}>✓ Selected</span>
                </div>
              ) : (
                <span style={{ fontSize: 13, color: '#aaa', fontWeight: 500 }}>Please select a box from below</span>
              )}
            </div>

            {/* CoverFlow */}
            <div ref={boxRef} className={shakeBox ? 'pc-shake' : ''} style={{ margin: '20px 0 0', borderRadius: 12 }}>
              <CoverFlow
                songs={cards}
                currentIndex={boxIdx}
                setCurrentIndex={setBoxIdx}
                onSongSelect={(_, idx) => { if (idx != null) setBoxIdx(idx) }}
                albumSize={180}
                isMobile={isMobile}
                autoplay={true}
                contained={true}
                selectedCardIdx={selectedCoverIdx}
                onCardClick={(song, idx) => {
                  setSelectedCoverIdx(idx)
                  setSelectedCard({ ...song, cover: getBoxCover(song).gradient })
                }}
              />
            </div>

            {/* Size tabs */}
            <div style={{ padding: '20px clamp(20px,5vw,72px) 16px' }}>
              <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 12, padding: 3 }}>
                {['Small', 'Medium', 'Large'].map(s => {
                  const bc = BOX_CONFIG[s]
                  return (
                    <button key={s} onClick={() => {
                      const newMax = bc.max
                      if (selectedProducts.length > newMax) {
                        setSelectedProducts(prev => prev.slice(0, newMax))
                        setSizeWarning(`Adjusted to ${newMax} item${newMax !== 1 ? 's' : ''} to fit ${s} box`)
                        clearTimeout(window.__swt)
                        window.__swt = setTimeout(() => setSizeWarning(null), 3500)
                      }
                      setBoxSize(s)
                    }} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: boxSize === s ? 600 : 400, background: boxSize === s ? 'rgba(0,0,0,0.09)' : 'transparent', color: boxSize === s ? '#1a1a1a' : '#888', transition: 'all 0.2s', boxShadow: boxSize === s ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>{s}</button>
                  )
                })}
              </div>
              {/* Counter + price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '0 2px' }}>
                <span style={{ fontSize: 12 }}>
                  <span style={{ color: selectedProducts.length >= BOX_MAX ? GOLD : '#1a1a1a', fontWeight: 700 }}>{selectedProducts.length}</span>
                  <span style={{ color: '#888' }}>/{BOX_MAX} Items</span>
                </span>
                <span style={{ fontSize: 11, color: '#888' }}>{BOX_CONFIG[boxSize].desc}</span>
                <span style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>{fmtInr(boxPrice)}</span>
              </div>
            </div>
            {sizeWarning && (
              <div style={{ margin: '0 20px 10px', padding: '8px 12px', background: 'rgba(212,155,35,0.09)', border: '1px solid rgba(212,155,35,0.28)', borderRadius: 8, fontSize: 12, color: GOLD, display: 'flex', alignItems: 'center', gap: 6 }}>⚠ {sizeWarning}</div>
            )}
          </div>

          {/* Form body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '16px clamp(20px,4vw,72px) 40px', maxWidth: 1440, width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>

            {/* Box slots preview */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: '#888', margin: 0, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Box Preview</p>
                {selectedCard && <p style={{ fontSize: 12, color: GOLD, margin: 0, fontWeight: 500 }}>{selectedCard.title}</p>}
                <span style={{ fontSize: 11, color: selectedProducts.length >= BOX_MAX ? GOLD : '#888' }}>{selectedProducts.length}/{BOX_MAX} slots filled</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOX_MAX <= 2 ? 2 : 3}, 1fr)`, gap: 8 }}>
                {Array.from({ length: BOX_MAX }).map((_, i) => (
                  <div key={i} style={{ minHeight: 52, borderRadius: 9, border: `1px dashed ${selectedProducts[i] ? GOLD : 'rgba(0,0,0,0.1)'}`, background: selectedProducts[i] ? 'rgba(192,138,30,0.08)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', textAlign: 'center', position: 'relative' }}>
                    {selectedProducts[i] ? (
                      <>
                        <span style={{ fontSize: 11, color: GOLD, fontWeight: 500, lineHeight: 1.3 }}>{selectedProducts[i].name}</span>
                        <button type="button" onClick={() => setSelectedProducts(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: 'rgba(212,155,35,0.3)', border: 'none', cursor: 'pointer', color: GOLD, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: '#888' }}>Slot {i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient pills */}
            <div>
              <p style={{ fontSize: 11, color: '#888', margin: '0 0 10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Recipient</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[['everyone', 'For Everyone'], ['her', 'For Her'], ['him', 'For Him'], ['kids', 'For Kids']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => { setRecipient(val); setSelectedProducts([]); setActiveCategory(null) }}
                    style={{ padding: '7px 16px', borderRadius: 99, border: `1px solid ${recipient === val ? GOLD : 'rgba(0,0,0,0.1)'}`, background: recipient === val ? 'rgba(192,138,30,0.12)' : 'transparent', color: recipient === val ? GOLD : '#555', fontSize: 13, fontWeight: recipient === val ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.17s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category pills */}
            <div>
              <p style={{ fontSize: 11, color: '#888', margin: '0 0 10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Category</p>
              <div ref={productRef} className={shakeProds ? 'pc-shake' : ''} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => setActiveCategory(null)}
                  style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${!activeCategory ? GOLD : 'rgba(0,0,0,0.1)'}`, background: !activeCategory ? 'rgba(192,138,30,0.12)' : '#fff', color: !activeCategory ? GOLD : '#555', fontWeight: !activeCategory ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.17s', boxShadow: !activeCategory ? '0 0 0 1px rgba(192,138,30,0.25)' : 'none' }}>All</button>
                <div className="gb-pills" style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, scrollbarWidth: 'none', maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)', paddingBottom: 2 }}>
                  {categories.map(cat => {
                    const isActive = activeCategory === cat
                    return (
                      <button key={cat} type="button" onClick={() => setActiveCategory(isActive ? null : cat)}
                        style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${isActive ? GOLD : 'rgba(0,0,0,0.1)'}`, background: isActive ? 'rgba(192,138,30,0.12)' : '#fff', color: isActive ? GOLD : '#555', fontWeight: isActive ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.17s', boxShadow: isActive ? '0 0 0 1px rgba(192,138,30,0.25)' : 'none', whiteSpace: 'nowrap' }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Product grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 10px' }}>
                <p style={{ fontSize: 11, color: '#888', margin: 0, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Choose Product</p>
                <button type="button" onClick={() => setShowAllProducts(v => !v)}
                  style={{ fontSize: 11, fontWeight: 600, color: TC, background: 'rgba(196,112,74,0.08)', border: '1px solid rgba(196,112,74,0.25)', borderRadius: 99, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,112,74,0.16)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(196,112,74,0.08)' }}>
                  {showAllProducts ? 'Show Less' : 'Show All'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {displayProds.map(p => {
                  const isSelected = selectedProducts.some(sp => sp.id === p.id)
                  const atMax      = selectedProducts.length >= BOX_MAX
                  const disabled   = atMax && !isSelected
                  const catGrad    = CAT_GRADIENT[p.category] || 'linear-gradient(135deg,#f5eee6,#c9956b)'
                  return (
                    <div key={p.id}
                      onClick={() => !disabled && toggleProduct(p)}
                      onMouseEnter={(e) => { if (!disabled && !isSelected) e.currentTarget.style.transform = 'translateY(-3px)' }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.transform = 'none' }}
                      style={{ display: 'flex', flexDirection: 'column', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: disabled ? 0.4 : 1, transform: isSelected ? 'translateY(-3px)' : 'none' }}>
                      <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 14, background: catGrad, overflow: 'hidden', marginBottom: 8, boxShadow: isSelected ? `0 0 0 2.5px ${GOLD}, 0 8px 22px rgba(192,138,30,0.22)` : '0 1px 4px rgba(44,26,14,0.08)', transition: 'box-shadow 0.25s ease' }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>{p.emoji}</div>
                        {isSelected && (
                          <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                      </div>
                      <h4 style={{ margin: 0, textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#1a1a1a', fontFamily: "'Playfair Display',serif", lineHeight: 1.3 }}>{p.name}</h4>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Continue button */}
            <button type="button" onClick={handleContinue}
              style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: selectedCard && selectedProducts.length >= 1 ? 'linear-gradient(135deg,#C4704A,#B05F3C)' : 'rgba(0,0,0,0.08)', color: selectedCard && selectedProducts.length >= 1 ? '#fff' : '#888', border: 'none', borderRadius: 11, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', boxShadow: selectedCard && selectedProducts.length >= 1 ? '0 4px 16px rgba(196,112,74,0.35)' : 'none', transition: 'all 0.3s' }}>
              ✦ Continue
            </button>
          </div>
        </>
      )}

      {/* ── PREVIEW VIEW ──────────────────────────────────────── */}
      {view === 'preview' && (
        <div style={{ padding: isMobile ? '20px 16px' : '24px 32px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {/* Box cover image */}
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: selectedCard?.cover || TC, aspectRatio: '16 / 9' }}>
            {selectedCard?.imageUrl ? (
              <img src={selectedCard.imageUrl} alt={selectedCard.title || 'Selected box'}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>
                <div style={{ position: 'absolute', inset: 0, background: selectedCard?.cover }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, opacity: 0.2 }}>🎀</div>
              </>
            )}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '26px 14px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, margin: '0 0 3px' }}>{boxSize} Box</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCard?.title}</p>
              </div>
              <span style={{ flexShrink: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{fmtInr(boxPrice)}</span>
            </div>
          </div>

          {/* Products inside */}
          <div>
            <p style={{ fontSize: 11, color: '#888', margin: '0 0 8px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              In Your Box · {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''}
            </p>
            {selectedProducts.length === 0 ? (
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>No products selected yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedProducts.length, 4)}, 1fr)`, gap: 8 }}>
                {selectedProducts.map((prod, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ aspectRatio: '1 / 1', borderRadius: 9, overflow: 'hidden', position: 'relative', background: CAT_GRADIENT[prod.category] || 'linear-gradient(135deg,#f5eee6,#c9956b)' }}>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{prod.emoji}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#555', lineHeight: 1.25, textAlign: 'center', wordBreak: 'break-word' }}>{prod.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wrap selection */}
          <div>
            <p style={{ fontSize: 11, color: '#888', margin: '0 0 8px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gift Wrap</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 8 }}>
              {WRAPS.map(w => {
                const on = wrapType === w.key
                return (
                  <button key={w.key} type="button" onClick={() => setWrapType(w.key)}
                    style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', border: `1.5px solid ${on ? TC : 'rgba(0,0,0,0.1)'}`, background: on ? 'rgba(196,112,74,0.07)' : '#fff', transition: 'all 0.17s' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: on ? TC : '#1a1a1a' }}>{w.name}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{w.price === 0 ? 'Free' : `+${fmtInr(w.price)}`}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gift message */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px' }}>
              <p style={{ fontSize: 11, color: '#888', margin: 0, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gift Message <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
              <span style={{ fontSize: 11, color: giftMessage.length >= MSG_MAX ? GOLD : '#888' }}>{giftMessage.length}/{MSG_MAX}</span>
            </div>
            <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value.slice(0, MSG_MAX))} maxLength={MSG_MAX}
              rows={3} placeholder="Add a personal note to include in the box…"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', outline: 'none', lineHeight: 1.4 }}
              onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setView('form'); setError('') }} style={{ flex: 1, height: 38, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#1a1a1a', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Back to Settings</button>
            <button onClick={handleAddToCart} disabled={saving}
              style={{ flex: 1.4, height: 38, borderRadius: 10, border: 'none', background: saving ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg,#C4704A,#B05F3C)', color: saving ? '#888' : '#fff', fontSize: 13, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: saving ? 'none' : '0 4px 16px rgba(196,112,74,0.3)', transition: 'all 0.2s' }}>
              {saving ? 'Adding…' : `Add to Cart · ${fmtInr(boxPrice)}`}
            </button>
          </div>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626' }}>⚠ {error}</div>
          )}
        </div>
      )}
    </div>
  )
}
