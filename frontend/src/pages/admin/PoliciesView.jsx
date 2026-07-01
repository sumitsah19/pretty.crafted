import { useState, useEffect } from 'react'
import { policyAdminApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SectionHeader } from './shared'

const BLANK = { slug: '', title: '', shortDescription: '', content: '', effectiveDate: '', lastUpdatedDate: '', displayOrder: '', active: true }

// ─── POLICIES VIEW ─────────────────────────────────────────────────
// Manage the storefront's Legal & Policies pages (Terms, Privacy, Return &
// Refund, Shipping, Cancellation, Cookie Policy, Payment Terms, Contact &
// Support). Backed by /api/admin/policies; rendered publicly at
// /api/public/policies/{slug} and parsed by frontend/src/utils/policyContent.jsx.
export default function PoliciesView({ onToast }) {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(BLANK)

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK, boxSizing: 'border-box' }

  useEffect(() => {
    policyAdminApi.list()
      .then(({ data }) => setPolicies(data || []))
      .catch(() => onToast('Failed to load policies'))
      .finally(() => setLoading(false))
  }, [onToast])

  const openAdd = () => {
    setEditItem(null)
    setForm({ ...BLANK, displayOrder: String(policies.length) })
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditItem(p)
    setForm({
      slug: p.slug,
      title: p.title,
      shortDescription: p.shortDescription || '',
      content: p.content,
      effectiveDate: p.effectiveDate || '',
      lastUpdatedDate: p.lastUpdatedDate || '',
      displayOrder: p.displayOrder ?? '',
      active: p.active,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || null,
        content: form.content.trim(),
        effectiveDate: form.effectiveDate || null,
        lastUpdatedDate: form.lastUpdatedDate || null,
        displayOrder: form.displayOrder === '' ? null : Number(form.displayOrder),
        active: form.active,
      }
      if (editItem) {
        const { data } = await policyAdminApi.update(editItem.id, payload)
        setPolicies(ps => ps.map(p => p.id === data.id ? data : p))
        onToast('Policy updated')
      } else {
        const { data } = await policyAdminApi.create(payload)
        setPolicies(ps => [...ps, data])
        onToast('Policy added')
      }
      setShowForm(false)
    } catch (e) {
      onToast('Error: ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  const toggle = async (p) => {
    try {
      const { data } = await policyAdminApi.toggle(p.id)
      setPolicies(ps => ps.map(x => x.id === data.id ? data : x))
      onToast(`Policy ${data.active ? 'shown' : 'hidden'}`)
    } catch { onToast('Toggle failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this policy? It will disappear from the storefront and footer.')) return
    try {
      await policyAdminApi.remove(id)
      setPolicies(ps => ps.filter(p => p.id !== id))
      onToast('Policy deleted')
    } catch { onToast('Delete failed') }
  }

  return (
    <div>
      <SectionHeader title="Legal & Policies" sub={loading ? 'Loading…' : `${policies.length} policies`} action="+ Add Policy" onAction={openAdd} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {policies.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: 16, padding: '16px 20px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)', opacity: p.active ? 1 : 0.55 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: TC, background: '#FDF1EA', padding: '2px 9px', borderRadius: 99, fontFamily: 'monospace' }}>/{p.slug}</span>
                  <span style={{ fontSize: 10, color: LIGHT }}>#{p.displayOrder}</span>
                  {!p.active && <span style={{ fontSize: 10, fontWeight: 700, color: MID, background: BEIGE, padding: '2px 9px', borderRadius: 99 }}>Hidden</span>}
                </div>
                <div style={{ fontWeight: 700, color: DARK, fontSize: 14, marginBottom: 5 }}>{p.title}</div>
                {p.shortDescription && <div style={{ fontSize: 12.5, color: LIGHT, lineHeight: 1.55 }}>{p.shortDescription}</div>}
                <div style={{ fontSize: 11, color: LIGHT, marginTop: 6 }}>
                  {p.effectiveDate && `Effective ${p.effectiveDate}`}{p.effectiveDate && p.lastUpdatedDate && ' · '}{p.lastUpdatedDate && `Updated ${p.lastUpdatedDate}`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => toggle(p)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{p.active ? 'Hide' : 'Show'}</button>
              <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
        {!loading && policies.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: LIGHT }}>No policies yet. Add one to get started.</div>
        )}
      </div>

      {showForm && (
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: CREAM, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{editItem ? 'Edit Policy' : 'Add Policy'}</div>
              <button onClick={() => setShowForm(false)} aria-label="Close" style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: MID }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order</label>
                <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Slug (URL path segment)</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="terms-of-service" style={{ ...inp, fontFamily: 'monospace' }} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              <div style={{ fontSize: 11, color: LIGHT, marginTop: 5 }}>Lowercase, hyphen-separated. Changing this changes the page's URL.</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Short Description (SEO / list subtitle)</label>
              <input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Content</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={12} style={{ ...inp, resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace', fontSize: 12.5 }} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              <div style={{ fontSize: 11, color: LIGHT, marginTop: 5 }}>
                Use <code>## Heading</code> for section headings, <code>- item</code> for bullet lists, blank lines between blocks, <code>**bold**</code> and <code>[link text](/some-path)</code> for inline links.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Effective Date</label>
                <input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Updated Date</label>
                <input type="date" value={form.lastUpdatedDate} onChange={e => setForm(f => ({ ...f, lastUpdatedDate: e.target.value }))} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: TC, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: DARK, fontWeight: 600 }}>Visible on storefront</span>
            </label>

            <button onClick={handleSave} disabled={saving || !form.slug.trim() || !form.title.trim() || !form.content.trim()}
              style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: (saving || !form.slug.trim() || !form.title.trim() || !form.content.trim()) ? BEIGE : TC, color: (saving || !form.slug.trim() || !form.title.trim() || !form.content.trim()) ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Policy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
