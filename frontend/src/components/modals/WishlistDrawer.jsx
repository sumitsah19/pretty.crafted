import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectWishlistIds, toggleWishlist } from '../../store/slices/wishlistSlice'
import { closeWishlist } from '../../store/slices/uiSlice'
import { selectProducts, selectHampers } from '../../store/slices/productsSlice'
import { addLocal } from '../../store/slices/cartSlice'

const TC = '#C4704A'

export default function WishlistDrawer() {
  const dispatch = useDispatch()
  const wishlistIds = useSelector(selectWishlistIds)
  const products = useSelector(selectProducts)
  const hampers = useSelector(selectHampers)
  // Hampers come from a separate fetch (the "Hampers" category), so include
  // them when resolving saved wishlist ids.
  const wishlisted = [...products, ...hampers].filter((p) => wishlistIds.includes(p.id))

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const k = (e) => { if (e.key === 'Escape') dispatch(closeWishlist()) }
    window.addEventListener('keydown', k)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k) }
  }, [dispatch])

  return (
    <div onClick={(e) => e.target === e.currentTarget && dispatch(closeWishlist())} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(4px)' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 400, background: '#FAF7F2', boxShadow: '-8px 0 40px rgba(44,26,14,0.15)', display: 'flex', flexDirection: 'column' }} className="animate-slide-right">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#2C1A0E' }}>My Wishlist</div>
            <div style={{ fontSize: 12, color: '#9C7A63', marginTop: 2 }}>{wishlisted.length} {wishlisted.length === 1 ? 'item' : 'items'} saved</div>
          </div>
          <button onClick={() => dispatch(closeWishlist())} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {wishlisted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤍</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 600, color: '#2C1A0E', marginBottom: 8 }}>Nothing saved yet</div>
              <div style={{ fontSize: 13, color: '#9C7A63', lineHeight: 1.6 }}>Tap the heart on any product to save it here</div>
              <button onClick={() => dispatch(closeWishlist())} style={{ marginTop: 20, padding: '11px 24px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Browse Gifts</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {wishlisted.map((p, i) => (
                <div key={p.id} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', border: '1px solid #EDE4D8', display: 'flex', gap: 14, alignItems: 'center', animation: `fadeUp 0.35s ease ${i * 0.05}s backwards` }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: p.bg || '#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#9C7A63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{p.category}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.3, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontWeight: 700, color: TC, fontSize: 15 }}>₹{p.price}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { dispatch(addLocal(p)); dispatch(closeWishlist()) }} style={{ padding: '7px 14px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Add to Cart</button>
                    <button onClick={() => dispatch(toggleWishlist(p.id))} style={{ padding: '5px 14px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'white', color: '#9C7A63', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {wishlisted.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #EDE4D8', flexShrink: 0 }}>
            <button onClick={() => { wishlisted.forEach((p) => dispatch(addLocal(p))); dispatch(closeWishlist()) }}
              style={{ width: '100%', padding: '14px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(196,112,74,0.3)' }}>
              Add All to Cart ({wishlisted.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
