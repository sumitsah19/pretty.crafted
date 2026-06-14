import { useState, useEffect, useMemo } from 'react'
import { uploadApi, heroCardAdminApi, productsApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SAGE, SectionHeader } from './shared'

// ─── HERO CARDS VIEW ───────────────────────────────────────────────
// Curates the storefront hero CoverFlow (the moving cards). Each card links to a
// real catalog product/hamper (picked from the live catalog), and reuses that
// item's image. Because the card points at an existing product, that item also
// shows up on the shop / hamper page and its detail opens when the card is clicked.
export default function HeroCardsView({ onToast }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ imageUrl: '', title: '', type: 'PRODUCT', linkedProductId: '', displayOrder: '', active: true })
  // Live catalog (products + hampers) the admin picks from. Hampers are just
  // products in the "Hampers" category, so a single /products fetch covers both.
  const [products, setProducts] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK }

  useEffect(() => {
    heroCardAdminApi.list()
      .then(({ data }) => setCards(data || []))
      .catch(() => onToast('Failed to load hero cards'))
      .finally(() => setLoading(false))
  }, [onToast])

  useEffect(() => {
    productsApi.list({ size: 500 })
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data.content || []))
      .catch(() => { /* picker just stays empty */ })
  }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ imageUrl: '', title: '', type: 'PRODUCT', linkedProductId: '', displayOrder: String(cards.length), active: true })
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditItem(c)
    setForm({ imageUrl: c.imageUrl, title: c.title || '', type: c.type || 'PRODUCT', linkedProductId: c.linkedProductId ?? '', displayOrder: c.displayOrder ?? '', active: c.active })
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
      const payload = {
        imageUrl: form.imageUrl,
        title: form.title || null,
        type: form.type,
        linkedProductId: form.linkedProductId === '' ? null : Number(form.linkedProductId),
        displayOrder: form.displayOrder === '' ? 0 : Number(form.displayOrder),
        active: form.active,
      }
      if (editItem) {
        const { data } = await heroCardAdminApi.update(editItem.id, payload)
        setCards(cs => cs.map(c => c.id === data.id ? data : c))
        onToast('Hero card updated')
      } else {
        const { data } = await heroCardAdminApi.create(payload)
        setCards(cs => [...cs, data].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id))
        onToast('Hero card added')
      }
      setShowForm(false); setEditItem(null)
    } catch (e) {
      onToast('Error: ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  const toggle = async (c) => {
    setBusyId(c.id)
    try {
      const { data } = await heroCardAdminApi.toggle(c.id)
      setCards(cs => cs.map(x => x.id === data.id ? data : x))
      onToast(`Card ${data.active ? 'shown' : 'hidden'}`)
    } catch { onToast('Update failed') } finally { setBusyId(null) }
  }

  const remove = async (c) => {
    if (!window.confirm('Delete this hero card?')) return
    setBusyId(c.id)
    try {
      await heroCardAdminApi.remove(c.id)
      setCards(cs => cs.filter(x => x.id !== c.id))
      onToast('Hero card removed')
    } catch { onToast('Delete failed') } finally { setBusyId(null) }
  }

  // ── Product picker helpers ──────────────────────────────────────
  const productImage = (p) => p?.imageUrl || (Array.isArray(p?.imageUrls) ? p.imageUrls[0] : '') || ''
  const isHamper = (p) => (p?.categoryName || p?.category || '').toLowerCase() === 'hampers'
  const selectedProduct = products.find(p => String(p.id) === String(form.linkedProductId))

  // Picking an item wires the card to a real product: copy its image (so the card
  // shows the product), derive the PRODUCT/HAMPER type from its category, and use
  // its name as the default title. Admin can still override image/title afterward.
  const pickProduct = (p) => {
    setForm(f => ({
      ...f,
      linkedProductId: p.id,
      type: isHamper(p) ? 'HAMPER' : 'PRODUCT',
      imageUrl: productImage(p) || f.imageUrl,
      title: f.title || p.name || '',
    }))
    setPickerOpen(false)
    setPickerSearch('')
  }

  const pickerResults = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase()
    return products
      .filter(p => !q || (p.name || '').toLowerCase().includes(q))
      .slice(0, 50)
  }, [products, pickerSearch])

  return (
    <div>
      <SectionHeader title="Hero Cards" sub={loading ? 'Loading…' : `${cards.length} cards in the hero carousel`} action="+ Add Card" onAction={openAdd} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
        {cards.map(c => (
          <div key={c.id} style={{ background: 'white', borderRadius: 18, border: `1px solid ${BEIGE}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(44,26,14,0.04)', opacity: busyId === c.id ? 0.6 : 1 }}>
            <div style={{ position: 'relative', height: 150, background: CREAM }}>
              <img src={c.imageUrl} alt={c.title || 'Hero card'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: c.active ? 1 : 0.45 }} />
              <span style={{ position: 'absolute', top: 8, left: 8, background: c.type === 'HAMPER' ? SAGE : TC, color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99, letterSpacing: '0.05em' }}>{c.type}</span>
              <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(44,26,14,0.7)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>#{c.displayOrder}</span>
              {!c.active && <span style={{ position: 'absolute', bottom: 8, left: 8, background: BEIGE, color: MID, fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>Hidden</span>}
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, color: DARK, fontSize: 13, marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title || <span style={{ color: LIGHT, fontWeight: 400 }}>Untitled</span>}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(c)} style={{ flex: 1, padding: '6px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => toggle(c)} style={{ flex: 1, padding: '6px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{c.active ? 'Hide' : 'Show'}</button>
                <button onClick={() => remove(c)} style={{ padding: '6px 11px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Del</button>
              </div>
            </div>
          </div>
        ))}
        {!loading && cards.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: LIGHT }}>No hero cards yet. Add one to populate the storefront carousel.</div>
        )}
      </div>

      {showForm && (
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: CREAM, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{editItem ? 'Edit Hero Card' : 'Add Hero Card'}</div>
              <button onClick={() => { setShowForm(false); setEditItem(null) }} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: MID }}>×</button>
            </div>

            {/* Linked product / hamper picker — the card's source of truth */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Linked product / hamper</label>
              {selectedProduct ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, border: `1.5px solid ${BEIGE}`, background: 'white' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: CREAM, flexShrink: 0 }}>
                    {productImage(selectedProduct) && <img src={productImage(selectedProduct)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: DARK, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedProduct.name}</div>
                    <div style={{ fontSize: 11, color: LIGHT }}>{(selectedProduct.categoryName || selectedProduct.category || '—')} · #{selectedProduct.id}</div>
                  </div>
                  <button onClick={() => { setPickerOpen(true); setPickerSearch('') }} style={{ padding: '6px 12px', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <button onClick={() => { setPickerOpen(true); setPickerSearch('') }} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px dashed ${TC}`, background: '#FDF6F1', color: TC, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                  + Choose a product or hamper
                </button>
              )}
              <div style={{ fontSize: 10, color: LIGHT, marginTop: 6 }}>The card opens this item's detail and reuses its image. The item also appears on the shop / hamper page.</div>

              {pickerOpen && (
                <div style={{ marginTop: 8, border: `1.5px solid ${BEIGE}`, borderRadius: 12, background: 'white', overflow: 'hidden' }}>
                  <input autoFocus value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Search by name…" style={{ ...inp, border: 'none', borderBottom: `1px solid ${BEIGE}`, borderRadius: 0 }} />
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {pickerResults.length === 0 && <div style={{ padding: 14, fontSize: 12, color: LIGHT, textAlign: 'center' }}>No products found</div>}
                    {pickerResults.map(p => (
                      <button key={p.id} onClick={() => pickProduct(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', borderBottom: `1px solid ${CREAM}`, background: String(p.id) === String(form.linkedProductId) ? '#FDF6F1' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 6, overflow: 'hidden', background: CREAM, flexShrink: 0 }}>
                          {productImage(p) && <img src={productImage(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: DARK, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: LIGHT }}>{(p.categoryName || p.category || '—')} · ₹{p.price} · #{p.id}</div>
                        </div>
                        {isHamper(p) && <span style={{ fontSize: 9, fontWeight: 700, color: SAGE, background: '#EEF4EA', padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>HAMPER</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Image upload — auto-filled from the linked product, override optional */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Card Image</label>
              {form.imageUrl ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 160 }}>
                  <img src={form.imageUrl} alt="Hero card" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setForm(f => ({ ...f, imageUrl: '' }))} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(44,26,14,0.65)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: 'white', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, border: `2px dashed ${uploading ? BEIGE : TC}`, borderRadius: 12, cursor: uploading ? 'default' : 'pointer', background: '#FDF6F1', gap: 6 }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} disabled={uploading} onChange={handleImageUpload} />
                  {uploading
                    ? <div style={{ fontSize: 12, fontWeight: 600, color: MID }}>Uploading…</div>
                    : <>
                        <div style={{ fontSize: 26, opacity: 0.5 }}>📷</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: MID }}>Upload card image</div>
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

            {/* Type */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="PRODUCT">Product</option>
                <option value="HAMPER">Hamper</option>
              </select>
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

            {!form.linkedProductId && <div style={{ fontSize: 11, color: LIGHT, marginBottom: 10, textAlign: 'center' }}>Choose a product or hamper to link before saving.</div>}
            {(() => {
              const canSave = !!form.imageUrl && !!form.linkedProductId
              return (
                <button onClick={handleSave} disabled={saving || uploading || !canSave}
                  style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: (saving || !canSave) ? BEIGE : TC, color: (saving || !canSave) ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: (saving || !canSave) ? 'default' : 'pointer' }}>
                  {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Card'}
                </button>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
