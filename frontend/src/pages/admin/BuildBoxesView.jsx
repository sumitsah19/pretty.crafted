import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { uploadApi, buildBoxAdminApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SectionHeader } from './shared'

// ─── BUILD BOXES VIEW ──────────────────────────────────────────────
// Curates the "Build Your Own Box" CoverFlow. Each box is an uploaded image with a
// display order and active flag. Clicking a box on the storefront opens the box builder.
export default function BuildBoxesView({ onToast = () => {} }) {
  const [boxes, setBoxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ imageUrl: '', title: '', priceSmall: '', priceMedium: '', priceLarge: '', displayOrder: '', active: true })

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK }

  useEffect(() => {
    buildBoxAdminApi.list()
      .then(({ data }) => setBoxes(data || []))
      .catch(() => onToast('Failed to load boxes'))
      .finally(() => setLoading(false))
  }, [onToast])

  const openAdd = () => {
    setEditItem(null)
    setForm({ imageUrl: '', title: '', priceSmall: '', priceMedium: '', priceLarge: '', displayOrder: String(boxes.length), active: true })
    setShowForm(true)
  }

  const openEdit = (b) => {
    setEditItem(b)
    setForm({
      imageUrl: b.imageUrl,
      title: b.title || '',
      priceSmall: b.priceSmall ?? '',
      priceMedium: b.priceMedium ?? '',
      priceLarge: b.priceLarge ?? '',
      displayOrder: b.displayOrder ?? '',
      active: b.active,
    })
    setShowForm(true)
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const num = (v) => (v === '' ? null : Number(v))
      const payload = {
        imageUrl: form.imageUrl,
        title: form.title || null,
        priceSmall: num(form.priceSmall),
        priceMedium: num(form.priceMedium),
        priceLarge: num(form.priceLarge),
        displayOrder: form.displayOrder === '' ? 0 : Number(form.displayOrder),
        active: form.active,
      }
      if (editItem) {
        const { data } = await buildBoxAdminApi.update(editItem.id, payload)
        setBoxes(bs => bs.map(b => b.id === data.id ? data : b))
        onToast('Box updated')
      } else {
        const { data } = await buildBoxAdminApi.create(payload)
        setBoxes(bs => [...bs, data].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id))
        onToast('Box added')
      }
      setShowForm(false); setEditItem(null)
    } catch (e) {
      onToast('Error: ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  const toggle = async (b) => {
    setBusyId(b.id)
    try {
      const { data } = await buildBoxAdminApi.toggle(b.id)
      setBoxes(bs => bs.map(x => x.id === data.id ? data : x))
      onToast(`Box ${data.active ? 'shown' : 'hidden'}`)
    } catch { onToast('Update failed') } finally { setBusyId(null) }
  }

  const remove = async (b) => {
    if (!window.confirm('Delete this box?')) return
    setBusyId(b.id)
    try {
      await buildBoxAdminApi.remove(b.id)
      setBoxes(bs => bs.filter(x => x.id !== b.id))
      onToast('Box removed')
    } catch { onToast('Delete failed') } finally { setBusyId(null) }
  }

  return (
    <div>
      <SectionHeader title="Build Boxes" sub={loading ? 'Loading…' : `${boxes.length} boxes in the "Build Your Own Box" carousel`} action="+ Add Box" onAction={openAdd} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
        {boxes.map(b => (
          <div key={b.id} style={{ background: 'white', borderRadius: 18, border: `1px solid ${BEIGE}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(44,26,14,0.04)', opacity: busyId === b.id ? 0.6 : 1 }}>
            <div style={{ position: 'relative', height: 150, background: CREAM }}>
              <img src={b.imageUrl} alt={b.title || 'Box'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: b.active ? 1 : 0.45 }} />
              <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(44,26,14,0.7)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>#{b.displayOrder}</span>
              {!b.active && <span style={{ position: 'absolute', bottom: 8, left: 8, background: BEIGE, color: MID, fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>Hidden</span>}
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: DARK, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || <span style={{ color: LIGHT, fontWeight: 400 }}>Untitled</span>}</div>
                {(() => {
                  const set = [b.priceSmall, b.priceMedium, b.priceLarge].filter(v => v != null).map(Number)
                  if (!set.length) return null
                  const lo = Math.min(...set), hi = Math.max(...set)
                  const label = lo === hi ? `₹${lo.toLocaleString('en-IN')}` : `₹${lo.toLocaleString('en-IN')}–${hi.toLocaleString('en-IN')}`
                  return <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: TC }}>{label}</div>
                })()}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(b)} style={{ flex: 1, padding: '6px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => toggle(b)} style={{ flex: 1, padding: '6px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{b.active ? 'Hide' : 'Show'}</button>
                <button onClick={() => remove(b)} style={{ padding: '6px 11px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Del</button>
              </div>
            </div>
          </div>
        ))}
        {!loading && boxes.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: LIGHT }}>No boxes yet. Add one to populate the "Build Your Own Box" carousel.</div>
        )}
      </div>

      {showForm && createPortal(
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: CREAM, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{editItem ? 'Edit Box' : 'Add Box'}</div>
              <button onClick={() => { setShowForm(false); setEditItem(null) }} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: MID }}>×</button>
            </div>

            {/* Image upload */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Box Image</label>
              {form.imageUrl ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 160 }}>
                  <img src={form.imageUrl} alt="Box" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setForm(f => ({ ...f, imageUrl: '' }))} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(44,26,14,0.65)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: 'white', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, border: `2px dashed ${uploading ? BEIGE : TC}`, borderRadius: 12, cursor: uploading ? 'default' : 'pointer', background: '#FDF6F1', gap: 6 }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} disabled={uploading} onChange={handleImageUpload} />
                  {uploading
                    ? <div style={{ fontSize: 12, fontWeight: 600, color: MID }}>Uploading…</div>
                    : <>
                        <div style={{ fontSize: 26, opacity: 0.5 }}>📷</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: MID }}>Upload box image</div>
                        <div style={{ fontSize: 10, color: LIGHT }}>PNG, JPG · max 5 MB</div>
                      </>
                  }
                </label>
              )}
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title (optional)</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Velvet Box" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            </div>

            {/* Per-size price (replaces the size base fee for this box) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Box Price by Size (₹)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[['priceSmall', 'Small'], ['priceMedium', 'Medium'], ['priceLarge', 'Large']].map(([k, label]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: LIGHT, marginBottom: 4, fontWeight: 600 }}>{label}</div>
                    <input type="number" min="0" step="1" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder="—" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: LIGHT, marginTop: 6 }}>The box price for each size. Wrap and product prices are added on top. Leave a size blank to use the default size fee.</div>
            </div>

            {/* Display order */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order</label>
              <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} placeholder="0" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            </div>

            {/* Active toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: TC, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: DARK, fontWeight: 500 }}>Visible on storefront</span>
            </label>

            <button onClick={handleSave} disabled={saving || uploading || !form.imageUrl}
              style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: (saving || !form.imageUrl) ? BEIGE : TC, color: (saving || !form.imageUrl) ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: (saving || !form.imageUrl) ? 'default' : 'pointer' }}>
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Box'}
            </button>
          </div>
        </div>, document.body
      )}
    </div>
  )
}
