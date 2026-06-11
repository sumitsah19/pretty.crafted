import { useState, useEffect } from 'react'
import { productAdminApi, categoriesApi, productsApi, uploadApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SectionHeader } from './shared'

// ─── PRODUCTS VIEW ─────────────────────────────────────────────────
export default function ProductsView({ onToast }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', materials: '', care: '', shippingAndReturns: '', price: '', originalPrice: '', rating: '', reviewCount: '', stock: '', categoryId: '', imageUrls: [], tag: '', recipient: '' })

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
  }, [onToast])

  const [lowStockOnly, setLowStockOnly] = useState(false)

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoryName || '').toLowerCase().includes(search.toLowerCase())
    const matchStock = !lowStockOnly || p.stock <= 5
    return matchSearch && matchStock
  })

  const openAdd = () => {
    setEditItem(null)
    setForm({ name: '', description: '', materials: '', care: '', shippingAndReturns: '', price: '', originalPrice: '', rating: '', reviewCount: '', stock: '', categoryId: categories[0]?.id || '', imageUrls: [], tag: '', recipient: '' })
    setShowAdd(true)
  }
  const openEdit = (p) => {
    setEditItem(p)
    setForm({ name: p.name, description: p.description || '', materials: p.materials || '', care: p.care || '', shippingAndReturns: p.shippingAndReturns || '', price: p.price, originalPrice: p.originalPrice ?? '', rating: p.rating ?? '', reviewCount: p.reviewCount ?? '', stock: p.stock, categoryId: p.categoryId, imageUrls: p.imageUrls?.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []), tag: p.tag || '', recipient: p.recipient || '' })
    setShowAdd(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { name: form.name, description: form.description, materials: form.materials, care: form.care, shippingAndReturns: form.shippingAndReturns, price: Number(form.price), originalPrice: form.originalPrice === '' ? null : Number(form.originalPrice), rating: form.rating === '' ? null : Math.round(Number(form.rating) * 10) / 10, reviewCount: form.reviewCount === '' ? null : Number(form.reviewCount), stock: Number(form.stock), categoryId: Number(form.categoryId), imageUrls: form.imageUrls, tag: form.tag, recipient: form.recipient }
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
      setForm(f => ({ ...f, imageUrls: [...f.imageUrls, data.url] }))
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
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BEIGE}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            style={{ flex: 1, minWidth: 180, maxWidth: 340, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: CREAM, color: DARK, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
          <button onClick={() => setLowStockOnly(v => !v)}
            style={{ padding: '8px 16px', borderRadius: 99, border: `1.5px solid ${lowStockOnly ? '#A02A2A' : BEIGE}`, background: lowStockOnly ? '#FFF5F5' : 'white', color: lowStockOnly ? '#A02A2A' : MID, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ⚠ Low Stock{lowStockOnly ? ' (on)' : ''}
          </button>
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
              { label: 'Description', key: 'description', type: 'textarea', hint: 'Shown in the Description tab. Line breaks are preserved.' },
              { label: 'Materials', key: 'materials', type: 'textarea', hint: 'Shown in the Materials tab. Line breaks are preserved.' },
              { label: 'Care', key: 'care', type: 'textarea', hint: 'Shown in the Care tab. Line breaks are preserved.' },
              { label: 'Shipping & Returns', key: 'shippingAndReturns', type: 'textarea', hint: 'Shown in the Shipping & Returns tab. Line breaks are preserved.' },
              { label: 'Price (₹)', key: 'price', type: 'number' },
              { label: 'Original Price / MRP (₹)', key: 'originalPrice', type: 'number', hint: 'Optional. Shown struck-through with a Save % badge when higher than the price.' },
              { label: 'Rating (0–5)', key: 'rating', type: 'number', hint: 'Optional. Average star rating shown on the product card.' },
              { label: 'Review count', key: 'reviewCount', type: 'number', hint: 'Optional. Number of reviews shown next to the stars.' },
              { label: 'Stock', key: 'stock', type: 'number' },
            ].map(({ label, key, type, hint }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                {type === 'textarea' ? (
                  <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} rows={4}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
                ) : (
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
                )}
                {hint && <div style={{ fontSize: 10, color: LIGHT, marginTop: 5 }}>{hint}</div>}
              </div>
            ))}

            {/* Tag dropdown */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tag</label>
              <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— No tag —</option>
                <option value="Bestseller">Bestseller</option>
                <option value="New">New</option>
                <option value="Sale">Sale</option>
                <option value="Limited">Limited</option>
                <option value="Trending">Trending</option>
              </select>
            </div>

            {/* Recipient dropdown */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recipient</label>
              <select value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                style={{ ...inp, cursor: 'pointer' }}>
                <option value="all">All</option>
                <option value="her">Her</option>
                <option value="him">Him</option>
                <option value="kids">Kids</option>
              </select>
            </div>

            {/* Multi-image upload */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Product Images</label>
                <span style={{ fontSize: 11, color: LIGHT }}>{form.imageUrls.length}/4 uploaded</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[0, 1, 2, 3].map(i => {
                  const url = form.imageUrls[i]
                  const isNext = form.imageUrls.length === i
                  return (
                    <div key={i}>
                      {url ? (
                        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 110 }}>
                          <img src={url} alt={`Product ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          {i === 0 && <span style={{ position: 'absolute', top: 6, left: 6, background: TC, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>Primary</span>}
                          <button onClick={() => setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, idx) => idx !== i) }))}
                            style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(44,26,14,0.65)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: 'white', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 110, border: `2px dashed ${isNext && !uploading ? TC : BEIGE}`, borderRadius: 12, cursor: isNext && !uploading ? 'pointer' : 'default', background: isNext ? '#FDF6F1' : '#F9F6F2', opacity: isNext ? 1 : 0.5, gap: 6 }}>
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} disabled={!isNext || uploading} onChange={handleImageUpload} />
                          {isNext && uploading
                            ? <div style={{ fontSize: 11, fontWeight: 600, color: MID }}>Uploading…</div>
                            : <>
                                <div style={{ fontSize: 22, opacity: 0.5 }}>📷</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: MID }}>{i === 0 ? 'Add Primary' : `Image ${i + 1}`}</div>
                                {i === 0 && <div style={{ fontSize: 10, color: LIGHT }}>PNG, JPG · max 5 MB</div>}
                              </>
                          }
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
              {form.imageUrls.length > 0 && <div style={{ fontSize: 11, color: LIGHT, marginTop: 8 }}>First image is primary. Click × to remove.</div>}
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
