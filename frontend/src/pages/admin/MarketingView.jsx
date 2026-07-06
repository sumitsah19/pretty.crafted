import { useState, useEffect } from 'react'
import { couponAdminApi, marketingAdminApi } from '../../api/services'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SectionHeader } from './shared'

// ─── MARKETING VIEW ────────────────────────────────────────────────

export default function MarketingView({ onToast }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', value: '', expires: '' })
  const isMobile = useWindowWidth() < 768

  // Storefront banner config (admin-editable evergreen lines + visibility).
  // `bannerText` is the textarea draft (one line per row); `savedLines` is what
  // the server has, so we can tell when the draft is dirty.
  const [bannerEnabled, setBannerEnabled] = useState(true)
  const [bannerText, setBannerText] = useState('')
  const [savedLines, setSavedLines] = useState([])
  const [bannerId, setBannerId] = useState(null)
  const [bannerSaving, setBannerSaving] = useState(false)

  useEffect(() => {
    couponAdminApi.list()
      .then(({ data }) => setCoupons(data || []))
      .catch(() => onToast('Failed to load coupons'))
      .finally(() => setLoading(false))
    marketingAdminApi.get()
      .then(({ data }) => {
        const lines = data?.bannerLines || []
        setSavedLines(lines)
        setBannerText(lines.join('\n'))
        setBannerEnabled(data?.bannerEnabled !== false)
        setBannerId(data?.id ?? null)
      })
      .catch(() => onToast('Failed to load banner settings'))
  }, [onToast])

  const draftLines = bannerText.split('\n').map(s => s.trim()).filter(Boolean)
  const bannerDirty = draftLines.join('\n') !== savedLines.join('\n')

  const saveBanner = async (nextEnabled = bannerEnabled) => {
    if (draftLines.length === 0) { onToast('Add at least one banner line'); return }
    if (draftLines.length > 20) { onToast('At most 20 banner lines'); return }
    if (draftLines.some(l => l.length > 160)) { onToast('Each line must be 160 characters or fewer'); return }
    setBannerSaving(true)
    try {
      const { data } = await marketingAdminApi.update({ id: bannerId, bannerLines: draftLines, bannerEnabled: nextEnabled })
      setSavedLines(data.bannerLines || [])
      setBannerText((data.bannerLines || []).join('\n'))
      setBannerEnabled(data.bannerEnabled !== false)
      setBannerId(data.id ?? bannerId)
      onToast('Banner saved')
    } catch (e) {
      onToast(e.response?.data?.message || 'Could not save banner')
    } finally { setBannerSaving(false) }
  }

  // The toggle persists immediately (like pausing a coupon) — it also saves any
  // pending text edits so the storefront never shows a half-applied state.
  const toggleBanner = () => {
    const next = !bannerEnabled
    setBannerEnabled(next)
    saveBanner(next)
  }

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK }

  const activeCoupons = coupons.filter(c => c.active)
  const bannerLines = [...activeCoupons.map(c => `Use code ${c.code} for ${c.discountPercent}% off`), ...draftLines]

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
    // Mirror the backend's @Min(1) @Max(100) so an out-of-range value gives a
    // friendly hint instead of a raw server-error toast after a failed round-trip.
    const pct = Number(form.value)
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) { onToast('Discount % must be between 1 and 100'); return }
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

      {/* Storefront banner — editable evergreen lines + show/hide toggle.
          Active coupons are appended automatically by the storefront. */}
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', border: `1px solid ${BEIGE}`, marginBottom: 24, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>Storefront Banner</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: bannerEnabled ? '#EBF7EC' : BEIGE, color: bannerEnabled ? '#2A7A3B' : LIGHT }}>
              {bannerEnabled ? 'Visible' : 'Hidden'}
            </span>
          </div>
          {/* Show/hide switch — persists immediately */}
          <button type="button" role="switch" aria-checked={bannerEnabled} aria-label="Show storefront banner"
            disabled={bannerSaving} onClick={toggleBanner}
            style={{ width: 44, height: 26, borderRadius: 99, border: 'none', padding: 0, flexShrink: 0, background: bannerEnabled ? TC : '#D9CBBF', position: 'relative', cursor: bannerSaving ? 'default' : 'pointer', opacity: bannerSaving ? 0.6 : 1, transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', top: 3, left: bannerEnabled ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(44,26,14,0.25)', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: LIGHT, marginBottom: 14 }}>
          One message per line (max 20 lines, 160 characters each). Active coupons are appended automatically — pause a coupon to remove its line.
        </div>
        <textarea
          value={bannerText}
          onChange={e => setBannerText(e.target.value)}
          rows={4}
          placeholder={'✦ Free delivery on orders above ₹999\n🎁 Handcrafted with love, delivered across India'}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.7, marginBottom: 12, boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => saveBanner()} disabled={bannerSaving || !bannerDirty}
            style={{ padding: '9px 22px', borderRadius: 99, border: 'none', background: (bannerSaving || !bannerDirty) ? BEIGE : TC, color: (bannerSaving || !bannerDirty) ? LIGHT : 'white', fontSize: 12, fontWeight: 700, cursor: (bannerSaving || !bannerDirty) ? 'default' : 'pointer' }}>
            {bannerSaving ? 'Saving…' : 'Save Banner'}
          </button>
          {bannerDirty && !bannerSaving && <span style={{ fontSize: 11, color: LIGHT }}>Unsaved changes</span>}
        </div>
        {/* Live preview — exactly what the storefront shows (dimmed when hidden) */}
        <div style={{ background: TC, borderRadius: 10, padding: '10px 16px', color: 'white', fontSize: 13, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', opacity: bannerEnabled ? 1 : 0.35 }}>
          {bannerLines.length > 0 ? bannerLines.join('     ✦     ') : 'Banner is empty'}
        </div>
        {!bannerEnabled && <div style={{ fontSize: 11, color: LIGHT, marginTop: 8 }}>The banner is hidden — customers won't see it until you switch it back on.</div>}
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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr 1fr auto', gap: 10, alignItems: 'end', marginBottom: 18, padding: '16px', background: CREAM, borderRadius: 14, border: `1px solid ${BEIGE}` }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: MID, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Code</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="WELCOME10" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: MID, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Discount %</label>
              <input value={form.value} inputMode="numeric" onChange={e => { const digits = e.target.value.replace(/\D/g, ''); const clamped = digits === '' ? '' : String(Math.min(100, Number(digits))); setForm(f => ({ ...f, value: clamped })) }} placeholder="10" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: MID, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expires</label>
              <input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} style={{ ...inp, cursor: 'pointer' }} />
            </div>
            <button onClick={createCoupon} disabled={saving} style={{ padding: '10px 20px', borderRadius: 99, border: 'none', background: saving ? BEIGE : TC, color: saving ? LIGHT : 'white', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', height: 40, width: isMobile ? '100%' : 'auto' }}>{saving ? '…' : 'Add'}</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coupons.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, background: c.active ? CREAM : '#F9F9F9', border: `1px solid ${BEIGE}`, opacity: busyId === c.id ? 0.6 : 1 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: TC, minWidth: 90 }}>{c.code}</div>
              <div style={{ flex: 1, minWidth: 140 }}>
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
