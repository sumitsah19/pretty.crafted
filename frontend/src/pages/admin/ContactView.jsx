import { useState, useEffect } from 'react'
import { contactAdminApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, SectionHeader } from './shared'

// ─── CONTACT VIEW ──────────────────────────────────────────────────
// Manage the support channels shown by the Help Center "Contact Us" action.
export default function ContactView({ onToast }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    contactAdminApi.get()
      .then(({ data }) => { if (alive) setForm(data) })
      .catch(() => { if (alive) onToast('Failed to load contact settings') })
    return () => { alive = false }
  }, [onToast])

  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, background: 'white', fontFamily: "'DM Sans',sans-serif", outline: 'none', color: DARK, boxSizing: 'border-box' }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await contactAdminApi.update(form)
      setForm(data)
      onToast('Contact settings saved')
    } catch (e) {
      onToast('Error: ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  if (!form) return (
    <div style={{ textAlign: 'center', padding: 48, color: LIGHT }}>Loading…</div>
  )

  const channels = [
    { key: 'emailEnabled',    valueKey: 'supportEmail',   label: 'Email',    placeholder: 'support@prettycrafted.com', hint: 'Address customers email for help.' },
    { key: 'whatsappEnabled', valueKey: 'whatsappNumber', label: 'WhatsApp', placeholder: '919876543210', hint: 'Country code + number, digits only.' },
    { key: 'phoneEnabled',    valueKey: 'phoneNumber',    label: 'Phone',    placeholder: '+91 98765 43210', hint: 'Shown as a tap-to-call link.' },
  ]

  return (
    <div>
      <SectionHeader title="Contact Channels" sub="Shown in the Help Center → Contact Us" />

      <div style={{ background: 'white', borderRadius: 20, padding: '24px 26px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 12px rgba(44,26,14,0.05)', maxWidth: 560 }}>
        {channels.map(ch => (
          <div key={ch.key} style={{ marginBottom: 22 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form[ch.key]} onChange={e => set(ch.key, e.target.checked)} style={{ width: 16, height: 16, accentColor: TC, cursor: 'pointer' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{ch.label}</span>
              <span style={{ fontSize: 11, color: form[ch.key] ? '#3F7A2E' : LIGHT, fontWeight: 600 }}>{form[ch.key] ? 'Enabled' : 'Disabled'}</span>
            </label>
            <input value={form[ch.valueKey] || ''} onChange={e => set(ch.valueKey, e.target.value)} placeholder={ch.placeholder} style={inp}
              onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
            <div style={{ fontSize: 11, color: LIGHT, marginTop: 5 }}>{ch.hint}</div>
          </div>
        ))}

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: MID, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Support hours</label>
          <input value={form.hours || ''} onChange={e => set('hours', e.target.value)} placeholder="Mon–Sat, 10am–6pm IST" style={inp}
            onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
        </div>

        <button onClick={save} disabled={saving}
          style={{ width: '100%', padding: 13, borderRadius: 99, border: 'none', background: saving ? BEIGE : TC, color: saving ? LIGHT : 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer' }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
