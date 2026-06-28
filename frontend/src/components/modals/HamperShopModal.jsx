import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeHamperShop } from '../../store/slices/uiSlice'
import { setActiveProduct } from '../../store/slices/uiSlice'
import { selectHampers } from '../../store/slices/productsSlice'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import ProductCard from '../ui/ProductCard'
import { useProductFilters, ProductFilterBar } from '../ui/ProductFilters'

export default function HamperShopModal() {
  const dispatch = useDispatch()
  const products = useSelector(selectHampers)
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024

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

  const { filters, activeFilter, setActiveFilter, sort, setSort, sorted } = useProductFilters(products)

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
        <ProductFilterBar
          count={sorted.length}
          filters={filters}
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
          sort={sort}
          onSort={setSort}
        />
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
