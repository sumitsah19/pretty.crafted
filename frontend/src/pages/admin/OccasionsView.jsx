import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { uploadApi, occasionAdminApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, BarChart, SectionHeader } from './shared'

const BLANK = { slug: '', title: '', description: '', icon: '', iconImageUrl: '', color: '#EDE4D8', season: '', ctaLabel: '', priority: '', displayOrder: '', active: false }

// ─── MOCK DATA ─────────────────────────────────────────────────────
// The revenue/engagement analytics below remain mock — no analytics backend
// exists yet. Occasion *management* above is real, backed by /api/admin/occasions.
const OCCASION_STATS = [
  { name: "Mother's Day", rev: 4820, orders: 48, trend: +18, icon: '💐', color: '#F0D5DC' },
  { name: 'Birthday',     rev: 3640, orders: 36, trend: +12, icon: '🎂', color: '#E8D5C4' },
  { name: 'Wedding',      rev: 6210, orders: 31, trend: +24, icon: '💒', color: '#F2EAE0' },
  { name: "Valentine's",  rev: 2890, orders: 29, trend: -3,  icon: '💝', color: '#E8C5C5' },
  { name: 'Anniversary',  rev: 2440, orders: 24, trend: +8,  icon: '💍', color: '#E0D5C5' },
  { name: 'Graduation',   rev: 1820, orders: 18, trend: +5,  icon: '🎓', color: '#D4C5B5' },
]

// ─── OCCASIONS VIEW ────────────────────────────────────────────────
export default function OccasionsView({ onToast = () => {} }) {
  const [occasions, setOccasions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(BLANK)

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK, boxSizing: 'border-box' }

  useEffect(() => {
    occasionAdminApi.list()
      .then(({ data }) => setOccasions(data || []))
      .catch(() => onToast('Failed to load occasions'))
      .finally(() => setLoading(false))
  }, [onToast])

  const openAdd = () => {
    setEditItem(null)
    setForm({ ...BLANK, displayOrder: String(occasions.length) })
    setShowForm(true)
  }

  const openEdit = (o) => {
    setEditItem(o)
    setForm({
      slug: o.slug,
      title: o.title,
      description: o.description,
      icon: o.icon || '',
      iconImageUrl: o.iconImageUrl || '',
      color: o.color,
      season: o.season || '',
      ctaLabel: o.ctaLabel || '',
      priority: o.priority ?? '',
      displayOrder: o.displayOrder ?? '',
      active: o.active,
    })
    setShowForm(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadApi.image(file)
      setForm(f => ({ ...f, iconImageUrl: data.url }))
    } catch {
      onToast('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon.trim() || null,
        iconImageUrl: form.iconImageUrl.trim() || null,
        color: form.color,
        season: form.season.trim() || null,
        ctaLabel: form.ctaLabel.trim() || null,
        priority: form.priority === '' ? 0 : Number(form.priority),
        displayOrder: form.displayOrder === '' ? 0 : Number(form.displayOrder),
        active: form.active,
      }
      if (editItem) {
        const { data } = await occasionAdminApi.update(editItem.id, payload)
        setOccasions(os => os.map(o => o.id === data.id ? data : o))
        onToast('Occasion updated')
      } else {
        const { data } = await occasionAdminApi.create(payload)
        setOccasions(os => [...os, data].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id))
        onToast('Occasion added')
      }
      setShowForm(false); setEditItem(null)
    } catch (e) {
      onToast('Error: ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  const toggle = async (o) => {
    setBusyId(o.id)
    try {
      const { data } = await occasionAdminApi.toggle(o.id)
      setOccasions(os => os.map(x => x.id === data.id ? data : x))
      onToast(data.active ? `${data.title} is now eligible for the featured banner` : `${data.title} is no longer eligible for the featured banner`)
    } catch { onToast('Update failed') } finally { setBusyId(null) }
  }

  const remove = async (o) => {
    if (!window.confirm(`Delete "${o.title}"? It will disappear from the storefront occasions row (and the featured banner, if it's currently shown).`)) return
    setBusyId(o.id)
    try {
      await occasionAdminApi.remove(o.id)
      setOccasions(os => os.filter(x => x.id !== o.id))
      onToast('Occasion removed')
    } catch { onToast('Delete failed') } finally { setBusyId(null) }
  }

  const featured = occasions.filter(o => o.active).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]

  const monthly = [
    { label: 'Jan', value: 28 }, { label: 'Feb', value: 86  }, { label: 'Mar', value: 54  },
    { label: 'Apr', value: 72 }, { label: 'May', value: 96  }, { label: 'Jun', value: 44  },
    { label: 'Jul', value: 38 }, { label: 'Aug', value: 52  }, { label: 'Sep', value: 60  },
    { label: 'Oct', value: 48 }, { label: 'Nov', value: 68  }, { label: 'Dec', value: 120 },
  ]

  return (
    <div>
      <SectionHeader title="Manage Occasions" sub={loading ? 'Loading…' : `${occasions.length} occasions · featured banner: ${featured?.title || 'none active'}`} action="+ Add Occasion" onAction={openAdd} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14, marginBottom: 36 }}>
        {occasions.map(o => (
          <div key={o.id} style={{ background: 'white', borderRadius: 18, padding: 16, border: `1.5px solid ${o.id === featured?.id ? TC : BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)', opacity: busyId === o.id ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: o.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                {o.iconImageUrl ? <img src={o.iconImageUrl} alt={o.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : o.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, color: DARK, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.title}</div>
                <div style={{ fontSize: 10, color: LIGHT, fontFamily: 'monospace' }}>/{o.slug}</div>
              </div>
              {o.id === featured?.id && <span style={{ fontSize: 9, fontWeight: 700, color: 'white', background: TC, padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>FEATURED</span>}
            </div>
            <div style={{ fontSize: 12, color: MID, lineHeight: 1.5, marginBottom: 10 }}>{o.description}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: LIGHT, background: CREAM, padding: '3px 8px', borderRadius: 99 }}>Priority {o.priority}</span>
              <span style={{ fontSize: 10, color: LIGHT, background: CREAM, padding: '3px 8px', borderRadius: 99 }}>Order #{o.displayOrder}</span>
              {!o.active && <span style={{ fontSize: 10, fontWeight: 700, color: MID, background: BEIGE, padding: '3px 8px', borderRadius: 99 }}>Not eligible</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(o)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => toggle(o)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{o.active ? 'Deactivate' : 'Activate'}</button>
              <button onClick={() => remove(o)} style={{ padding: '7px 11px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Del</button>
            </div>
          </div>
        ))}
        {!loading && occasions.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: LIGHT }}>No occasions yet. Add one to populate the storefront's "Gifts for Every Occasion" row.</div>
        )}
      </div>

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

      {showForm && createPortal(
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: CREAM, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{editItem ? 'Edit Occasion' : 'Add Occasion'}</div>
              <button onClick={() => { setShowForm(false); setEditItem(null) }} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: MID }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Father's Day" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Season</label>
                <input value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} placeholder="June" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Slug (matches the occasion detail page)</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="fathers" style={{ ...inp, fontFamily: 'monospace' }} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Honor him in style" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Icon Image (optional — falls back to the emoji below)</label>
              {form.iconImageUrl ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 120, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={form.iconImageUrl} alt="Icon" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                  <button onClick={() => setForm(f => ({ ...f, iconImageUrl: '' }))} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(44,26,14,0.65)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: 'white', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, border: `2px dashed ${uploading ? BEIGE : TC}`, borderRadius: 12, cursor: uploading ? 'default' : 'pointer', background: '#FDF6F1', gap: 6 }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif" style={{ display: 'none' }} disabled={uploading} onChange={handleImageUpload} />
                  {uploading
                    ? <div style={{ fontSize: 12, fontWeight: 600, color: MID }}>Uploading…</div>
                    : <>
                        <div style={{ fontSize: 22, opacity: 0.5 }}>🖼️</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: MID }}>Upload icon image</div>
                      </>
                  }
                </label>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Emoji Icon</label>
                <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🎩" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Theme Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 44, height: 40, padding: 2, borderRadius: 10, border: `1.5px solid ${BEIGE}`, cursor: 'pointer' }} />
                  <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ ...inp, fontFamily: 'monospace' }} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Banner CTA (optional — falls back to "Shop the Edit")</label>
              <input value={form.ctaLabel} onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))} placeholder="Shop Father's Day" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</label>
                <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} placeholder="0" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
                <div style={{ fontSize: 10, color: LIGHT, marginTop: 5 }}>Among active occasions, highest wins the featured banner.</div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Row Order</label>
                <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} placeholder="0" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
                <div style={{ fontSize: 10, color: LIGHT, marginTop: 5 }}>Position in the "Gifts for Every Occasion" row.</div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: TC, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: DARK, fontWeight: 600 }}>Eligible for the featured banner</span>
            </label>

            <button onClick={handleSave} disabled={saving || uploading || !form.slug.trim() || !form.title.trim() || !form.description.trim() || !form.color}
              style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: (saving || !form.slug.trim() || !form.title.trim() || !form.description.trim() || !form.color) ? BEIGE : TC, color: (saving || !form.slug.trim() || !form.title.trim() || !form.description.trim() || !form.color) ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Occasion'}
            </button>
          </div>
        </div>, document.body
      )}
    </div>
  )
}
