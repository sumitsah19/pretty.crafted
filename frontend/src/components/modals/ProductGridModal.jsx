import { useEffect } from 'react'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { useModalFocus } from '../../hooks/useModalFocus'
import ProductCard, { ProductSkeleton } from '../ui/ProductCard'
import { useProductFilters } from '../../hooks/useProductFilters'
import { ProductFilterBar } from '../ui/ProductFilters'

/**
 * Full-screen product-browsing modal (title bar → filter/sort bar → grid).
 * Shared by ShopModal (all products) and HamperShopModal (hampers), which
 * differ only in title, data source, and close action.
 */
export default function ProductGridModal({ title, products, loading = false, onClose, onProductClick }) {
  const dialogRef = useModalFocus()
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024

  // Close on Escape + lock body scroll
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const { filters, activeFilter, setActiveFilter, sort, setSort, sorted } = useProductFilters(products)

  const cols = isMobile ? 2 : isTablet ? 3 : 5

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: '#FAF7F2', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #EDE4D8', padding: isMobile ? '14px 16px' : '16px 48px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onClose}
          aria-label="Back"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: '#2C1A0E', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
        </button>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 20 : 28, fontWeight: 700, color: '#2C1A0E', flex: 1, textAlign: 'center', margin: 0 }}>
          {title}
        </h1>
        <button
          onClick={onClose}
          aria-label="Close"
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
        {loading
          ? Array.from({ length: cols * 2 }).map((_, i) => <ProductSkeleton key={i} />)
          : sorted.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => onProductClick(p)}
              />
            ))
        }
      </div>
    </div>
  )
}
