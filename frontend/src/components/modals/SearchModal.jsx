import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeSearch, setActiveProduct } from '../../store/slices/uiSlice'
import { addLocal } from '../../store/slices/cartSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { useDebounce } from '../../hooks/useDebounce'

const TC = '#C4704A'
const RECENT_KEY = 'pc_searches'

export default function SearchModal() {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
  })
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('')
  const inputRef = useRef(null)

  const debouncedQ = useDebounce(q, 280)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') dispatch(closeSearch()) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [dispatch])

  // Show loading spinner immediately on keystroke for responsive feel
  useEffect(() => {
    if (q.trim()) setLoading(true)
    else { setResults([]); setLoading(false) }
  }, [q])

  // Run the actual filter only after debounce settles
  useEffect(() => {
    if (!debouncedQ.trim()) { setResults([]); setLoading(false); return }

    const filtered = products.filter((p) => {
      const text = (p.name + ' ' + p.category + ' ' + (p.tag || '')).toLowerCase()
      const matchQ = debouncedQ.toLowerCase().split(' ').every((w) => text.includes(w))
      const matchCat = !category || p.category === category
      return matchQ && matchCat
    })

    const sorted = [...filtered]
    if (sortBy === 'price_asc') sorted.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price_desc') sorted.sort((a, b) => b.price - a.price)

    setResults(sorted)
    setLoading(false)
  }, [debouncedQ, category, sortBy, products])

  // Save to recent searches separately so it doesn't affect the filter effect
  useEffect(() => {
    if (!debouncedQ.trim()) return
    setRecentSearches((prev) => {
      const saved = [debouncedQ, ...prev.filter((s) => s !== debouncedQ)].slice(0, 6)
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(saved)) } catch {}
      return saved
    })
  }, [debouncedQ])

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))]

  return (
    <div onClick={(e) => e.target === e.currentTarget && dispatch(closeSearch())} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(44,26,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 16px 16px' }}>
      <div style={{ width: '100%', maxWidth: 680, background: '#FAF7F2', borderRadius: 24, boxShadow: '0 32px 80px rgba(44,26,14,0.25)', overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} className="animate-fade-up">
        {/* Search input */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDE4D8', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 14, padding: '12px 16px', border: `1.5px solid ${TC}` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C7A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gifts, occasions, categories..." style={{ flex: 1, border: 'none', background: 'none', fontSize: 16, color: '#2C1A0E', outline: 'none', fontFamily: "'DM Sans',sans-serif" }} />
            {q && <button onClick={() => { setQ(''); setResults([]) }} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
            <button onClick={() => dispatch(closeSearch())} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9C7A63', fontWeight: 600 }}>ESC</button>
          </div>

          {/* Filters */}
          {q && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '6px 12px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'white', fontSize: 12, color: '#6B4F3A', cursor: 'pointer', outline: 'none' }}>
                {categories.map((c) => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'white', fontSize: 12, color: '#6B4F3A', cursor: 'pointer', outline: 'none' }}>
                <option value="">Sort: Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {!q && recentSearches.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9C7A63', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Recent Searches</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {recentSearches.map((s) => (
                  <button key={s} onClick={() => setQ(s)} style={{ padding: '6px 14px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'white', cursor: 'pointer', fontSize: 13, color: '#6B4F3A', fontWeight: 500 }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {!q && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9C7A63', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Popular Searches</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Candle', 'Jewelry', 'Gift Box', 'Birthday', 'Skincare', "Mother's Day"].map((s) => (
                  <button key={s} onClick={() => setQ(s)} style={{ padding: '6px 14px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: '#F5EEE6', cursor: 'pointer', fontSize: 13, color: TC, fontWeight: 600 }}>✦ {s}</button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 32, height: 32, border: `3px solid #EDE4D8`, borderTopColor: TC, borderRadius: '50%' }} className="animate-spin-slow" />
            </div>
          )}

          {q && !loading && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No results for "{q}"</div>
              <div style={{ fontSize: 13, color: '#9C7A63' }}>Try a different search term or browse by category</div>
            </div>
          )}

          {q && !loading && results.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: '#9C7A63', marginBottom: 12 }}>{results.length} results for "<b style={{ color: '#2C1A0E' }}>{q}</b>"</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {results.map((p) => (
                  <div key={p.id} onClick={() => { dispatch(setActiveProduct(p)); dispatch(closeSearch()) }}
                    style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 14px', background: 'white', borderRadius: 14, border: '1px solid #EDE4D8', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = TC; e.currentTarget.style.boxShadow = '0 4px 12px rgba(196,112,74,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#EDE4D8'; e.currentTarget.style.boxShadow = 'none' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: p.bg || '#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{p.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: '#9C7A63', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{p.category}</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      {p.tag && <span style={{ fontSize: 10, background: p.tag === 'New' ? '#7A9A6B' : TC, color: 'white', padding: '2px 8px', borderRadius: 99, fontWeight: 700, marginTop: 4, display: 'inline-block' }}>{p.tag}</span>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: TC, fontSize: 16, marginBottom: 4 }}>${p.price}</div>
                      <button onClick={(e) => { e.stopPropagation(); dispatch(addLocal(p)) }} style={{ padding: '5px 12px', borderRadius: 99, border: 'none', background: '#F5EEE6', color: TC, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
