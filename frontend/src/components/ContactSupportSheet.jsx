import { useState, useEffect } from 'react'
import { contactApi } from '../api/services'

// Fallback support email if the contact config hasn't loaded / isn't set yet.
const SUPPORT_EMAIL = 'support@prettycrafted.com'

function IconChevR() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BBADA0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg> }

// Bottom sheet offering WhatsApp / Email support channels, sourced from the
// admin-managed contact config (/api/public/contact). Shared by the My
// Profile "Need Help?" card and the mobile nav's "Contact Us" button so the
// channel-building logic and copy live in one place.
export default function ContactSupportSheet({ open, onClose, onToast }) {
  const [contact, setContact] = useState(null)

  useEffect(() => {
    contactApi.get()
      .then(({ data }) => setContact(data))
      .catch(() => setContact(null))
  }, [])

  if (!open) return null

  const channels = []
  if (contact?.emailEnabled !== false && (contact?.supportEmail || !contact)) {
    const email = contact?.supportEmail || SUPPORT_EMAIL
    channels.push({ key: 'email', icon: '✉️', label: 'Email Support', href: `mailto:${email}?subject=${encodeURIComponent('Prettycrafted Support Request')}`, toast: 'Opening your email app…' })
  }
  if (contact?.whatsappEnabled && contact?.whatsappNumber) {
    channels.push({ key: 'whatsapp', icon: '💬', label: 'WhatsApp Support', href: `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent('Hi! I need help with my order.')}`, external: true, toast: 'Opening WhatsApp…' })
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1250, background: 'rgba(44,26,14,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="animate-slide-up-sheet"
        style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: '20px 20px 0 0', padding: '10px 20px 28px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#EDE4D8', margin: '8px auto 16px' }} />
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Need Help?</div>
        <div style={{ fontSize: 13, color: '#9C7A63', marginBottom: 18 }}>Choose how you'd like to reach us</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {channels.map(ch => (
            <a key={ch.key} href={ch.href}
              {...(ch.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              onClick={() => { onToast?.(ch.toast); onClose() }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1.5px solid #EDE4D8', textDecoration: 'none', background: '#FDF8F4' }}>
              <span style={{ fontSize: 20 }}>{ch.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{ch.label}</span>
              <span style={{ marginLeft: 'auto' }}><IconChevR /></span>
            </a>
          ))}
        </div>
        <button onClick={onClose}
          style={{ width: '100%', marginTop: 16, padding: '13px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'white', color: '#6B4F3A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
