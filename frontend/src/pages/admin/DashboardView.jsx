import { useState, useEffect } from 'react'
import { adminApi } from '../../api/services'
import { TC, DARK, LIGHT, BEIGE, CREAM, Badge, StatCard, SectionHeader } from './shared'

// ─── DASHBOARD VIEW ────────────────────────────────────────────────
export default function DashboardView() {
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
