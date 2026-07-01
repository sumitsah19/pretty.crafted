import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeBoxBuilder, openCart, openLogin, openHamperShop } from '../../store/slices/uiSlice'
import { addBox } from '../../store/slices/cartSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { selectIsLoggedIn } from '../../store/slices/authSlice'
import { giftBoxApi, buildBoxApi } from '../../api/services'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { useModalFocus } from '../../hooks/useModalFocus'
import { cloudinaryOptimized } from '../../utils/cloudinaryUrl'
import { analytics } from '../../analytics'

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

/* Fallback box fees, used until /public/box-config loads (values mirror the backend
   BoxSize enum). The total charged is base + design surcharge + wrap + products. */
const BOX_CONFIG = {
  Small:  { max: 2, price: 199, desc: 'Perfect for a personal touch', apiKey: 'SMALL' },
  Medium: { max: 4, price: 349, desc: 'A complete curated experience', apiKey: 'MEDIUM' },
  Large:  { max: 6, price: 549, desc: 'The ultimate gift collection',  apiKey: 'LARGE' },
}

/* Fallback wrap options, used until /public/box-config loads (mirror WrapType). */
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

// A product's image gallery: explicit imageUrls, else its single imageUrl.
function galleryUrls(p) { return p?.imageUrls?.length ? p.imageUrls : (p?.imageUrl ? [p.imageUrl] : []) }

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
  const dragMovedRef  = useRef(false) // distinguishes a swipe from a tap
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
    dragMovedRef.current  = false
    dragStartXRef.current = x
    dragStartPos.current  = posRef.current
    snapTargetRef.current = null
    pause()
    if (stageRef.current) stageRef.current.style.cursor = 'grabbing'
  }
  const moveDrag = (x) => {
    if (!isDraggingRef.current) return
    if (Math.abs(x - dragStartXRef.current) > 8) dragMovedRef.current = true
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
    // No onCardClick here: scrolling/swiping must never select a card.
    // Selection happens only through a real tap/click (the card's onClick below).
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
                if (!isDraggingRef.current && !dragMovedRef.current) {
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
                    <img src={cloudinaryOptimized(song.imageUrl, 400)} alt={cardTitle} draggable={false}
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
  const dialogRef   = useModalFocus()
  const products    = useSelector(selectProducts)
  const isLoggedIn  = useSelector(selectIsLoggedIn)
  const showLogin   = useSelector(s => s.ui.showLogin) // login can open ON TOP of the builder
  const ww          = useWindowWidth()
  const isMobile    = ww < 640
  const navH        = isMobile ? 60 : 72

  const [view, setView]                 = useState('form') // 'form' | 'preview'
  const [boxSize, setBoxSize]           = useState('Medium')
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedCoverIdx, setSelectedCoverIdx] = useState(null)
  const [buildBoxes, setBuildBoxes]     = useState(null)
  const [serverCfg, setServerCfg]       = useState(null) // live BoxSize/WrapType pricing
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
  // Set when "Add to Cart" was interrupted by login; the add resumes once logged in.
  const [pendingAdd, setPendingAdd]     = useState(false)
  // Product whose image gallery is open in the lightbox (tap the 🔍 on a tile).
  const [previewProduct, setPreviewProduct] = useState(null)
  const [previewIdx, setPreviewIdx]     = useState(0)

  const boxRef        = useRef(null)
  const productRef    = useRef(null)
  const previewTouchX = useRef(0)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // The builder is mounted only while open, so this fires once per open regardless
  // of which entry point (Nav, Hero, footer…) triggered it.
  useEffect(() => { analytics.giftBoxOpen() }, [])

  useEffect(() => {
    // Escape closes the builder — but if the image lightbox is open, leave the
    // builder alone (the lightbox handles its own Escape below).
    const fn = (e) => { if (e.key === 'Escape' && !showLogin && !previewProduct) dispatch(closeBoxBuilder()) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [dispatch, showLogin, previewProduct])

  // Lightbox keyboard nav: ←/→ to slide between images, Escape to close.
  useEffect(() => {
    if (!previewProduct) return
    const urls = galleryUrls(previewProduct)
    const fn = (e) => {
      if (e.key === 'Escape') setPreviewProduct(null)
      else if (e.key === 'ArrowRight') setPreviewIdx(i => (i + 1) % urls.length)
      else if (e.key === 'ArrowLeft') setPreviewIdx(i => (i - 1 + urls.length) % urls.length)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [previewProduct])

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
    // Live box/wrap pricing from the backend enums (local constants bridge the gap)
    buildBoxApi.config()
      .then(({ data }) => { if (!cancelled) setServerCfg(data) })
      .catch(() => { /* keep fallback constants */ })
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
        // Admin per-size base price; replaces the size fee. null → fall back to the size base.
        prices: {
          SMALL:  b.priceSmall  != null ? Number(b.priceSmall)  : null,
          MEDIUM: b.priceMedium != null ? Number(b.priceMedium) : null,
          LARGE:  b.priceLarge  != null ? Number(b.priceLarge)  : null,
        },
      }))
    }
    return SONGS
  }, [buildBoxes])

  // Live pricing from the backend enums; the local constants only bridge the fetch.
  const boxConfig = useMemo(() => {
    if (!serverCfg?.sizes?.length) return BOX_CONFIG
    const byKey = Object.fromEntries(serverCfg.sizes.map(s => [s.key, s]))
    return Object.fromEntries(Object.entries(BOX_CONFIG).map(([label, c]) => {
      const s = byKey[c.apiKey]
      return [label, s ? { ...c, max: s.capacity, price: Number(s.basePrice) } : c]
    }))
  }, [serverCfg])
  const wraps = useMemo(() => {
    if (!serverCfg?.wraps?.length) return WRAPS
    return serverCfg.wraps.map(w => ({ key: w.key, name: w.displayName, price: Number(w.extraCost) }))
  }, [serverCfg])

  const BOX_MAX   = boxConfig[boxSize].max
  const wrapPrice = wraps.find(w => w.key === wrapType)?.price || 0
  // Mirrors GiftBoxService's total: box base + wrap + selected products. For an admin
  // box the base is its per-size price (replacing the size fee); built-in gradient boxes
  // use the BoxSize base. This is what the backend charges, so the display always matches.
  const adminBase     = selectedCard?.prices?.[boxConfig[boxSize].apiKey]
  const basePrice     = (adminBase != null) ? adminBase : boxConfig[boxSize].price
  const productsTotal = selectedProducts.reduce((s, p) => s + Number(p.price || 0), 0)
  const boxPrice      = basePrice + wrapPrice + productsTotal

  /* Filter products by recipient + category. A product with no recipients
     targets everyone, and can belong to more than one category. */
  const byRecipient = products.filter(p => {
    if (recipient === 'everyone') return true
    return !p.recipients?.length || p.recipients.includes(recipient)
  })
  const categories   = [...new Set(byRecipient.flatMap(p => p.categories || []))]
  const byCategory   = activeCategory ? byRecipient.filter(p => (p.categories || []).includes(activeCategory)) : byRecipient
  const displayProds = showAllProducts ? byCategory : byCategory.slice(0, 6)

  const toggleProduct = (product) => {
    const isSelected = selectedProducts.some(p => p.id === product.id)
    // Out-of-stock items can be viewed but never added — the server would
    // reject the whole box at create time with a confusing error otherwise.
    if (!isSelected && Number(product.stock) <= 0) return
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
      // Keep the builder mounted so the box survives; login opens on top (zIndex 1300)
      // and the add resumes automatically once the user is signed in.
      setPendingAdd(true)
      dispatch(openLogin())
      return
    }
    // Demo items only exist in the local catalog fallback — their ids would 404 on the server.
    if (selectedProducts.some(p => p.demo)) {
      setError('These are showcase samples — gift boxes with them cannot be ordered yet.')
      return
    }
    setSaving(true); setError('')
    try {
      const { data } = await giftBoxApi.create({
        size: boxConfig[boxSize].apiKey,
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

  const addToCartRef = useRef()
  // eslint-disable-next-line react-hooks/refs
  addToCartRef.current = handleAddToCart
  useEffect(() => {
    if (!pendingAdd) return
    if (isLoggedIn) {
      // Deferred a tick: resuming is an async side effect of the login completing.
      const t = setTimeout(() => { setPendingAdd(false); addToCartRef.current() }, 0)
      return () => clearTimeout(t)
    }
    if (!showLogin) {
      // Login dismissed without signing in — don't fire a surprise add later.
      const t = setTimeout(() => setPendingAdd(false), 0)
      return () => clearTimeout(t)
    }
  }, [pendingAdd, isLoggedIn, showLogin])

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Build your gift box" style={{ position: 'fixed', inset: 0, top: navH, zIndex: 1200, background: '#FAF7F2', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes pc-shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(6px)}45%{transform:translateX(-5px)}60%{transform:translateX(5px)}75%{transform:translateX(-3px)}90%{transform:translateX(3px)}}.pc-shake{animation:pc-shake 0.6s ease;border:2px solid #e53e3e!important;background:rgba(229,62,62,0.04)!important;}.gb-pills::-webkit-scrollbar{display:none}`}</style>

      {/* Floating close button */}
      <button
        onClick={() => dispatch(closeBoxBuilder())}
        aria-label="Close"
        style={{ position: 'fixed', top: navH + 14, right: 20, zIndex: 1210, width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 20, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
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
                <span style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', letterSpacing: '-0.01em', fontFamily: "'Playfair Display',serif" }}>Build Your Gift Box</span>
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
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', fontFamily: "'Playfair Display',serif" }}>{selectedCard.title}</span>
                  <span style={{ fontSize: 11, color: TC, fontWeight: 500 }}>✓ Selected</span>
                </div>
              ) : (
                <span style={{ fontSize: 13, color: '#9C7A63', fontWeight: 500 }}>Please select a box from below</span>
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
                  const bc = boxConfig[s]
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
                    }} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: boxSize === s ? 600 : 400, background: boxSize === s ? 'rgba(0,0,0,0.09)' : 'transparent', color: boxSize === s ? '#2C1A0E' : '#9C7A63', transition: 'all 0.2s', boxShadow: boxSize === s ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>{s}</button>
                  )
                })}
              </div>
              {/* Counter + price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '0 2px' }}>
                <span style={{ fontSize: 12 }}>
                  <span style={{ color: selectedProducts.length >= BOX_MAX ? GOLD : '#2C1A0E', fontWeight: 700 }}>{selectedProducts.length}</span>
                  <span style={{ color: '#9C7A63' }}>/{BOX_MAX} Items</span>
                </span>
                <span style={{ fontSize: 11, color: '#9C7A63' }}>{boxConfig[boxSize].desc}</span>
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
                <p style={{ fontSize: 11, color: '#9C7A63', margin: 0, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Box Preview</p>
                {selectedCard && <p style={{ fontSize: 12, color: GOLD, margin: 0, fontWeight: 500 }}>{selectedCard.title}</p>}
                <span style={{ fontSize: 11, color: selectedProducts.length >= BOX_MAX ? GOLD : '#9C7A63' }}>{selectedProducts.length}/{BOX_MAX} slots filled</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOX_MAX <= 2 ? 2 : 3}, 1fr)`, gap: 8 }}>
                {Array.from({ length: BOX_MAX }).map((_, i) => (
                  <div key={i} style={{ minHeight: 52, borderRadius: 9, border: `1px dashed ${selectedProducts[i] ? GOLD : 'rgba(0,0,0,0.1)'}`, background: selectedProducts[i] ? 'rgba(192,138,30,0.08)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', textAlign: 'center', position: 'relative' }}>
                    {selectedProducts[i] ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontSize: 11, color: GOLD, fontWeight: 500, lineHeight: 1.3 }}>{selectedProducts[i].name}</span>
                          <span style={{ fontSize: 10, color: '#9C7A63' }}>{fmtInr(selectedProducts[i].price)}</span>
                        </div>
                        <button type="button" onClick={() => setSelectedProducts(prev => prev.filter((_, j) => j !== i))} aria-label={`Remove ${selectedProducts[i].name} from box`} style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: 'rgba(212,155,35,0.3)', border: 'none', cursor: 'pointer', color: GOLD, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9C7A63' }}>Slot {i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient pills */}
            <div>
              <p style={{ fontSize: 11, color: '#9C7A63', margin: '0 0 10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Recipient</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[['everyone', 'For Everyone'], ['her', 'For Her'], ['him', 'For Him'], ['kids', 'For Kids']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => { setRecipient(val); setSelectedProducts([]); setActiveCategory(null) }}
                    style={{ padding: '7px 16px', borderRadius: 99, border: `1px solid ${recipient === val ? GOLD : 'rgba(0,0,0,0.1)'}`, background: recipient === val ? 'rgba(192,138,30,0.12)' : 'transparent', color: recipient === val ? GOLD : '#6B4F3A', fontSize: 13, fontWeight: recipient === val ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.17s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category pills */}
            <div>
              <p style={{ fontSize: 11, color: '#9C7A63', margin: '0 0 10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Category</p>
              <div ref={productRef} className={shakeProds ? 'pc-shake' : ''} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => setActiveCategory(null)}
                  style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${!activeCategory ? GOLD : 'rgba(0,0,0,0.1)'}`, background: !activeCategory ? 'rgba(192,138,30,0.12)' : '#fff', color: !activeCategory ? GOLD : '#6B4F3A', fontWeight: !activeCategory ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.17s', boxShadow: !activeCategory ? '0 0 0 1px rgba(192,138,30,0.25)' : 'none' }}>All</button>
                <div className="gb-pills" style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, scrollbarWidth: 'none', maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)', paddingBottom: 2 }}>
                  {categories.map(cat => {
                    const isActive = activeCategory === cat
                    return (
                      <button key={cat} type="button" onClick={() => setActiveCategory(isActive ? null : cat)}
                        style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${isActive ? GOLD : 'rgba(0,0,0,0.1)'}`, background: isActive ? 'rgba(192,138,30,0.12)' : '#fff', color: isActive ? GOLD : '#6B4F3A', fontWeight: isActive ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.17s', boxShadow: isActive ? '0 0 0 1px rgba(192,138,30,0.25)' : 'none', whiteSpace: 'nowrap' }}>
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
                <p style={{ fontSize: 11, color: '#9C7A63', margin: 0, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Choose Product</p>
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
                  const soldOut    = Number(p.stock) <= 0
                  const disabled   = (atMax || soldOut) && !isSelected
                  const catGrad    = CAT_GRADIENT[p.categories?.[0]] || 'linear-gradient(135deg,#f5eee6,#c9956b)'
                  // Same pricing/rating treatment as ProductCard, compacted for the picker grid:
                  // MRP strike-through + save % only when it's a real discount, stars only when rated.
                  const orig      = Number(p.originalPrice ?? p.origPrice)
                  const hasMrp    = Number.isFinite(orig) && orig > p.price
                  const save      = hasMrp ? Math.round((1 - p.price / orig) * 100) : 0
                  const rating    = p.rating != null ? Number(p.rating) : null
                  const reviews   = p.reviewCount ?? p.ratingCount ?? null
                  const pct       = rating != null ? Math.max(0, Math.min(100, rating / 5 * 100)) : 0
                  return (
                    <div key={p.id}
                      // Tap opens the product (image gallery + details); adding to the box
                      // happens from the "Add to box" button inside that lightbox.
                      onClick={() => { setPreviewProduct(p); setPreviewIdx(0) }}
                      role="button" tabIndex={0} aria-label={`View ${p.name}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPreviewProduct(p); setPreviewIdx(0) } }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.transform = 'translateY(-3px)' }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.transform = 'none' }}
                      style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', opacity: disabled ? 0.55 : 1, transform: isSelected ? 'translateY(-3px)' : 'none' }}>
                      <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 14, background: catGrad, overflow: 'hidden', marginBottom: 8, boxShadow: isSelected ? `0 0 0 2.5px ${GOLD}, 0 8px 22px rgba(192,138,30,0.22)` : '0 1px 4px rgba(44,26,14,0.08)', transition: 'box-shadow 0.25s ease' }}>
                        {p.imageUrl
                          ? <img src={cloudinaryOptimized(p.imageUrl, 300)} alt={p.name} draggable={false} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>{p.emoji}</div>}
                        {p.tag && (
                          <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 6, background: '#2C1A0E', color: '#fff', fontSize: 9, fontWeight: 600, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                            {p.tag === 'New' ? 'New In' : p.tag}
                          </span>
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                        {soldOut && (
                          <span style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 8px', borderRadius: 6, background: 'rgba(44,26,14,0.75)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.02em' }}>
                            Out of stock
                          </span>
                        )}
                        {/* Hint that the tile opens a gallery; badge shows the image count. */}
                        {p.imageUrls?.length > 1 && (
                          <span style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 99, background: 'rgba(44,26,14,0.6)', color: '#fff', fontSize: 9, fontWeight: 700, lineHeight: 1 }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            {p.imageUrls.length}
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#2C1A0E', fontFamily: "'Playfair Display',serif", lineHeight: 1.3 }}>{p.name}</h4>
                      {rating != null && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
                          <span style={{ position: 'relative', display: 'inline-block', fontSize: 10, lineHeight: 1, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'rgba(0,0,0,0.16)' }}>★★★★★</span>
                            <span style={{ position: 'absolute', left: 0, top: 0, width: pct + '%', overflow: 'hidden', color: '#C08A1E' }}>★★★★★</span>
                          </span>
                          {reviews != null && <span style={{ fontSize: 10, color: '#6B4F3A', whiteSpace: 'nowrap' }}>({reviews})</span>}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                        {hasMrp && <span style={{ fontSize: 10.5, color: '#9C7A63', textDecoration: 'line-through' }}>{fmtInr(orig)}</span>}
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{fmtInr(p.price)}</span>
                        {save > 0 && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#dc2626' }}>{save}% off</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Continue button */}
            <button type="button" onClick={handleContinue}
              style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: selectedCard && selectedProducts.length >= 1 ? 'linear-gradient(135deg,#C4704A,#B05F3C)' : 'rgba(0,0,0,0.08)', color: selectedCard && selectedProducts.length >= 1 ? '#fff' : '#9C7A63', border: 'none', borderRadius: 11, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', boxShadow: selectedCard && selectedProducts.length >= 1 ? '0 4px 16px rgba(196,112,74,0.35)' : 'none', transition: 'all 0.3s' }}>
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
              <img src={cloudinaryOptimized(selectedCard.imageUrl, 600)} alt={selectedCard.title || 'Selected box'}
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
            <p style={{ fontSize: 11, color: '#9C7A63', margin: '0 0 8px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              In Your Box · {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''}
            </p>
            {selectedProducts.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9C7A63', margin: 0 }}>No products selected yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedProducts.length, 4)}, 1fr)`, gap: 8 }}>
                {selectedProducts.map((prod) => (
                  <div key={prod.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ aspectRatio: '1 / 1', borderRadius: 9, overflow: 'hidden', position: 'relative', background: CAT_GRADIENT[prod.categories?.[0]] || 'linear-gradient(135deg,#f5eee6,#c9956b)' }}>
                      {prod.imageUrl
                        ? <img src={cloudinaryOptimized(prod.imageUrl, 200)} alt={prod.name} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{prod.emoji}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: '#6B4F3A', lineHeight: 1.25, textAlign: 'center', wordBreak: 'break-word' }}>{prod.name}</span>
                    <span style={{ fontSize: 11, color: '#9C7A63', textAlign: 'center' }}>{fmtInr(prod.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wrap selection */}
          <div>
            <p style={{ fontSize: 11, color: '#9C7A63', margin: '0 0 8px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gift Wrap</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 8 }}>
              {wraps.map(w => {
                const on = wrapType === w.key
                return (
                  <button key={w.key} type="button" onClick={() => setWrapType(w.key)}
                    style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', border: `1.5px solid ${on ? TC : 'rgba(0,0,0,0.1)'}`, background: on ? 'rgba(196,112,74,0.07)' : '#fff', transition: 'all 0.17s' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: on ? TC : '#2C1A0E' }}>{w.name}</span>
                    <span style={{ fontSize: 11, color: '#9C7A63' }}>{w.price === 0 ? 'Free' : `+${fmtInr(w.price)}`}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gift message */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px' }}>
              <p style={{ fontSize: 11, color: '#9C7A63', margin: 0, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gift Message <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
              <span style={{ fontSize: 11, color: giftMessage.length >= MSG_MAX ? GOLD : '#9C7A63' }}>{giftMessage.length}/{MSG_MAX}</span>
            </div>
            <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value.slice(0, MSG_MAX))} maxLength={MSG_MAX}
              rows={3} placeholder="Add a personal note to include in the box…"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 13, fontFamily: 'inherit', color: '#2C1A0E', outline: 'none', lineHeight: 1.4 }}
              onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
          </div>

          {/* Price summary — same breakdown the backend returns in GiftBoxDto */}
          <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B4F3A' }}>
              <span>{boxSize} box{selectedCard?.title ? ` · ${selectedCard.title}` : ''}</span>
              <span>{fmtInr(basePrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B4F3A' }}>
              <span>Gift wrap</span>
              <span>{wrapPrice === 0 ? 'Free' : fmtInr(wrapPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B4F3A' }}>
              <span>{selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''}</span>
              <span>{fmtInr(productsTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#2C1A0E', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 6, marginTop: 2 }}>
              <span>Total</span>
              <span>{fmtInr(boxPrice)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setView('form'); setError('') }} style={{ flex: 1, height: 38, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#2C1A0E', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Back to Settings</button>
            <button onClick={handleAddToCart} disabled={saving}
              style={{ flex: 1.4, height: 38, borderRadius: 10, border: 'none', background: saving ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg,#C4704A,#B05F3C)', color: saving ? '#9C7A63' : '#fff', fontSize: 13, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: saving ? 'none' : '0 4px 16px rgba(196,112,74,0.3)', transition: 'all 0.2s' }}>
              {saving ? 'Adding…' : `Add to Cart · ${fmtInr(boxPrice)}`}
            </button>
          </div>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626' }}>⚠ {error}</div>
          )}
        </div>
      )}

      {/* ── PRODUCT IMAGE LIGHTBOX ────────────────────────────── */}
      {previewProduct && (() => {
        const urls    = galleryUrls(previewProduct)
        const idx     = Math.min(previewIdx, Math.max(0, urls.length - 1))
        const multi   = urls.length > 1
        const isSel   = selectedProducts.some(sp => sp.id === previewProduct.id)
        const atMax   = selectedProducts.length >= BOX_MAX
        const soldOut = Number(previewProduct.stock) <= 0
        const catGrad = CAT_GRADIENT[previewProduct.categories?.[0]] || 'linear-gradient(135deg,#f5eee6,#c9956b)'
        const go      = (dir) => setPreviewIdx(i => (i + dir + urls.length) % urls.length)
        return (
          <div onClick={() => setPreviewProduct(null)}
            style={{ position: 'fixed', inset: 0, top: navH, zIndex: 1250, background: 'rgba(44,26,14,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} className="animate-fade-up"
              style={{ background: '#FAF7F2', borderRadius: 20, width: '100%', maxWidth: 420, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(44,26,14,0.45)' }}>

              {/* Swipeable image stage */}
              <div
                onTouchStart={(e) => { previewTouchX.current = e.touches[0].clientX }}
                onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - previewTouchX.current; if (multi && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1) }}
                style={{ position: 'relative', aspectRatio: '1 / 1', background: catGrad, overflow: 'hidden', userSelect: 'none' }}>
                {urls[idx]
                  ? <img src={cloudinaryOptimized(urls[idx], 500)} alt={`${previewProduct.name} — image ${idx + 1}`} draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>{previewProduct.emoji}</div>}

                <button type="button" onClick={() => setPreviewProduct(null)} aria-label="Close"
                  style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>×</button>

                {multi && (
                  <>
                    <button type="button" onClick={() => go(-1)} aria-label="Previous image"
                      style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <button type="button" onClick={() => go(1)} aria-label="Next image"
                      style={{ position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                    <span style={{ position: 'absolute', top: 12, left: 12, padding: '3px 9px', borderRadius: 99, background: 'rgba(44,26,14,0.6)', color: '#fff', fontSize: 11, fontWeight: 600 }}>{idx + 1}/{urls.length}</span>
                  </>
                )}
              </div>

              {/* Dots */}
              {multi && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 0 0' }}>
                  {urls.map((_, i) => (
                    <button key={i} type="button" onClick={() => setPreviewIdx(i)} aria-label={`Go to image ${i + 1}`}
                      style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0, background: i === idx ? TC : 'rgba(0,0,0,0.18)', transition: 'all 0.2s' }} />
                  ))}
                </div>
              )}

              {/* Info + add/remove */}
              <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#2C1A0E', fontFamily: "'Playfair Display',serif", lineHeight: 1.3 }}>{previewProduct.name}</h3>
                  <span style={{ flexShrink: 0, fontSize: 15, fontWeight: 700, color: TC }}>{fmtInr(previewProduct.price)}</span>
                </div>
                {previewProduct.description && (
                  <p style={{ margin: 0, fontSize: 12.5, color: '#6B4F3A', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto' }}>{previewProduct.description}</p>
                )}
                <button type="button" disabled={!isSel && (atMax || soldOut)}
                  onClick={() => { toggleProduct(previewProduct); setPreviewProduct(null) }}
                  style={{ height: 42, borderRadius: 11, border: isSel ? `1.5px solid ${GOLD}` : 'none', cursor: (!isSel && (atMax || soldOut)) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
                    background: isSel ? 'rgba(192,138,30,0.12)' : (!isSel && (atMax || soldOut)) ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg,#C4704A,#B05F3C)',
                    color: isSel ? GOLD : (!isSel && (atMax || soldOut)) ? '#9C7A63' : '#fff' }}>
                  {isSel ? '✓ In your box — remove' : soldOut ? 'Out of stock' : atMax ? `Box full · ${BOX_MAX} max` : '+ Add to box'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
