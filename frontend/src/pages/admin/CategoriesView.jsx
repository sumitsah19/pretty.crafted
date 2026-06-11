import { useState, useEffect } from 'react'
import { categoriesApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SectionHeader } from './shared'

// ─── CATEGORIES VIEW ───────────────────────────────────────────────
export default function CategoriesView({ onToast }) {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', imageUrl: '' })

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK }

  useEffect(() => {
    categoriesApi.list()
      .then(({ data }) => setCats(data || []))
      .catch(() => onToast('Failed to load categories'))
      .finally(() => setLoading(false))
  }, [onToast])

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const openAdd = () => {
    setEditItem(null)
    setForm({ name: '', slug: '', description: '', imageUrl: '' })
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditItem(c)
    setForm({ name: c.name, slug: c.slug, description: c.description || '', imageUrl: c.imageUrl || '' })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editItem) {
        const { data } = await categoriesApi.update(editItem.id, form)
        setCats(cs => cs.map(c => c.id === data.id ? data : c))
        onToast('Category updated')
      } else {
        const { data } = await categoriesApi.create(form)
        setCats(cs => [...cs, data])
        onToast('Category added')
      }
      setShowForm(false)
    } catch (e) {
      onToast('Error: ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Products in it will be affected.')) return
    try {
      await categoriesApi.remove(id)
      setCats(cs => cs.filter(c => c.id !== id))
      onToast('Category deleted')
    } catch { onToast('Delete failed') }
  }

  return (
    <div>
      <SectionHeader title="Categories" sub={loading ? 'Loading…' : `${cats.length} categories`} action="+ Add Category" onAction={openAdd} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {cats.map(c => (
          <div key={c.id} style={{ background: 'white', borderRadius: 18, padding: '18px 20px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: DARK, fontSize: 15, marginBottom: 3 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: TC, fontWeight: 600, marginBottom: 6 }}>/{c.slug}</div>
                {c.description && <div style={{ fontSize: 12, color: LIGHT, lineHeight: 1.5 }}>{c.description}</div>}
              </div>
              {c.imageUrl && <img src={c.imageUrl} alt={c.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => openEdit(c)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => handleDelete(c.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
        {!loading && cats.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: LIGHT }}>No categories yet. Add one to get started.</div>
        )}
      </div>

      {showForm && (
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: CREAM, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{editItem ? 'Edit Category' : 'Add Category'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: MID }}>×</button>
            </div>
            {[
              { label: 'Name', key: 'name' },
              { label: 'Slug (e.g. gift-for-her)', key: 'slug' },
              { label: 'Description', key: 'description' },
              { label: 'Image URL', key: 'imageUrl' },
            ].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                <input value={form[key]} onChange={e => {
                  const val = e.target.value
                  setForm(f => ({ ...f, [key]: val, ...(key === 'name' && !editItem ? { slug: autoSlug(val) } : {}) }))
                }} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
            ))}
            <button onClick={handleSave} disabled={saving || !form.name || !form.slug}
              style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: saving ? BEIGE : TC, color: saving ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer', marginTop: 8 }}>
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
