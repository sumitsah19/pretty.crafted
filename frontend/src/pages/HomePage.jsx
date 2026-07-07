import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { selectProducts, selectProductsLoading, selectHampers } from '../store/slices/productsSlice'
import { fetchCategories, selectCategories } from '../store/slices/categoriesSlice'
import { openBoxBuilder, openHamperShop, openShop, setActiveProduct, setActiveOccasion } from '../store/slices/uiSlice'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { occasionsApi, newsletterApi } from '../api/services'
import Hero from '../components/Hero'
import ProductCard, { ProductSkeleton } from '../components/ui/ProductCard'
import { useProductFilters } from '../hooks/useProductFilters'

const TC = '#C4704A'

// Occasion catalogue is admin-managed (Admin → Occasions, /api/public/occasions),
// which only ever returns visible occasions. The hero banner is driven by
// `active` + `featured`: an occasion must be marked active ("eligible for the
// featured banner") before it can be marked the single `featured` one — the
// admin API enforces that at most one occasion is featured at a time. Only the
// featured-and-active occasion ever appears in the banner — see featuredOcc below.
function normalizeOccasion(o) {
  return {
    id: o.slug,
    title: o.title,
    sub: o.description,
    icon: o.icon,
    iconImg: o.iconImageUrl,
    color: o.color,
    season: o.season,
    ctaLabel: o.ctaLabel,
    active: o.active,
    featured: o.featured,
  }
}

// Discovery card that sits as the final item inside a horizontal product row.
// Mirrors ProductCard's footprint (square + name) so it reads as a natural last tile.
function ViewAllCard({ width, label = 'View All Products', onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } }}
      style={{ flexShrink: 0, width, scrollSnapAlign: 'start', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{
        position: 'relative', aspectRatio: '1/1', borderRadius: 14,
        background: hover ? `linear-gradient(135deg, ${TC} 0%, #A85A38 100%)` : '#FAF7F2',
        border: hover ? '1px solid transparent' : '1.5px dashed #D9CBBF',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        marginBottom: 12, transition: 'all 0.3s',
        boxShadow: hover ? '0 10px 28px rgba(196,112,74,0.28)' : '0 1px 4px rgba(44,26,14,0.06)',
        transform: hover ? 'translateY(-3px)' : 'none',
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: hover ? 'white' : TC, color: hover ? TC : 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, transition: 'all 0.3s',
          boxShadow: '0 4px 14px rgba(196,112,74,0.3)',
        }}>→</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hover ? 'white' : TC, transition: 'color 0.3s' }}>Browse All</div>
      </div>
      <h4 style={{ margin: '0 0 6px', textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#2C1A0E', fontFamily: "'Playfair Display',serif" }}>
        {label}
      </h4>
    </div>
  )
}

// Single horizontal scrollable row of product cards, capped with an in-row "View All" card.
// Used by every homepage product section so they share one row layout on all screen sizes.
function ProductRow({ items, cardW, gap, loading, skeletonCount = 4, viewLabel, onView, scrollRef, dispatch }) {
  return (
    <div
      ref={scrollRef}
      className="no-scrollbar"
      style={{ display: 'flex', gap, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}
    >
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} style={{ scrollSnapAlign: 'start', flexShrink: 0, width: cardW }}><ProductSkeleton /></div>
          ))
        : (
          <>
            {items.map(p => (
              <div key={p.id} style={{ scrollSnapAlign: 'start', flexShrink: 0, width: cardW }}>
                <ProductCard product={p} onClick={() => dispatch(setActiveProduct(p))} />
              </div>
            ))}
            {onView && <ViewAllCard width={cardW} label={viewLabel} onClick={onView} />}
          </>
        )}
    </div>
  )
}

export default function HomePage() {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const loading = useSelector(selectProductsLoading)
  const hampers = useSelector(selectHampers)
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024
  const px = isMobile ? '20px' : isTablet ? '32px' : '48px'
  // Shared sizing for the homepage's single-row product carousels
  const rowCardW = isMobile ? 150 : 220
  const rowGap = isMobile ? 12 : 20
  const ROW_CAP = 10
  const [activeRecipient, setActiveRecipient] = useState('all')
  const [emailVal, setEmailVal] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [newsletterError, setNewsletterError] = useState('')

  const submitNewsletter = async () => {
    if (subscribed || subscribing) return
    // Minimal sanity check: a non-empty local part, an @, and a dotted domain.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal.trim())) {
      setNewsletterError('Please enter a valid email address.')
      return
    }
    setNewsletterError('')
    setSubscribing(true)
    try {
      await newsletterApi.subscribe(emailVal.trim())
      setSubscribed(true)
      setEmailVal('')
    } catch (err) {
      setNewsletterError(err.response?.data?.message || 'Could not subscribe right now — please try again.')
    } finally {
      setSubscribing(false)
    }
  }
  const [occasions, setOccasions] = useState([])
  const [occLoading, setOccLoading] = useState(true)
  // Footer "Shop" column — real category names from the shared cache (fetched once).
  const categories = useSelector(selectCategories)

  useEffect(() => {
    occasionsApi.list()
      .then(({ data }) => setOccasions((data || []).map(normalizeOccasion)))
      .catch(() => setOccasions([]))
      .finally(() => setOccLoading(false))
  }, [])

  useEffect(() => { dispatch(fetchCategories()) }, [dispatch])

  // Deep-link support: visiting /occasions/:id directly (e.g. from a shared
  // link or search result) must open that occasion's page, not just the plain
  // homepage — activeOccasion previously had no connection to the URL at all.
  const { id: occasionSlug } = useParams()
  useEffect(() => {
    if (!occasionSlug || occasions.length === 0) return
    const match = occasions.find(o => o.id === occasionSlug)
    if (match) dispatch(setActiveOccasion(match))
  }, [occasionSlug, occasions, dispatch])

  // Featured Collection: recipient (from "Shop by Recipient") narrows the base,
  // then the shared count + sort + category-chip bar refines it. A product with
  // no explicit recipients targets everyone (the old "all"), and one can target
  // more than one recipient at once, so this is a membership check, not equality.
  const recipientProducts = useMemo(
    () => products.filter(p => activeRecipient === 'all' || !p.recipients?.length || p.recipients.includes(activeRecipient)),
    [products, activeRecipient]
  )
  const { sorted: featSorted } = useProductFilters(recipientProducts)

  const bestsellers = useMemo(
    () => products.filter(p => p.tag === 'Bestseller'),
    [products]
  )

  // Stable shuffle: seeded by products length so it only re-randomises when the product list changes
  const recommended = useMemo(() => {
    const copy = [...products]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor((i + 1) * 0.37)  // deterministic-ish, no random re-renders
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, 10)
  }, [products])

  const scrollTo = id => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
  }

  // Featured occasion
  // Featured banner = the occasion marked both `featured` and `active`. Marking a
  // different occasion Featured in Admin → Occasions (e.g. Father's Day, Diwali)
  // automatically swaps the banner here; everything else flows into the scroll row.
  const featuredOcc = occasions.find(o => o.featured && o.active) || occasions[0]
  const restOcc = occasions.filter(o => o.id !== featuredOcc?.id)

  return (
    <>
      <Hero />

      {/* ── FEATURED COLLECTION ───────────────────────────── */}
      <section id="featured-collection" style={{ padding: isMobile ? `0 20px 56px` : `0 ${px} 80px` }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {/* Shop by Recipient — was previously only reachable via 3 buried
              footer links; this is the discoverable, in-page control. */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            {[['all', 'All'], ['her', 'For Her'], ['him', 'For Him'], ['kids', 'For Kids']].map(([value, label]) => (
              <button key={value} onClick={() => setActiveRecipient(value)}
                style={{ padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${activeRecipient === value ? TC : '#EDE4D8'}`, background: activeRecipient === value ? TC : 'white', color: activeRecipient === value ? 'white' : '#2C1A0E', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Featured Collection</h2>
        </div>
        <ProductRow
          items={featSorted.slice(0, ROW_CAP)}
          cardW={rowCardW}
          gap={rowGap}
          loading={loading}
          skeletonCount={isMobile ? 4 : 6}
          viewLabel="View All Products"
          onView={() => dispatch(openShop())}
          dispatch={dispatch}
        />
      </section>

      {/* ── GIFT BOX CTA BANNER ───────────────────────────── */}
      <section style={{ margin: isMobile ? '0 20px 56px' : `0 ${px} 80px`, borderRadius: isMobile ? 20 : 28, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${TC} 0%, #A85A38 100%)`, padding: isMobile ? '40px 24px' : isTablet ? '48px 48px' : '64px 72px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 24 : 48 }}>
          <div style={{ flex: 1, color: 'white' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75, marginBottom: 10 }}>New Feature ✦</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 'clamp(22px,6vw,32px)' : 'clamp(28px,4vw,42px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}>Build a Gift Box <br /><em>They'll Never Forget</em></h2>
            <p style={{ opacity: 0.85, fontSize: isMobile ? 14 : 16, lineHeight: 1.65, marginBottom: 24, maxWidth: 420 }}>Mix and match handcrafted items, add a personal note, choose a ribbon — we'll wrap it all beautifully.</p>
            <button onClick={() => dispatch(openBoxBuilder())} style={{ padding: '14px 30px', borderRadius: 99, background: 'white', color: TC, fontWeight: 700, fontSize: isMobile ? 14 : 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minHeight: 48 }}>Start Building →</button>
          </div>
          {!isMobile && <div style={{ fontSize: 100, flexShrink: 0, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))' }}>🎁</div>}
        </div>
      </section>

      {/* ── BESTSELLERS CAROUSEL ──────────────────────────── */}
      <section id="bestsellers" style={{ padding: isMobile ? `0 20px 56px` : `0 ${px} 80px` }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Most Loved</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Best Sellers</h2>
        </div>
        <ProductRow
          items={bestsellers.slice(0, ROW_CAP)}
          cardW={rowCardW}
          gap={rowGap}
          viewLabel="View All Best Sellers"
          onView={() => dispatch(openShop())}
          dispatch={dispatch}
        />
      </section>

      {/* ── OCCASIONS ─────────────────────────────────────── */}
      <section id="occasions" style={{ padding: isMobile ? '48px 20px 56px' : isTablet ? '60px 32px 72px' : '72px 48px 96px', background: '#FAF7F2' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 36 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Browse by Moment</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 26 : 36, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.1 }}>Gifts for Every Occasion</h2>
        </div>

        {/* Featured occasion card — content is admin-managed (Admin → Occasions);
            show a shimmer placeholder in this exact slot until it loads so there's
            never a layout jump. */}
        {occLoading || !featuredOcc ? (
          <div style={{ marginBottom: isMobile ? 28 : 32, height: isMobile ? 260 : 340, borderRadius: isMobile ? 20 : 28, background: 'linear-gradient(90deg,#EDE4D8 25%,#E5DBD0 50%,#EDE4D8 75%)', backgroundSize: '400% 100%', animation: 'skShimmer 1.5s ease-in-out infinite' }} />
        ) : (
        <div style={{ marginBottom: isMobile ? 28 : 32 }}>
          <div onClick={() => dispatch(setActiveOccasion(featuredOcc))}
            role="button"
            tabIndex={0}
            aria-label={featuredOcc.ctaLabel || `Shop ${featuredOcc.title}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch(setActiveOccasion(featuredOcc)) } }}
            style={{ background: `linear-gradient(130deg, ${featuredOcc.color} 0%, #FAF7F2 70%)`, borderRadius: isMobile ? 20 : 28, padding: isMobile ? '28px 24px' : '44px 56px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 20 : 48, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 16px 48px rgba(44,26,14,0.12)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', borderRadius: 99, padding: '5px 12px', fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                ✦ Featured this {featuredOcc.season || 'season'}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 28 : 44, fontWeight: 700, lineHeight: 1.05, color: '#2C1A0E', marginBottom: 12 }}>{featuredOcc.title}</h3>
              <p style={{ fontSize: isMobile ? 14 : 16, color: '#6B4F3A', lineHeight: 1.65, marginBottom: 22, maxWidth: 440 }}>
                {featuredOcc.sub}. Hand-picked and hand-wrapped, ready to make someone feel truly cherished.
              </p>
              {!isMobile && (
                <button onClick={e => { e.stopPropagation(); dispatch(setActiveOccasion(featuredOcc)) }}
                  style={{ padding: '13px 28px', borderRadius: 99, border: 'none', background: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(44,26,14,0.18)' }}>
                  {featuredOcc.ctaLabel || 'Shop the Edit'} →
                </button>
              )}
            </div>
            <div style={{ fontSize: isMobile ? 100 : 160, lineHeight: 1, flexShrink: 0, animation: 'float 3.5s ease-in-out infinite', filter: 'drop-shadow(0 12px 28px rgba(44,26,14,0.12))' }}>
              {featuredOcc.iconImg
                ? <img src={featuredOcc.iconImg} alt={featuredOcc.title} style={{ width: isMobile ? 160 : 260, height: 'auto', display: 'block' }} />
                : featuredOcc.icon}
            </div>
            {isMobile && (
              <button onClick={e => { e.stopPropagation(); dispatch(setActiveOccasion(featuredOcc)) }}
                style={{ padding: '12px 24px', borderRadius: 99, border: 'none', background: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(44,26,14,0.18)' }}>
                {featuredOcc.ctaLabel || 'Shop the Edit'} →
              </button>
            )}
            <div style={{ position: 'absolute', top: isMobile ? 16 : 24, right: isMobile ? 16 : 24, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#2C1A0E', letterSpacing: '0.06em' }}>
              Limited Edit
            </div>
          </div>
        </div>
        )}

        {/* Occasions scroll: portrait-ratio cards, icon top-right, text bottom-left */}
        <div style={{ display: 'flex', gap: isMobile ? 12 : 16, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }} className="no-scrollbar">
          {occLoading
            ? Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: isMobile ? 148 : 192, aspectRatio: '3/3.6', borderRadius: isMobile ? 16 : 20, background: 'linear-gradient(90deg,#EDE4D8 25%,#E5DBD0 50%,#EDE4D8 75%)', backgroundSize: '400% 100%', animation: 'skShimmer 1.5s ease-in-out infinite' }} />
              ))
            : restOcc.map(o => (
            <button key={o.id} onClick={() => dispatch(setActiveOccasion(o))}
              style={{ flexShrink: 0, width: isMobile ? 148 : 192, aspectRatio: '3/3.6', background: o.color, borderRadius: isMobile ? 16 : 20, border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'start', padding: 0, transition: 'transform 0.3s cubic-bezier(.2,.9,.3,1.4), box-shadow 0.3s', textAlign: 'left', boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(44,26,14,0.16)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(44,26,14,0.06)' }}>
              <div style={{ position: 'absolute', top: isMobile ? 12 : 16, right: isMobile ? 12 : 16, fontSize: isMobile ? 40 : 52, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(44,26,14,0.1))' }}>
                {o.iconImg
                  ? <img src={o.iconImg} alt={o.title} style={{ width: isMobile ? 64 : 84, height: 'auto', display: 'block' }} />
                  : o.icon}
              </div>
              <div style={{ position: 'absolute', bottom: isMobile ? 14 : 20, left: isMobile ? 14 : 18, right: isMobile ? 14 : 18 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.2, marginBottom: 3 }}>{o.title}</div>
                <div style={{ fontSize: isMobile ? 10 : 11, color: '#6B4F3A', lineHeight: 1.4 }}>{o.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── HAMPER FOR YOU ────────────────────────────────── */}
      <section id="hamper-for-you" style={{ padding: isMobile ? '0 20px 56px' : `0 ${px} 80px` }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Curated Collections</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Hamper For You</h2>
        </div>
        <ProductRow
          items={hampers.slice(0, ROW_CAP)}
          cardW={rowCardW}
          gap={rowGap}
          viewLabel="Show All Hampers"
          onView={() => dispatch(openHamperShop())}
          dispatch={dispatch}
        />
      </section>

      {/* ── RECOMMENDED FOR YOU ───────────────────────────── */}
      <section style={{ padding: isMobile ? '0 20px 56px' : `0 ${px} 80px` }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Picked for you</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Recommended For You</h2>
        </div>
        <ProductRow
          items={recommended}
          cardW={rowCardW}
          gap={rowGap}
          loading={loading}
          skeletonCount={isMobile ? 4 : 6}
          viewLabel="View All Products"
          onView={() => dispatch(openShop())}
          dispatch={dispatch}
        />
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 20px' : isTablet ? '64px 32px' : '80px 48px', background: '#F5EEE6' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Simple & Joyful</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 26 : 36, fontWeight: 700 }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? 24 : 32, maxWidth: 900, margin: '0 auto' }}>
          {[
            { n: '01', title: 'Browse & Pick',    desc: 'Discover handcrafted treasures from artisans worldwide',        emoji: '🛍️' },
            { n: '02', title: 'Build Your Box',   desc: 'Drag items into your box, pick a ribbon color',                 emoji: '🎁' },
            { n: '03', title: 'Write Your Heart', desc: 'Add a message printed on a card inside',                       emoji: '💌' },
            { n: '04', title: 'We Deliver Joy',   desc: 'Arrives in eco-friendly packaging, ready to unwrap',           emoji: '🌿' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 32 : 40, marginBottom: 12 }}>{s.emoji}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: TC, marginBottom: 6 }}>{s.n}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 14 : 17, fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: isMobile ? 12 : 14, color: '#6B4F3A', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>


      {/* ── NEWSLETTER ────────────────────────────────────── */}
      <section style={{ margin: isMobile ? '0 20px 56px' : `0 ${px} 80px`, borderRadius: isMobile ? 20 : 28, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${TC} 0%, #A85A38 100%)`, padding: isMobile ? '40px 24px' : '56px 64px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 28 : 48 }}>
          <div style={{ flex: 1, color: 'white' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>✦ Stay in the loop</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 'clamp(22px,5vw,30px)' : 'clamp(26px,3vw,38px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>Gifts, Stories &<br />Handcrafted Finds</h2>
            <p style={{ fontSize: isMobile ? 13 : 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', maxWidth: 360 }}>Get early access to new collections, seasonal gift guides, and subscriber-only offers.</p>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
              <input type="email" value={emailVal} onChange={e => { setEmailVal(e.target.value); if (newsletterError) setNewsletterError('') }}
                onKeyDown={e => { if (e.key === 'Enter') submitNewsletter() }} placeholder="your@email.com"
                style={{ flex: 1, padding: '14px 18px', borderRadius: 99, border: 'none', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(4px)' }}
                onFocus={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onBlur={e => e.target.style.background = 'rgba(255,255,255,0.1)'} />
              <button onClick={submitNewsletter} disabled={subscribed || subscribing}
                style={{ padding: '14px 28px', borderRadius: 99, border: 'none', background: subscribed ? '#7A9A6B' : 'white', color: subscribed ? 'white' : TC, fontWeight: 700, fontSize: 14, cursor: subscribed || subscribing ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 6px 20px rgba(44,26,14,0.18)', transition: 'background 0.3s, color 0.3s', opacity: subscribing ? 0.7 : 1 }}>
                {subscribed ? 'Subscribed ✓' : subscribing ? 'Subscribing…' : 'Subscribe →'}
              </button>
            </div>
            {newsletterError
              ? <div style={{ fontSize: 12, color: 'white', fontWeight: 600, marginTop: 10 }}>{newsletterError}</div>
              : subscribed
                ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 10 }}>You're on the list — see you in your inbox! 💌</div>
                : <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>No spam, unsubscribe anytime. We respect your inbox.</div>}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background: `linear-gradient(135deg, ${TC} 0%, #A85A38 100%)`, color: 'rgba(255,255,255,0.85)', padding: isMobile ? '40px 20px 32px' : '60px 48px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? 28 : 40, marginBottom: isMobile ? 32 : 48 }}>
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 10 }}>
              Prettycrafted
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', maxWidth: 260 }}>Prettycrafted — curating handcrafted gifts that carry warmth, intention, and love.</p>
          </div>
          {[
            { title: 'Shop',
              links:   [...categories.slice(0, 5).map(c => c.name), 'Gift Boxes'],
              hrefs:   [...categories.slice(0, 5).map(() => '/shop'), '/gift-boxes'],
              actions: [...categories.slice(0, 5).map(() => () => scrollTo('featured-collection')), () => dispatch(openBoxBuilder())] },
            { title: 'Gifting',
              links:   ['Gift Box Builder', 'Occasions', 'For Her', 'For Him', 'For Kids'],
              hrefs:   ['/gift-boxes', '/#occasions', '/shop', '/shop', '/shop'],
              actions: [() => dispatch(openBoxBuilder()), () => scrollTo('occasions'), () => { setActiveRecipient('her'); scrollTo('featured-collection') }, () => { setActiveRecipient('him'); scrollTo('featured-collection') }, () => { setActiveRecipient('kids'); scrollTo('featured-collection') }] },
            { title: 'Legal',
              plain:   true,
              links:   ['Terms of Service', 'Privacy Policy', 'Return & Refund Policy', 'Shipping & Delivery Policy', 'Cancellation Policy', 'Cookie Policy & Settings', 'Payment Terms', 'Contact & Customer Support'],
              hrefs:   ['/terms', '/privacy', '/return-refund-policy', '/shipping-delivery-policy', '/cancellation-policy', '/cookie-policy', '/payment-terms', '/contact-support'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'white', marginBottom: 14 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map((l, li) => (
                  <a key={l} href={col.hrefs[li]} {...(col.plain ? {} : { onClick: e => { e.preventDefault(); col.actions[li]?.() } })}
                    style={{ color: 'rgba(255,255,255,0.78)', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'white'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.78)'}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>© 2026 Prettycrafted. Made with ♥</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Shipping', href: '/shipping-delivery-policy' }].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{l.label}</a>
            ))}
          </div>
        </div>
      </footer>

    </>
  )
}
