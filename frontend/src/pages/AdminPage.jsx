import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { adminApi, productAdminApi, categoriesApi, productsApi, ordersApi, uploadApi } from '../api/services'

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const TC = '#C4704A'
const TC2 = '#A85A38'
const DARK = '#2C1A0E'
const MID = '#6B4F3A'
const LIGHT = '#9C7A63'
const BEIGE = '#EDE4D8'
const CREAM = '#FAF7F2'
const BG = '#F7F3EE'
const SAGE = '#7A9A6B'

// ─── MOCK DATA ─────────────────────────────────────────────────────
// Dashboard, Products, Orders views use real APIs.
// Customers, Occasions, Marketing use mock data — no backend endpoints exist yet.

const OCCASION_STATS = [
  { name: "Mother's Day", rev: 4820, orders: 48, trend: +18, icon: '💐', color: '#F0D5DC' },
  { name: 'Birthday',     rev: 3640, orders: 36, trend: +12, icon: '🎂', color: '#E8D5C4' },
  { name: 'Wedding',      rev: 6210, orders: 31, trend: +24, icon: '💒', color: '#F2EAE0' },
  { name: "Valentine's",  rev: 2890, orders: 29, trend: -3,  icon: '💝', color: '#E8C5C5' },
  { name: 'Anniversary',  rev: 2440, orders: 24, trend: +8,  icon: '💍', color: '#E0D5C5' },
  { name: 'Graduation',   rev: 1820, orders: 18, trend: +5,  icon: '🎓', color: '#D4C5B5' },
]

const CUSTOMERS = [
  { id: 1, name: 'Amara Osei',      email: 'amara@example.com',  orders: 8,  spent: 342, lastOrder: 'May 14', fav: 'Birthday',     joined: 'Jan 2025', status: 'active' },
  { id: 2, name: 'Priya Nair',      email: 'priya@example.com',  orders: 12, spent: 584, lastOrder: 'May 14', fav: "Mother's Day", joined: 'Oct 2024', status: 'active' },
  { id: 3, name: 'James Whitfield', email: 'james@example.com',  orders: 3,  spent: 214, lastOrder: 'May 13', fav: 'Anniversary',  joined: 'Feb 2025', status: 'active' },
  { id: 4, name: 'Sofia Bertrand',  email: 'sofia@example.com',  orders: 6,  spent: 468, lastOrder: 'May 13', fav: 'Wedding',      joined: 'Aug 2024', status: 'active' },
  { id: 5, name: 'Lena Kirchner',   email: 'lena@example.com',   orders: 4,  spent: 156, lastOrder: 'May 12', fav: 'Birthday',     joined: 'Mar 2025', status: 'active' },
  { id: 6, name: 'Marcus Tan',      email: 'marcus@example.com', orders: 5,  spent: 298, lastOrder: 'May 12', fav: 'For Him',      joined: 'Dec 2024', status: 'active' },
  { id: 7, name: 'Chloe Dupont',    email: 'chloe@example.com',  orders: 2,  spent: 86,  lastOrder: 'May 11', fav: 'Friendship',   joined: 'Apr 2025', status: 'new'    },
  { id: 8, name: 'Rohan Mehta',     email: 'rohan@example.com',  orders: 9,  spent: 412, lastOrder: 'May 11', fav: 'Graduation',   joined: 'Sep 2024', status: 'active' },
]

const USER_ORDERS = {
  1: [
    { id: '#PC-2841', date: 'May 14', items: ['Wildflower Soy Candle', 'Gold Ear Cuff'],       total: 62,  status: 'delivered' },
    { id: '#PC-2790', date: 'Apr 22', items: ['Pressed Botanicals Ring'],                       total: 42,  status: 'delivered' },
    { id: '#PC-2744', date: 'Apr 5',  items: ['Rose Clay Face Mask', 'Artisan Soap'],           total: 54,  status: 'delivered' },
  ],
  2: [
    { id: '#PC-2840', date: 'May 14', items: ['Wildflower Candle', 'Ceramic Vase', 'Dried Flowers'], total: 108, status: 'shipped'    },
    { id: '#PC-2802', date: 'May 2',  items: ['Leather Journal', 'Honey Set'],                       total: 76,  status: 'delivered' },
  ],
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: '◈', label: 'Dashboard'  },
  { id: 'products',  icon: '⊞', label: 'Products'   },
  { id: 'orders',    icon: '⊟', label: 'Orders'     },
  { id: 'customers', icon: '◎', label: 'Customers'  },
  { id: 'occasions', icon: '✦', label: 'Occasions'  },
  { id: 'marketing', icon: '◇', label: 'Marketing'  },
]

// ─── SHARED HELPERS ────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    delivered:  { bg: '#EBF7EC', color: '#2A7A3B' },
    shipped:    { bg: '#EAF0FB', color: '#2A52A0' },
    processing: { bg: '#FEF3E8', color: TC2       },
    cancelled:  { bg: '#FEE8E8', color: '#A02A2A' },
  }
  const s = map[status] || map.processing
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize', letterSpacing: '0.04em' }}>
      {status}
    </span>
  )
}

function StatCard({ icon, label, value, sub, trend, delay = 0 }) {
  const up = trend >= 0
  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '22px 24px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 12px rgba(44,26,14,0.05)', animationDelay: `${delay}s`, animation: 'fadeUp 0.4s ease forwards' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 28 }}>{icon}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: up ? '#2A7A3B' : '#A02A2A', background: up ? '#EBF7EC' : '#FEE8E8', padding: '3px 9px', borderRadius: 99 }}>
          {up ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: DARK, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: LIGHT, fontWeight: 500, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#B8A090' }}>{sub}</div>}
    </div>
  )
}

function Sparkline({ data, color = TC, height = 40 }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const w = 200
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = height - ((v - min) / (max - min || 1)) * (height - 6) - 3
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      <polyline fill={`${color}18`} stroke="none" points={`0,${height} ${pts} ${w},${height}`} />
    </svg>
  )
}

function BarChart({ data, color = TC, height = 80 }) {
  const max = Math.max(...data.map(d => d.value))
  const bw = 24, gap = 10
  const totalW = data.length * (bw + gap) - gap
  return (
    <svg width="100%" height={height + 20} viewBox={`0 0 ${totalW} ${height + 20}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const bh = Math.max(4, (d.value / max) * height)
        const x = i * (bw + gap)
        return (
          <g key={i}>
            <rect x={x} y={height - bh} width={bw} height={bh} rx={4} fill={`${color}20`} />
            <rect x={x} y={height - bh} width={bw} height={bh * 0.5} rx={4} fill={color} opacity={0.85} />
            <text x={x + bw / 2} y={height + 14} textAnchor="middle" fontSize={8} fill={LIGHT} fontFamily="DM Sans">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function SectionHeader({ title, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 3 }}>{title}</h2>
        {sub && <div style={{ fontSize: 13, color: LIGHT }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} style={{ padding: '8px 18px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {action}
        </button>
      )}
    </div>
  )
}

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: DARK, color: 'white', borderRadius: 14, padding: '13px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(44,26,14,0.25)', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp 0.3s ease' }}>
      <span style={{ color: TC }}>✓</span> {msg}
    </div>
  )
}

// ─── MULTI-IMAGE UPLOAD ────────────────────────────────────────────
function MultiImageUpload({ max = 4 }) {
  const [images, setImages] = useState([])

  const handleFile = (e, idx) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setImages(prev => {
        const next = [...prev]
        if (idx < next.length) next[idx] = ev.target.result
        else next.push(ev.target.result)
        return next
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const remove = idx => setImages(prev => prev.filter((_, i) => i !== idx))
  const slots = Array.from({ length: max }, (_, i) => images[i] || null)

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: MID, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Product Images</label>
        <span style={{ fontSize: 11, color: LIGHT }}>{images.length}/{max} uploaded</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {slots.map((src, i) => (
          <div key={i} style={{ position: 'relative' }}>
            {src ? (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 110 }}>
                <img src={src} alt={`Product ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {i === 0 && <span style={{ position: 'absolute', top: 6, left: 6, background: TC, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.05em' }}>Primary</span>}
                <button onClick={() => remove(i)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(44,26,14,0.65)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: 'white', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                <label style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '3px 8px', fontSize: 10, fontWeight: 600, color: MID, cursor: 'pointer' }}>
                  Replace
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, i)} />
                </label>
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 110, border: `2px dashed ${images.length === i ? TC : BEIGE}`,
                borderRadius: 12, cursor: images.length === i ? 'pointer' : 'default',
                background: images.length === i ? '#FDF6F1' : '#F9F6F2',
                transition: 'all 0.2s', gap: 6, opacity: images.length === i ? 1 : 0.5,
              }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} disabled={images.length !== i} onChange={e => handleFile(e, i)} />
                <div style={{ fontSize: 22, opacity: 0.5 }}>📷</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: MID }}>{i === 0 ? 'Add Primary' : `Image ${i + 1}`}</div>
                {i === 0 && <div style={{ fontSize: 10, color: LIGHT }}>PNG, JPG · max 5 MB</div>}
              </label>
            )}
          </div>
        ))}
      </div>
      {images.length > 0 && <div style={{ fontSize: 11, color: LIGHT, marginTop: 8 }}>First image shown as primary</div>}
    </div>
  )
}

// ─── DASHBOARD VIEW ────────────────────────────────────────────────
function DashboardView() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      adminApi.stats(),
      adminApi.orders({ size: 6, sort: 'createdAt,desc' }),
    ]).then(([statsRes, ordersRes]) => {
      setStats(statsRes.data)
      setRecentOrders(ordersRes.data?.content || [])
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load dashboard data')
    }).finally(() => setLoading(false))
  }, [])

  const fmt = (n) => n != null ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'
  const fmtCur = (n) => n != null ? '₹' + fmt(n) : '—'

  const ordersByStatus = stats?.ordersByStatus || {}
  const pending = (ordersByStatus.PENDING || 0) + (ordersByStatus.PAID || 0)
  const shipped  = ordersByStatus.SHIPPED || 0

  return (
    <div>
      <SectionHeader title="Overview" sub="Pretty.Crafted store — live data" />
      {error && <div style={{ background: '#FEE2E2', borderRadius: 12, padding: '12px 16px', color: '#C44A4A', fontSize: 13, marginBottom: 20 }}>⚠️ {error}</div>}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon="💰" label="Total Revenue"   value={loading ? '…' : fmtCur(stats?.totalRevenue)}   sub="All time"            trend={0}  delay={0}    />
        <StatCard icon="📦" label="Total Orders"    value={loading ? '…' : fmt(stats?.totalOrders)}        sub={`${pending} pending`} trend={0}  delay={0.05} />
        <StatCard icon="🛍️" label="Products"        value={loading ? '…' : fmt(stats?.totalProducts)}     sub="In catalogue"        trend={0}  delay={0.1}  />
        <StatCard icon="⚠️" label="Low Stock"       value={loading ? '…' : fmt(stats?.lowStockProducts)}  sub="≤ 5 units"           trend={0}  delay={0.15} />
      </div>

      {/* Orders by status breakdown */}
      {stats && (
        <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}`, marginBottom: 32, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Breakdown</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>Orders by Status</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 12 }}>
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} style={{ background: CREAM, borderRadius: 14, padding: '14px 16px', textAlign: 'center', border: `1px solid ${BEIGE}` }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: DARK }}>{count}</div>
                <div style={{ fontSize: 11, color: LIGHT, fontWeight: 600, textTransform: 'capitalize', marginTop: 4 }}>{status.toLowerCase()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <SectionHeader title="Recent Orders" sub={loading ? 'Loading…' : `${recentOrders.length} recent`} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BEIGE}` }}>
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 700, color: LIGHT, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #F5EEE6', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = CREAM}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 12px', fontWeight: 700, color: TC, whiteSpace: 'nowrap' }}>#{o.id}</td>
                  <td style={{ padding: '12px 12px', fontWeight: 500 }}>{o.userName || o.userEmail || '—'}</td>
                  <td style={{ padding: '12px 12px', color: LIGHT }}>{o.items?.length || 0}</td>
                  <td style={{ padding: '12px 12px', fontWeight: 700 }}>₹{Number(o.totalAmount).toLocaleString()}</td>
                  <td style={{ padding: '12px 12px' }}><Badge status={o.status?.toLowerCase()} /></td>
                  <td style={{ padding: '12px 12px', color: LIGHT, whiteSpace: 'nowrap' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                </tr>
              ))}
              {!loading && recentOrders.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: LIGHT }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SMTP Diagnostics ─────────────────────────────────────── */}
      <SmtpTestPanel />
    </div>
  )
}

function SmtpTestPanel() {
  const [to, setTo] = useState('')
  const [result, setResult] = useState(null) // null | {status, message}
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    if (!to.trim()) return
    setTesting(true)
    setResult(null)
    try {
      const res = await adminApi.testEmail(to.trim())
      setResult(res.data)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || 'Request failed'
      setResult({ status: 'error', message: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}`, marginTop: 32, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Diagnostics</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>SMTP Email Test</div>
        <div style={{ fontSize: 13, color: LIGHT, marginTop: 4 }}>Send a test email to confirm SMTP is working. Shows the exact error if it fails.</div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runTest()}
          placeholder="Send test to: your@email.com"
          style={{ flex: 1, minWidth: 220, padding: '11px 16px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: DARK, background: CREAM, outline: 'none' }}
          onFocus={(e) => e.target.style.borderColor = TC}
          onBlur={(e) => e.target.style.borderColor = BEIGE}
        />
        <button
          onClick={runTest}
          disabled={testing || !to.trim()}
          style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: testing ? BEIGE : TC, color: testing ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: testing ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
          {testing ? 'Sending…' : 'Send Test Email'}
        </button>
      </div>
      {result && (
        <div style={{ marginTop: 16, background: result.status === 'ok' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${result.status === 'ok' ? '#86EFAC' : '#FECACA'}`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: result.status === 'ok' ? '#16A34A' : '#DC2626', marginBottom: result.message ? 4 : 0 }}>
            {result.status === 'ok' ? '✅ SMTP Working!' : '❌ SMTP Failed'}
          </div>
          {result.message && (
            <div style={{ fontSize: 13, color: result.status === 'ok' ? '#15803D' : '#B91C1C', wordBreak: 'break-word', fontFamily: result.status === 'ok' ? 'inherit' : 'monospace' }}>
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PRODUCTS VIEW ─────────────────────────────────────────────────
function ProductsView({ onToast }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', categoryId: '', imageUrl: '', tag: '', recipient: '' })

  useEffect(() => {
    Promise.all([
      productsApi.list({ size: 100 }),
      categoriesApi.list(),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.data?.content || pRes.data || [])
      setCategories(cRes.data || [])
    }).catch((err) => {
      onToast(err.response?.data?.message || 'Failed to load products')
    }).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoryName || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditItem(null)
    setForm({ name: '', description: '', price: '', stock: '', categoryId: categories[0]?.id || '', imageUrl: '', tag: '', recipient: '' })
    setShowAdd(true)
  }
  const openEdit = (p) => {
    setEditItem(p)
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, categoryId: p.categoryId, imageUrl: p.imageUrl || '', tag: p.tag || '', recipient: p.recipient || '' })
    setShowAdd(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { name: form.name, description: form.description, price: Number(form.price), stock: Number(form.stock), categoryId: Number(form.categoryId), imageUrl: form.imageUrl, tag: form.tag, recipient: form.recipient }
      if (editItem) {
        const { data } = await productAdminApi.update(editItem.id, payload)
        setProducts(ps => ps.map(p => p.id === data.id ? data : p))
        onToast('Product updated')
      } else {
        const { data } = await productAdminApi.create(payload)
        setProducts(ps => [data, ...ps])
        onToast('Product added')
      }
      setShowAdd(false); setEditItem(null)
    } catch (e) {
      onToast('Error: ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await productAdminApi.remove(id)
      setProducts(ps => ps.filter(p => p.id !== id))
      onToast('Product removed')
    } catch { onToast('Delete failed') }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadApi.image(file)
      setForm(f => ({ ...f, imageUrl: data.url }))
    } catch {
      onToast('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK }

  return (
    <div>
      <SectionHeader title="Products" sub={loading ? 'Loading…' : `${products.length} items in catalogue`} action="+ Add Product" onAction={openAdd} />
      <div style={{ background: 'white', borderRadius: 20, border: `1px solid ${BEIGE}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BEIGE}` }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            style={{ width: '100%', maxWidth: 340, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: CREAM, color: DARK, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BEIGE}` }}>
                {['Product', 'Category', 'Price', 'Stock', 'Tag', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 700, color: LIGHT, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F5EEE6', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = CREAM}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: DARK }}>{p.name}</div>
                    {p.imageUrl && <div style={{ fontSize: 10, color: LIGHT, marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.imageUrl}</div>}
                  </td>
                  <td style={{ padding: '14px 16px', color: MID }}>{p.categoryName}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: TC }}>₹{Number(p.price).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: 600, color: p.stock <= 5 ? '#A02A2A' : DARK }}>{p.stock}</span>
                    {p.stock <= 5 && <span style={{ fontSize: 10, color: '#A02A2A', marginLeft: 6 }}>low</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {p.tag && <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF3E8', color: TC, padding: '2px 7px', borderRadius: 99 }}>{p.tag}</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(p)} style={{ padding: '5px 13px', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => deleteProduct(p.id)} style={{ padding: '5px 13px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: LIGHT }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {showAdd && (
        <div onClick={e => e.target === e.currentTarget && setShowAdd(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: CREAM, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{editItem ? 'Edit Product' : 'Add Product'}</div>
              <button onClick={() => { setShowAdd(false); setEditItem(null) }} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: MID }}>×</button>
            </div>
            {[
              { label: 'Product Name', key: 'name', type: 'text' },
              { label: 'Description', key: 'description', type: 'text' },
              { label: 'Price (₹)', key: 'price', type: 'number' },
              { label: 'Stock', key: 'stock', type: 'number' },
              { label: 'Tag (e.g. Bestseller)', key: 'tag', type: 'text' },
              { label: 'Recipient (all/him/her/kids)', key: 'recipient', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
            ))}

            {/* Image upload */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Product Image</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: `1px solid ${BEIGE}`, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${uploading ? BEIGE : TC}`, background: uploading ? BEIGE : '#FDF6F1', color: uploading ? LIGHT : TC, fontSize: 12, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', width: 'fit-content' }}>
                    {uploading ? 'Uploading…' : '↑ Upload Image'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} disabled={uploading} onChange={handleImageUpload} />
                  </label>
                  <input
                    type="text"
                    placeholder="or paste image URL"
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    style={{ ...inp, fontSize: 12, color: LIGHT }}
                    onFocus={e => e.target.style.borderColor = TC}
                    onBlur={e => e.target.style.borderColor = BEIGE}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</label>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={handleSave} disabled={saving || !form.name || !form.price || !form.stock || !form.categoryId}
              style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: saving ? BEIGE : TC, color: saving ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer', marginTop: 8 }}>
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add to Catalogue'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ORDER DETAIL MODAL ────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onUpdateStatus, updatingId }) {
  const nextStatus = (status) => {
    const map = { PENDING: 'PAID', PAID: 'SHIPPED', SHIPPED: 'DELIVERED' }
    return map[status] || null
  }
  const next = nextStatus(order.status)

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(44,26,14,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: CREAM, borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,26,14,0.25)', animation: 'fadeUp 0.25s ease' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${BEIGE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: DARK }}>Order #{order.id}</div>
            <div style={{ fontSize: 12, color: LIGHT, marginTop: 2 }}>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
          </div>
          <button onClick={onClose} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 18, color: MID, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge status={order.status?.toLowerCase()} />
            <span style={{ fontSize: 12, color: LIGHT }}>Payment:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: order.paymentStatus === 'PAID' ? '#2A7A3B' : order.paymentStatus === 'FAILED' ? '#A02A2A' : MID }}>{order.paymentStatus}</span>
          </div>

          {/* Customer */}
          <div style={{ background: 'white', borderRadius: 16, padding: '16px 18px', border: `1px solid ${BEIGE}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TC, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Customer</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: LIGHT }}>Name</span>
                <span style={{ fontWeight: 600, color: DARK }}>{order.userName || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: LIGHT }}>Email</span>
                <span style={{ fontWeight: 600, color: DARK }}>{order.userEmail || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: LIGHT }}>Phone</span>
                <span style={{ fontWeight: 600, color: DARK }}>{order.contactPhone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div style={{ background: 'white', borderRadius: 16, padding: '16px 18px', border: `1px solid ${BEIGE}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TC, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Shipping Address</div>
            <div style={{ fontSize: 13, color: DARK, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{order.shippingAddress || '—'}</div>
          </div>

          {/* Items */}
          <div style={{ background: 'white', borderRadius: 16, padding: '16px 18px', border: `1px solid ${BEIGE}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TC, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Items Ordered</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: i < order.items.length - 1 ? 10 : 0, borderBottom: i < order.items.length - 1 ? `1px solid ${BEIGE}` : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{item.itemName || (item.type === 'GIFT_BOX' ? 'Custom Gift Box' : 'Product')}</div>
                    <div style={{ fontSize: 11, color: LIGHT, marginTop: 2 }}>
                      {item.type === 'GIFT_BOX' ? 'Gift Box' : 'Product'} · Qty: {item.quantity}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>₹{Number(item.lineTotal).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: LIGHT }}>₹{Number(item.unitPrice).toLocaleString()} each</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `2px solid ${BEIGE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: MID }}>Total</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: DARK }}>₹{Number(order.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          {(next || order.status === 'PENDING') && (
            <div style={{ display: 'flex', gap: 10 }}>
              {next && (
                <button
                  disabled={updatingId === order.id}
                  onClick={() => onUpdateStatus(order.id, next)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 99, border: 'none', background: TC, color: 'white', fontSize: 13, fontWeight: 700, cursor: updatingId === order.id ? 'default' : 'pointer', opacity: updatingId === order.id ? 0.6 : 1 }}>
                  {updatingId === order.id ? '…' : `Mark ${next.charAt(0) + next.slice(1).toLowerCase()}`}
                </button>
              )}
              {order.status === 'PENDING' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                  style={{ flex: next ? '0 0 auto' : 1, padding: '12px 20px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ORDERS VIEW ───────────────────────────────────────────────────
function OrdersView({ onToast }) {
  const [filter, setFilter] = useState('all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const STATUS_FILTERS = ['all', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

  const fetchOrders = useCallback(async (status) => {
    setLoading(true)
    try {
      const params = status !== 'all' ? { status, size: 50 } : { size: 50 }
      const { data } = await adminApi.orders(params)
      setOrders(data?.content || [])
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchOrders(filter) }, [filter, fetchOrders])

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const { data } = await adminApi.updateOrderStatus(id, newStatus)
      setOrders(os => os.map(o => o.id === data.id ? data : o))
      if (selectedOrder?.id === id) setSelectedOrder(data)
      onToast(`Order #${id} → ${newStatus}`)
    } catch { onToast('Status update failed') } finally { setUpdatingId(null) }
  }

  const nextStatus = (status) => {
    const map = { PENDING: 'PAID', PAID: 'SHIPPED', SHIPPED: 'DELIVERED' }
    return map[status] || null
  }

  return (
    <div>
      <SectionHeader title="Orders" sub={loading ? 'Loading…' : `${orders.length} orders`} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '7px 16px', borderRadius: 99, border: filter === s ? 'none' : `1.5px solid ${BEIGE}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === s ? TC : 'white', color: filter === s ? 'white' : MID, transition: 'all 0.2s', textTransform: s === 'all' ? 'none' : 'capitalize' }}>
            {s === 'all' ? 'All Orders' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders.map((o, i) => {
          const next = nextStatus(o.status)
          return (
            <div key={o.id} onClick={() => setSelectedOrder(o)} style={{ background: 'white', borderRadius: 18, padding: '18px 22px', border: `1px solid ${BEIGE}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(44,26,14,0.04)', animation: 'fadeUp 0.4s ease forwards', animationDelay: `${i * 0.03}s`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,26,14,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(44,26,14,0.04)'}>
              <div style={{ flex: '0 0 auto' }}>
                <div style={{ fontWeight: 700, color: TC, fontSize: 13 }}>#{o.id}</div>
                <div style={{ fontSize: 11, color: LIGHT, marginTop: 2 }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 600, color: DARK, marginBottom: 2 }}>{o.userName || o.userEmail || '—'}</div>
                <div style={{ fontSize: 12, color: LIGHT }}>{o.items?.length || 0} items · {o.contactPhone}</div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK }}>₹{Number(o.totalAmount).toLocaleString()}</div>
              <Badge status={o.status?.toLowerCase()} />
              <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                {next && (
                  <button
                    disabled={updatingId === o.id}
                    onClick={() => updateStatus(o.id, next)}
                    style={{ padding: '6px 14px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontSize: 11, fontWeight: 600, cursor: updatingId === o.id ? 'default' : 'pointer', opacity: updatingId === o.id ? 0.6 : 1 }}>
                    {updatingId === o.id ? '…' : `Mark ${next.charAt(0) + next.slice(1).toLowerCase()}`}
                  </button>
                )}
                {o.status === 'PENDING' && (
                  <button onClick={() => updateStatus(o.id, 'CANCELLED')}
                    style={{ padding: '6px 14px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                )}
                <button style={{ padding: '6px 12px', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setSelectedOrder(o)}>Details</button>
              </div>
            </div>
          )
        })}
        {!loading && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: LIGHT, background: 'white', borderRadius: 18, border: `1px solid ${BEIGE}` }}>No orders found</div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          updatingId={updatingId}
        />
      )}
    </div>
  )
}

// ─── OCCASIONS VIEW ────────────────────────────────────────────────
function OccasionsView() {
  const monthly = [
    { label: 'Jan', value: 28 }, { label: 'Feb', value: 86  }, { label: 'Mar', value: 54  },
    { label: 'Apr', value: 72 }, { label: 'May', value: 96  }, { label: 'Jun', value: 44  },
    { label: 'Jul', value: 38 }, { label: 'Aug', value: 52  }, { label: 'Sep', value: 60  },
    { label: 'Oct', value: 48 }, { label: 'Nov', value: 68  }, { label: 'Dec', value: 120 },
  ]

  return (
    <div>
      <SectionHeader title="Occasion Analytics" sub="Revenue and engagement by occasion" />
      <div style={{ background: 'white', borderRadius: 20, padding: 28, border: `1px solid ${BEIGE}`, marginBottom: 24, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Seasonal trend</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>Monthly Orders by Season</div>
        </div>
        <BarChart data={monthly} height={100} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {OCCASION_STATS.map((o, i) => {
          const pct = Math.round((o.rev / 6210) * 100)
          return (
            <div key={o.name} style={{ background: 'white', borderRadius: 20, padding: 22, border: `1px solid ${BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)', animation: 'fadeUp 0.4s ease forwards', animationDelay: `${i * 0.06}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: o.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{o.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: DARK }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: LIGHT }}>{o.orders} orders</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: o.trend >= 0 ? '#2A7A3B' : '#A02A2A', background: o.trend >= 0 ? '#EBF7EC' : '#FEE8E8', padding: '3px 8px', borderRadius: 99 }}>
                  {o.trend >= 0 ? '▲' : '▼'} {Math.abs(o.trend)}%
                </div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 10 }}>${o.rev.toLocaleString()}</div>
              <div style={{ height: 5, background: BEIGE, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: TC, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 11, color: LIGHT, marginTop: 6 }}>{pct}% of top revenue</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MARKETING VIEW ────────────────────────────────────────────────
function MarketingView({ onToast }) {
  const [bannerMsg, setBannerMsg] = useState('✦ Free gift wrapping on orders over $60 — use code PRETTY15 for 15% off ✦')
  const coupons = [
    { code: 'PRETTY15', disc: '15% off', uses: 148, expires: 'May 31', active: true  },
    { code: 'MAMA20',   disc: '20% off', uses: 92,  expires: 'May 19', active: true  },
    { code: 'GRAD10',   disc: '10% off', uses: 34,  expires: 'Jun 30', active: false },
  ]

  return (
    <div>
      <SectionHeader title="Marketing" sub="Banners, coupons & campaigns" action="+ New Campaign" onAction={() => onToast('Campaign editor opened')} />
      {/* Banner editor */}
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}`, marginBottom: 24, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Announcement Banner</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</label>
            <input
              value={bannerMsg} onChange={e => setBannerMsg(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
              onFocus={e => e.target.style.borderColor = TC}
              onBlur={e => e.target.style.borderColor = BEIGE}
            />
          </div>
          <button onClick={() => onToast('Banner updated')} style={{ padding: '11px 22px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', height: 42 }}>Save</button>
        </div>
        <div style={{ marginTop: 16, background: TC, borderRadius: 10, padding: '10px 16px', color: 'white', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
          {bannerMsg}
        </div>
      </div>
      {/* Coupons */}
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>Coupons & Discounts</div>
          <button onClick={() => onToast('New coupon created')} style={{ padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ New Coupon</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coupons.map(c => (
            <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 14, background: c.active ? CREAM : '#F9F9F9', border: `1px solid ${BEIGE}` }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: TC, minWidth: 90 }}>{c.code}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: DARK, fontSize: 13 }}>{c.disc}</div>
                <div style={{ fontSize: 11, color: LIGHT }}>{c.uses} uses · Expires {c.expires}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: c.active ? '#EBF7EC' : BEIGE, color: c.active ? '#2A7A3B' : LIGHT }}>
                {c.active ? 'Active' : 'Paused'}
              </span>
              <button onClick={() => onToast(`${c.code} ${c.active ? 'paused' : 'activated'}`)} style={{ padding: '5px 12px', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {c.active ? 'Pause' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── CUSTOMER PROFILE ──────────────────────────────────────────────
function CustomerProfile({ customer, onBack }) {
  const OCCASIONS = ['Birthday', "Mother's Day", 'Anniversary', 'Wedding', 'For Her', 'Graduation']
  const orders = USER_ORDERS[customer.id] || [
    { id: `#PC-${2800 + customer.id}`, date: 'Apr 28', items: ['Handcrafted Gift Set'], total: customer.spent, status: 'delivered' },
  ]

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5EEE6', border: 'none', borderRadius: 99, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: MID, marginBottom: 24 }}>
        ← Back to Customers
      </button>
      {/* Profile header cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 22, border: `1px solid ${BEIGE}`, display: 'flex', gap: 16, alignItems: 'center', gridColumn: 'span 2' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {customer.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: DARK }}>{customer.name}</div>
            <div style={{ fontSize: 12, color: LIGHT, marginTop: 2 }}>{customer.email}</div>
            <div style={{ fontSize: 10, color: TC, fontWeight: 600, marginTop: 4 }}>Member since {customer.joined}</div>
          </div>
        </div>
        {[{ label: 'Total Orders', value: customer.orders, icon: '📦' }, { label: 'Total Spent', value: `$${customer.spent}`, icon: '💰' }, { label: 'Fav Occasion', value: customer.fav, icon: '✦' }].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 20, padding: '20px 22px', border: `1px solid ${BEIGE}`, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: LIGHT }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '22px 24px', border: `1px solid ${BEIGE}` }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Occasion Preferences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[customer.fav, OCCASIONS[(customer.id + 1) % OCCASIONS.length], OCCASIONS[(customer.id + 2) % OCCASIONS.length]].map((o, i) => {
              const pct = [75, 45, 20][i]
              return (
                <div key={o}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: DARK }}>{o}</span>
                    <span style={{ color: LIGHT }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: BEIGE, borderRadius: 99 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: TC, borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 20, padding: '22px 24px', border: `1px solid ${BEIGE}` }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Activity Overview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Last order', customer.lastOrder],
              ['Account status', customer.status === 'active' ? 'Active' : 'New'],
              ['Avg order value', `$${Math.round(customer.spent / customer.orders)}`],
              ['Order frequency', customer.orders > 6 ? 'Regular' : 'Occasional'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: LIGHT }}>{k}</span>
                <span style={{ fontWeight: 600, color: DARK }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Order history */}
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}` }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Order History</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(o => (
            <div key={o.id} style={{ padding: '16px 18px', borderRadius: 14, background: CREAM, border: `1px solid ${BEIGE}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 auto' }}>
                <div style={{ fontWeight: 700, color: TC, fontSize: 13 }}>{o.id}</div>
                <div style={{ fontSize: 11, color: LIGHT }}>{o.date}</div>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 12, color: MID }}>{o.items.join(', ')}</div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>${o.total}</div>
              <Badge status={o.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── CUSTOMERS VIEW ────────────────────────────────────────────────
function CustomersView({ onToast }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('spent')
  const [selected, setSelected] = useState(null)
  const [discountTarget, setDiscountTarget] = useState(null)
  const [discountForm, setDiscountForm] = useState({ type: 'percent', value: '10', code: '', expiry: '', minOrder: '' })

  const filtered = useMemo(() => {
    let c = CUSTOMERS.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
    if (sortBy === 'spent')  c = [...c].sort((a, b) => b.spent - a.spent)
    if (sortBy === 'orders') c = [...c].sort((a, b) => b.orders - a.orders)
    if (sortBy === 'recent') c = [...c].sort((a, b) => a.lastOrder < b.lastOrder ? 1 : -1)
    return c
  }, [search, sortBy])

  const inp = { width: '100%', padding: '9px 13px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: 'white', outline: 'none', color: DARK }

  if (selected) return <CustomerProfile customer={selected} onBack={() => setSelected(null)} />

  return (
    <div>
      {/* Discount modal */}
      {discountTarget && (
        <div onClick={e => e.target === e.currentTarget && setDiscountTarget(null)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: CREAM, borderRadius: 24, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK }}>Send Discount</div>
                <div style={{ fontSize: 12, color: LIGHT, marginTop: 2 }}>to {discountTarget.name}</div>
              </div>
              <button onClick={() => setDiscountTarget(null)} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: MID }}>×</button>
            </div>
            {/* Discount type */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Discount Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['percent', '% Off'], ['flat', 'Flat Amount'], ['freeship', 'Free Shipping']].map(([k, l]) => (
                  <button key={k} onClick={() => setDiscountForm(f => ({ ...f, type: k }))} style={{ flex: 1, padding: 8, borderRadius: 10, border: `1.5px solid ${discountForm.type === k ? TC : BEIGE}`, background: discountForm.type === k ? '#FDF6F1' : 'white', color: discountForm.type === k ? TC : MID, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s' }}>{l}</button>
                ))}
              </div>
            </div>
            {discountForm.type !== 'freeship' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{discountForm.type === 'percent' ? 'Discount %' : 'Amount ($)'}</label>
                <input value={discountForm.value} onChange={e => setDiscountForm(f => ({ ...f, value: e.target.value.replace(/\D/g, '') }))} placeholder={discountForm.type === 'percent' ? 'e.g. 20' : 'e.g. 15'} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coupon Code</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={discountForm.code} onChange={e => setDiscountForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME20" style={{ ...inp, flex: 1 }} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
                <button onClick={() => setDiscountForm(f => ({ ...f, code: 'PC' + discountTarget.name.split(' ')[0].toUpperCase() + Math.floor(Math.random() * 90 + 10) }))} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#F5EEE6', color: TC, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Generate</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Min Order ($)</label>
                <input value={discountForm.minOrder} onChange={e => setDiscountForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="Optional" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expires On</label>
                <input type="date" value={discountForm.expiry} onChange={e => setDiscountForm(f => ({ ...f, expiry: e.target.value }))} style={{ ...inp, cursor: 'pointer' }} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
            </div>
            {discountForm.code && (
              <div style={{ background: '#F5EEE6', borderRadius: 12, padding: '11px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🎫</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{discountForm.code}</div>
                  <div style={{ fontSize: 11, color: LIGHT }}>
                    {discountForm.type === 'freeship' ? 'Free Shipping' : discountForm.type === 'percent' ? `${discountForm.value}% off` : `$${discountForm.value} off`}
                    {discountForm.minOrder ? ` · min $${discountForm.minOrder}` : ''}
                    {discountForm.expiry ? ` · expires ${discountForm.expiry}` : ''}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => { onToast(`Discount sent to ${discountTarget.name}!`); setDiscountTarget(null); setDiscountForm({ type: 'percent', value: '10', code: '', expiry: '', minOrder: '' }) }}
              disabled={!discountForm.code}
              style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: discountForm.code ? TC : BEIGE, color: discountForm.code ? 'white' : LIGHT, fontWeight: 700, fontSize: 14, cursor: discountForm.code ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              Send via Email to {discountTarget.name.split(' ')[0]}
            </button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Customers',    value: CUSTOMERS.length, icon: '👥', trend: '+12%' },
          { label: 'Active This Month',  value: CUSTOMERS.filter(c => c.status === 'active').length, icon: '⚡', trend: '+8%' },
          { label: 'Total Revenue',      value: '₹' + CUSTOMERS.reduce((s, c) => s + c.spent, 0).toLocaleString(), icon: '💰', trend: '+18%' },
          { label: 'Avg. Order Value',   value: '₹' + Math.round(CUSTOMERS.reduce((s, c) => s + c.spent, 0) / CUSTOMERS.reduce((s, c) => s + c.orders, 0)), icon: '📊', trend: '+5%' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 18, padding: '18px 20px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#2A7A3B', background: '#EBF7EC', padding: '2px 7px', borderRadius: 99 }}>{s.trend}</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: LIGHT }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 20, border: `1px solid ${BEIGE}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BEIGE}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…" style={{ flex: 1, minWidth: 180, maxWidth: 320, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: CREAM, color: DARK, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 12, background: 'white', fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', outline: 'none' }}>
            <option value="spent">Sort: Top Spenders</option>
            <option value="orders">Sort: Most Orders</option>
            <option value="recent">Sort: Most Recent</option>
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BEIGE}` }}>
                {['Customer', 'Email', 'Orders', 'Total Spent', 'Fav Occasion', 'Last Order', 'Status', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 700, color: LIGHT, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F5EEE6', transition: 'background 0.15s', cursor: 'pointer' }}
                  onClick={() => setSelected(c)}
                  onMouseEnter={e => e.currentTarget.style.background = CREAM}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.name.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: DARK }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: LIGHT, fontSize: 12 }}>{c.email}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: DARK }}>{c.orders}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: TC }}>${c.spent}</td>
                  <td style={{ padding: '14px 16px' }}><span style={{ background: '#F5EEE6', color: MID, fontSize: 11, padding: '3px 10px', borderRadius: 99 }}>{c.fav}</span></td>
                  <td style={{ padding: '14px 16px', color: LIGHT, whiteSpace: 'nowrap' }}>{c.lastOrder}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: c.status === 'active' ? '#EBF7EC' : '#EAF0FB', color: c.status === 'active' ? '#2A7A3B' : '#2A52A0', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize' }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: TC, fontSize: 12, fontWeight: 600 }}>View →</span>
                      <button onClick={e => { e.stopPropagation(); setDiscountTarget(c) }} style={{ padding: '4px 10px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>🎫 Discount</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR ───────────────────────────────────────────────────────
function Sidebar({ active, setActive, collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen }) {
  const w = collapsed && !isMobile ? 68 : 220
  if (isMobile && !mobileOpen) return null

  return (
    <>
      {isMobile && (
        <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 190, background: 'rgba(44,26,14,0.4)', backdropFilter: 'blur(4px)' }} />
      )}
      <aside style={{ position: isMobile ? 'fixed' : 'relative', top: 0, left: 0, bottom: 0, zIndex: 200, width: w, minHeight: '100vh', background: DARK, display: 'flex', flexDirection: 'column', transition: 'width 0.3s cubic-bezier(.4,0,.2,1)', overflow: 'hidden', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: collapsed && !isMobile ? '22px 0' : '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'space-between', minHeight: 68 }}>
          {(!collapsed || isMobile) && (
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>
              Pretty<span style={{ color: TC }}>.</span>Crafted
            </div>
          )}
          {collapsed && !isMobile && <div style={{ fontSize: 20, color: TC }}>✦</div>}
          {!isMobile && (
            <button onClick={() => setCollapsed(c => !c)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: LIGHT, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {collapsed ? '›' : '‹'}
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id
            return (
              <button key={item.id} onClick={() => { setActive(item.id); if (isMobile) setMobileOpen(false) }} style={{ width: '100%', padding: collapsed && !isMobile ? '13px 0' : '12px 20px', border: 'none', background: isActive ? 'rgba(196,112,74,0.15)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed && !isMobile ? 'center' : 'flex-start', borderLeft: isActive ? `3px solid ${TC}` : '3px solid transparent', transition: 'all 0.2s' }}>
                <span style={{ fontSize: 16, color: isActive ? TC : LIGHT, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                {(!collapsed || isMobile) && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'white' : LIGHT, whiteSpace: 'nowrap' }}>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Back to store */}
        <div style={{ padding: collapsed && !isMobile ? '16px 0' : '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14, color: MID }}>←</span>
            {(!collapsed || isMobile) && <span style={{ fontSize: 12, color: MID, fontWeight: 500 }}>Back to Store</span>}
          </a>
        </div>
      </aside>
    </>
  )
}

// ─── ADMIN APP ─────────────────────────────────────────────────────
export default function AdminPage() {
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [ww, setWw] = useState(window.innerWidth)

  useEffect(() => {
    const r = () => setWw(window.innerWidth)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  const isMobile = ww < 768
  const showToast = useCallback(msg => setToast(msg), [])

  const views = {
    dashboard: <DashboardView />,
    products:  <ProductsView  onToast={showToast} />,
    orders:    <OrdersView    onToast={showToast} />,
    customers: <CustomersView onToast={showToast} />,
    occasions: <OccasionsView />,
    marketing: <MarketingView onToast={showToast} />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: BG, fontFamily: "'DM Sans',sans-serif", color: DARK }}>
      <Sidebar
        active={active} setActive={setActive}
        collapsed={collapsed} setCollapsed={setCollapsed}
        isMobile={isMobile} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ height: 68, background: 'rgba(250,247,242,0.97)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BEIGE}`, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10, boxShadow: `0 1px 0 ${BEIGE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isMobile && (
              <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: DARK, padding: 4, display: 'flex', alignItems: 'center' }}>☰</button>
            )}
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK }}>
                {NAV_ITEMS.find(n => n.id === active)?.label}
              </div>
              <div style={{ fontSize: 11, color: LIGHT }}>Pretty.Crafted Admin</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: LIGHT, background: '#F5EEE6', padding: '5px 12px', borderRadius: 99, fontWeight: 500 }}>May 20, 2026</div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>A</div>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '24px 16px' : '32px 32px' }}>
          <div key={active} style={{ maxWidth: 1100, margin: '0 auto', animation: 'fadeUp 0.4s ease forwards' }}>
            {views[active]}
          </div>
        </main>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
