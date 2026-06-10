import { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeHamperShop } from '../../store/slices/uiSlice'
import { setActiveProduct } from '../../store/slices/uiSlice'
import { selectHampers } from '../../store/slices/productsSlice'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import ProductCard from '../ui/ProductCard'

const TC = '#C4704A'
const FILTERS = ['ALL', 'BESTSELLER', 'NEW IN']
const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Most Reviews']

export default function HamperShopModal() {
  const dispatch = useDispatch()
  const products = useSelector(selectHampers)
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024

  const [activeFilter, setActiveFilter] = useState('ALL')
  const [sort, setSort] = useState('Featured')

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dispatch(closeHamperShop()) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const filters = FILTERS

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (activeFilter === 'ALL') return true
      if (activeFilter === 'BESTSELLER') return p.tag === 'Best Seller' || p.tag === 'Bestseller'
      if (activeFilter === 'NEW IN') return p.tag === 'New' || p.tag === 'New In'
      return p.category === activeFilter
    })
  }, [products, activeFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'Price: Low to High') arr.sort((a, b) => a.price - b.price)
    else if (sort === 'Price: High to Low') arr.sort((a, b) => b.price - a.price)
    else if (sort === 'Most Reviews') arr.sort((a, b) => ((b.reviews ?? 0) - (a.reviews ?? 0)))
    return arr
  }, [filtered, sort])

  const cols = isMobile ? 2 : isTablet ? 3 : 5

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: '#FAF7F2', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #EDE4D8', padding: isMobile ? '14px 16px' : '16px 48px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => dispatch(closeHamperShop())}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: '#2C1A0E', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
        </button>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 20 : 28, fontWeight: 700, color: '#2C1A0E', flex: 1, textAlign: 'center', margin: 0 }}>
          Gift Hampers
        </h1>
        <button
          onClick={() => dispatch(closeHamperShop())}
          style={{ background: 'none', border: '1px solid #EDE4D8', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B4F3A', fontSize: 16, flexShrink: 0 }}
        >
          ✕
        </button>
      </div>

      {/* Sub-bar: count + filters + sort */}
      <div style={{ padding: isMobile ? '14px 16px 0' : '18px 48px 0', background: 'white', borderBottom: '1px solid #EDE4D8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: '#6B4F3A', fontWeight: 600 }}>{sorted.length} Products</span>
          <div style={{ position: 'relative' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ padding: '6px 28px 6px 12px', borderRadius: 8, border: '1px solid #EDE4D8', background: 'white', fontSize: 12, color: '#2C1A0E', fontWeight: 600, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'inherit' }}
            >
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        {/* Filter chips */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                flexShrink: 0, padding: '7px 16px', borderRadius: 99,
                border: `1.5px solid ${activeFilter === f ? TC : '#EDE4D8'}`,
                background: activeFilter === f ? TC : 'white',
                color: activeFilter === f ? 'white' : '#2C1A0E',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div style={{ padding: isMobile ? '20px 16px 64px' : '28px 48px 80px', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 12 : 20 }}>
        {sorted.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => { dispatch(closeHamperShop()); dispatch(setActiveProduct(p)) }}
          />
        ))}
      </div>
    </div>
  )
}
