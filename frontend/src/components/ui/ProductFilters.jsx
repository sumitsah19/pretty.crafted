import { useState, useMemo } from 'react'

const TC = '#C4704A'

export const FIXED_FILTERS = ['ALL', 'BESTSELLER', 'NEW IN']
export const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Most Reviews']

/* Shared filter/sort logic for ProductCard-based grids (products carry
   price / reviewCount / tag / category). Returns the chip list plus the
   filtered-and-sorted result. */
export function useProductFilters(products) {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [sort, setSort] = useState('Featured')

  const filters = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
    return [...FIXED_FILTERS, ...cats]
  }, [products])

  const filtered = useMemo(() => products.filter(p => {
    if (activeFilter === 'ALL') return true
    if (activeFilter === 'BESTSELLER') return p.tag === 'Best Seller' || p.tag === 'Bestseller'
    if (activeFilter === 'NEW IN') return p.tag === 'New' || p.tag === 'New In'
    return p.category === activeFilter
  }), [products, activeFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'Price: Low to High') arr.sort((a, b) => a.price - b.price)
    else if (sort === 'Price: High to Low') arr.sort((a, b) => b.price - a.price)
    else if (sort === 'Most Reviews') arr.sort((a, b) => ((b.reviewCount ?? b.ratingCount ?? 0) - (a.reviewCount ?? a.ratingCount ?? 0)))
    return arr
  }, [filtered, sort])

  return { filters, activeFilter, setActiveFilter, sort, setSort, sorted }
}

/* The "{count} Products" + sort dropdown + filter-chip row from the Shop page.
   Kept presentational so bespoke callers (e.g. OccasionPage, which has its own
   data model) can drive it with their own state and sort options. */
export function ProductFilterBar({
  count, countLabel = 'Products',
  filters, activeFilter, onFilter,
  sort, onSort, sortOptions = SORT_OPTIONS,
  accent = TC, chipsWrap = false,
  showCount = true, inlineSort = false,
}) {
  const opts = sortOptions.map(o => (typeof o === 'string' ? { value: o, label: o } : o))

  const sortEl = (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <select
        value={sort}
        onChange={e => onSort(e.target.value)}
        style={{ padding: '6px 28px 6px 12px', borderRadius: 8, border: '1px solid #EDE4D8', background: 'white', fontSize: 12, color: '#2C1A0E', fontWeight: 600, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'inherit' }}
      >
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )

  const chipsEl = (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: chipsWrap ? 'visible' : 'auto', flexWrap: chipsWrap ? 'wrap' : 'nowrap', flex: inlineSort ? 1 : undefined, minWidth: 0 }}>
      {filters.map(f => (
        <button
          key={f}
          onClick={() => onFilter(f)}
          style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: 99,
            border: `1.5px solid ${activeFilter === f ? accent : '#EDE4D8'}`,
            background: activeFilter === f ? accent : 'white',
            color: activeFilter === f ? 'white' : '#2C1A0E',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
        >
          {f}
        </button>
      ))}
    </div>
  )

  // Compact layout: category chips on the left, sort dropdown on the right, same row.
  if (inlineSort) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 14 }}>
        {chipsEl}
        {sortEl}
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: showCount ? 'space-between' : 'flex-end', marginBottom: 14 }}>
        {showCount && <span style={{ fontSize: 13, color: '#6B4F3A', fontWeight: 600 }}>{count} {countLabel}</span>}
        {sortEl}
      </div>
      <div style={{ paddingBottom: 14 }}>{chipsEl}</div>
    </>
  )
}
