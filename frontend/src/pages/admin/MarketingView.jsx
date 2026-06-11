import { useState, useEffect } from 'react'
import { couponAdminApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SectionHeader } from './shared'

// ─── MARKETING VIEW ────────────────────────────────────────────────
// Evergreen brand lines always shown in the storefront banner, alongside active coupons.
const BANNER_BASE_MESSAGES = [
  '✦ Free gift wrapping on orders over ₹5000',
  '🎁 Handcrafted with love, delivered across India',
  '✦ New arrivals every week',
]

export default function MarketingView({ onToast }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', value: '', expires: '' })

  useEffect(() => {
    couponAdminApi.list()
      .then(({ data }) => setCoupons(data || []))
      .catch(() => onToast('Failed to load coupons'))
      .finally(() => setLoading(false))
  }, [onToast])

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK }

  const activeCoupons = coupons.filter(c => c.active)
  const bannerLines = [...activeCoupons.map(c => `Use code ${c.code} for ${c.discountPercent}% off`), ...BANNER_BASE_MESSAGES]

  const toggleCoupon = async (c) => {
    setBusyId(c.id)
    try {
      const { data } = await couponAdminApi.toggle(c.id)
      setCoupons(cs => cs.map(x => x.id === data.id ? data : x))
      onToast(`${data.code} ${data.active ? 'activated' : 'paused'}`)
    } catch { onToast('Update failed') } finally { setBusyId(null) }
  }

  const deleteCoupon = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return
    setBusyId(c.id)
    try {
      await couponAdminApi.remove(c.id)
      setCoupons(cs => cs.filter(x => x.id !== c.id))
      onToast(`${c.code} deleted`)
    } catch { onToast('Delete failed') } finally { setBusyId(null) }
  }

  const createCoupon = async () => {
    const code = form.code.trim().toUpperCase()
    if (!code || !form.value) { onToast('Enter a code and discount %'); return }
    setSaving(true)
    try {
      const { data } = await couponAdminApi.create({ code, discountPercent: Number(form.value), expires: form.expires })
      setCoupons(cs => [data, ...cs])
      setForm({ code: '', value: '', expires: '' })
      setShowForm(false)
      onToast(`Coupon ${data.code} created`)
    } catch (e) {
      onToast(e.response?.data?.message || 'Could not create coupon')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <SectionHeader title="Marketing" sub="Storefront banner & coupons" />

      {/* Live banner preview — exactly what the storefront shows */}
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}`, marginBottom: 24, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Storefront Banner</div>
        <div style={{ fontSize: 12, color: LIGHT, marginBottom: 16 }}>Active coupons appear here automatically. Pause a coupon to remove its line.</div>
        <div style={{ background: TC, borderRadius: 10, padding: '10px 16px', color: 'white', fontSize: 13, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {bannerLines.join('     ✦     ')}
        </div>
      </div>

      {/* Coupons */}
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>Coupons & Discounts</div>
          <button onClick={() => setShowForm(s => !s)} style={{ padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${TC}`, background: showForm ? TC : 'white', color: showForm ? 'white' : TC, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {showForm ? 'Close' : '+ New Coupon'}
          </button>
        </div>

        {/* New coupon form */}
        {showForm && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr auto', gap: 10, alignItems: 'end', marginBottom: 18, padding: '16px', background: CREAM, borderRadius: 14, border: `1px solid ${BEIGE}` }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: MID, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Code</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="WELCOME10" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: MID, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Discount %</label>
              <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value.replace(/\D/g, '') }))} placeholder="10" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: MID, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expires</label>
              <input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} style={{ ...inp, cursor: 'pointer' }} />
            </div>
            <button onClick={createCoupon} disabled={saving} style={{ padding: '10px 20px', borderRadius: 99, border: 'none', background: saving ? BEIGE : TC, color: saving ? LIGHT : 'white', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', height: 40 }}>{saving ? '…' : 'Add'}</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coupons.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 14, background: c.active ? CREAM : '#F9F9F9', border: `1px solid ${BEIGE}`, opacity: busyId === c.id ? 0.6 : 1 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: TC, minWidth: 90 }}>{c.code}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: DARK, fontSize: 13 }}>{c.disc}</div>
                <div style={{ fontSize: 11, color: LIGHT }}>{c.uses} uses · Expires {c.expires}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: c.active ? '#EBF7EC' : BEIGE, color: c.active ? '#2A7A3B' : LIGHT }}>
                {c.active ? 'Active' : 'Paused'}
              </span>
              <button disabled={busyId === c.id} onClick={() => toggleCoupon(c)} style={{ padding: '5px 12px', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {c.active ? 'Pause' : 'Activate'}
              </button>
              <button disabled={busyId === c.id} onClick={() => deleteCoupon(c)} style={{ padding: '5px 12px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          ))}
          {loading && <div style={{ textAlign: 'center', padding: 28, color: LIGHT, fontSize: 13 }}>Loading…</div>}
          {!loading && coupons.length === 0 && (
            <div style={{ textAlign: 'center', padding: 28, color: LIGHT, fontSize: 13 }}>No coupons. Click "+ New Coupon" to add one.</div>
          )}
        </div>
      </div>
    </div>
  )
}
