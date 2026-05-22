import { useState } from 'react'

const TC = '#C4704A'

export function ProductSkeleton() {
  const sh = {
    background: 'linear-gradient(90deg,#EDE4D8 25%,#E5DBD0 50%,#EDE4D8 75%)',
    backgroundSize: '400% 100%',
    animation: 'skShimmer 1.5s ease-in-out infinite',
    borderRadius: 8,
  }
  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid #EDE4D8' }}>
      <div style={{ ...sh, height: 180, borderRadius: '20px 20px 0 0' }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ ...sh, height: 9, width: '50%', marginBottom: 8 }} />
        <div style={{ ...sh, height: 13, marginBottom: 6 }} />
        <div style={{ ...sh, height: 13, width: '70%', marginBottom: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ ...sh, height: 18, width: '30%' }} />
          <div style={{ ...sh, height: 32, width: '22%', borderRadius: 99 }} />
        </div>
      </div>
    </div>
  )
}

export default function ProductCard({ product, onAddToCart, onClick, wishlisted, onWishlist }) {
  const [hovered, setHovered] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAdd = (e) => {
    e.stopPropagation()
    setAdded(true)
    onAddToCart?.(product)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white', borderRadius: 20, overflow: 'hidden',
        boxShadow: hovered ? '0 12px 40px rgba(44,26,14,0.12)' : '0 2px 12px rgba(44,26,14,0.06)',
        transition: 'all 0.3s', transform: hovered ? 'translateY(-4px)' : 'none',
        cursor: 'pointer', position: 'relative',
      }}>
      <div style={{ background: product.bg || '#EDE4D8', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative', overflow: 'hidden' }}>
        {product.tag && (
          <div style={{
            position: 'absolute', top: 10, left: 10, zIndex: 2,
            background: product.tag === 'New' ? '#7A9A6B' : TC,
            color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>{product.tag}</div>
        )}
        {onWishlist && (
          <button onClick={(e) => { e.stopPropagation(); onWishlist(product.id) }}
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(44,26,14,0.12)', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? TC : 'none'} stroke={TC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
        ) : (
          <span style={{ fontSize: 64, transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.1)' : 'scale(1)' }}>{product.emoji}</span>
        )}
      </div>
      <div style={{ padding: '12px 14px 16px' }}>
        <div style={{ fontSize: 10, color: '#9C7A63', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{product.category}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{product.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: TC, fontSize: 15 }}>₹{product.price}</div>
          <button onClick={handleAdd} style={{
            padding: '7px 14px', borderRadius: 99, border: 'none',
            background: added ? '#7A9A6B' : '#F5EEE6',
            color: added ? 'white' : TC,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', minHeight: 36,
          }}>
            {added ? 'Added ✓' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
