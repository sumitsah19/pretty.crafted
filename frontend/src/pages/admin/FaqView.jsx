import { useState, useEffect } from 'react'
import { faqAdminApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SectionHeader } from './shared'

const BLANK = { question: '', answer: '', category: '', displayOrder: '', active: true }

// ─── FAQ VIEW ──────────────────────────────────────────────────────
// Manage the storefront Help Center FAQ accordion. Backed by /api/admin/faqs.
export default function FaqView({ onToast }) {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(BLANK)

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK }

  useEffect(() => {
    faqAdminApi.list()
      .then(({ data }) => setFaqs(data || []))
      .catch(() => onToast('Failed to load FAQs'))
      .finally(() => setLoading(false))
  }, [onToast])

  const openAdd = () => {
    setEditItem(null)
    setForm({ ...BLANK, displayOrder: String(faqs.length) })
    setShowForm(true)
  }

  const openEdit = (f) => {
    setEditItem(f)
    setForm({ question: f.question, answer: f.answer, category: f.category || '', displayOrder: f.displayOrder ?? '', active: f.active })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category.trim() || null,
        displayOrder: form.displayOrder === '' ? null : Number(form.displayOrder),
        active: form.active,
      }
      if (editItem) {
        const { data } = await faqAdminApi.update(editItem.id, payload)
        setFaqs(fs => fs.map(f => f.id === data.id ? data : f))
        onToast('FAQ updated')
      } else {
        const { data } = await faqAdminApi.create(payload)
        setFaqs(fs => [...fs, data])
        onToast('FAQ added')
      }
      setShowForm(false)
    } catch (e) {
      onToast('Error: ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  const toggle = async (f) => {
    try {
      const { data } = await faqAdminApi.toggle(f.id)
      setFaqs(fs => fs.map(x => x.id === data.id ? data : x))
      onToast(`FAQ ${data.active ? 'shown' : 'hidden'}`)
    } catch { onToast('Toggle failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ? It will disappear from the Help Center.')) return
    try {
      await faqAdminApi.remove(id)
      setFaqs(fs => fs.filter(f => f.id !== id))
      onToast('FAQ deleted')
    } catch { onToast('Delete failed') }
  }

  return (
    <div>
      <SectionHeader title="FAQs" sub={loading ? 'Loading…' : `${faqs.length} questions`} action="+ Add FAQ" onAction={openAdd} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map(f => (
          <div key={f.id} style={{ background: 'white', borderRadius: 16, padding: '16px 20px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)', opacity: f.active ? 1 : 0.55 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  {f.category && <span style={{ fontSize: 10, fontWeight: 700, color: TC, background: '#FDF1EA', padding: '2px 9px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.category}</span>}
                  <span style={{ fontSize: 10, color: LIGHT }}>#{f.displayOrder}</span>
                  {!f.active && <span style={{ fontSize: 10, fontWeight: 700, color: MID, background: BEIGE, padding: '2px 9px', borderRadius: 99 }}>Hidden</span>}
                </div>
                <div style={{ fontWeight: 700, color: DARK, fontSize: 14, marginBottom: 5 }}>{f.question}</div>
                <div style={{ fontSize: 12.5, color: LIGHT, lineHeight: 1.55 }}>{f.answer}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => openEdit(f)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => toggle(f)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{f.active ? 'Hide' : 'Show'}</button>
              <button onClick={() => handleDelete(f.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
        {!loading && faqs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: LIGHT }}>No FAQs yet. Add one to get started.</div>
        )}
      </div>

      {showForm && (
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: CREAM, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{editItem ? 'Edit FAQ' : 'Add FAQ'}</div>
              <button onClick={() => setShowForm(false)} aria-label="Close" style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: MID }}>×</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question</label>
              <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Answer</label>
              <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={5} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category (optional)</label>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Orders, Payments…" style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order</label>
                <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} style={inp} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: TC, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: DARK, fontWeight: 600 }}>Visible on storefront</span>
            </label>

            <button onClick={handleSave} disabled={saving || !form.question.trim() || !form.answer.trim()}
              style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: (saving || !form.question.trim() || !form.answer.trim()) ? BEIGE : TC, color: (saving || !form.question.trim() || !form.answer.trim()) ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add FAQ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
