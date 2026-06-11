import { useState, useEffect } from 'react'
import { adminApi } from '../../api/services'
import { TC, DARK, LIGHT, BEIGE, CREAM, SectionHeader } from './shared'

// ─── CUSTOMERS VIEW ────────────────────────────────────────────────
export default function CustomersView() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    // Deferred a tick so setLoading(true) is an async side effect of the settled search.
    const t = setTimeout(() => {
      setLoading(true)
      adminApi.customers({ q: debouncedSearch || undefined, size: 50 })
        .then(({ data }) => { setCustomers(data.content || []); setTotal(data.totalElements || 0) })
        .catch(() => { /* keep previous list on failure */ })
        .finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(t)
  }, [debouncedSearch])

  const totalSpent = customers.reduce((s, c) => s + Number(c.totalSpent || 0), 0)
  const totalOrders = customers.reduce((s, c) => s + (c.totalOrders || 0), 0)

  return (
    <div>
      <SectionHeader title="Customers" sub={loading ? 'Loading…' : `${total} registered customers`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Customers', value: loading ? '…' : total, icon: '👥' },
          { label: 'Email Verified',  value: loading ? '…' : customers.filter(c => c.emailVerified).length, icon: '✓' },
          { label: 'Total Revenue',   value: loading ? '…' : '₹' + totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 }), icon: '💰' },
          { label: 'Avg Order Value', value: loading || totalOrders === 0 ? '…' : '₹' + Math.round(totalSpent / totalOrders).toLocaleString('en-IN'), icon: '📊' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 18, padding: '18px 20px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: LIGHT }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 20, border: `1px solid ${BEIGE}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BEIGE}` }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            style={{ width: '100%', maxWidth: 340, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: CREAM, color: DARK, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BEIGE}` }}>
                {['Customer', 'Email', 'Phone', 'Orders', 'Total Spent', 'Verified', 'Joined'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 700, color: LIGHT, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F5EEE6', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = CREAM}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.name?.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: DARK }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: LIGHT, fontSize: 12 }}>{c.email}</td>
                  <td style={{ padding: '14px 16px', color: LIGHT, fontSize: 12 }}>{c.phone || '—'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: DARK }}>{c.totalOrders}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: TC }}>₹{Number(c.totalSpent).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: c.emailVerified ? '#EBF7EC' : '#FEF3E8', color: c.emailVerified ? '#2A7A3B' : TC }}>
                      {c.emailVerified ? '✓ Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: LIGHT, whiteSpace: 'nowrap', fontSize: 12 }}>
                    {c.joinedAt ? new Date(c.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: LIGHT }}>No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
