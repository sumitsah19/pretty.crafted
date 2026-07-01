import { useState, useMemo } from 'react'

export const FIXED_FILTERS = ['ALL', 'BESTSELLER', 'NEW IN']
export const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Most Reviews']

/* Shared filter/sort logic for ProductCard-based grids (products carry
   price / reviewCount / tag / category). Returns the chip list plus the
   filtered-and-sorted result. Lives apart from ProductFilterBar so the
   component file only exports components (react-refresh requirement). */
export function useProductFilters(products) {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [sort, setSort] = useState('Featured')

  const filters = useMemo(() => {
    // A product can belong to more than one category, so a single product can
    // contribute more than one chip here — flatMap instead of map.
    const cats = [...new Set(products.flatMap(p => p.categories ?? []).filter(Boolean))]
    return [...FIXED_FILTERS, ...cats]
  }, [products])

  const filtered = useMemo(() => products.filter(p => {
    if (activeFilter === 'ALL') return true
    if (activeFilter === 'BESTSELLER') return p.tag === 'Best Seller' || p.tag === 'Bestseller'
    if (activeFilter === 'NEW IN') return p.tag === 'New' || p.tag === 'New In'
    return (p.categories ?? []).includes(activeFilter)
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
