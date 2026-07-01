import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectUser, logoutThunk, setUser } from '../../store/slices/authSlice'
import { closeUserAccount, selectUI } from '../../store/slices/uiSlice'
import { selectWishlistIds, toggleWishlist, wishlistKey } from '../../store/slices/wishlistSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { addLocal } from '../../store/slices/cartSlice'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { ordersApi, authApi, addressApi, faqApi, promotionsApi, returnsApi, contactApi } from '../../api/services'

// Fallback support email if the contact config hasn't loaded / isn't set yet.
const SUPPORT_EMAIL = 'support@prettycrafted.com'

const TC = '#C4704A'

// ── ICON HELPERS ──────────────────────────────────────────────────
function IconBag()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> }
function IconHeart()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> }
function IconCard()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
function IconGift()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> }
function IconHelp()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IconPay()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> }
function IconUser()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function IconSettings(){ return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function IconLegal()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function IconStar()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function IconChevR()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BBADA0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> }
function IconChevD()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BBADA0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg> }
function IconBack()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }

// ── ORDER STATUS BADGE ────────────────────────────────────────────
function UABadge({ status }) {
  const map = {
    delivered:  { bg:'#EBF7EC', color:'#2A7A3B' },
    shipped:    { bg:'#EAF0FB', color:'#2A52A0' },
    processing: { bg:'#FEF3E8', color:'#A85A38' },
    paid:       { bg:'#FEF3E8', color:'#A85A38' },
    pending:    { bg:'#FEF9E7', color:'#B7791F' },
    cancelled:  { bg:'#FEE2E2', color:'#991B1B' },
  }
  const s = map[(status || '').toLowerCase()] || map.pending
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99, textTransform:'capitalize' }}>
      {status}
    </span>
  )
}

// ── ORDER TIMELINE ────────────────────────────────────────────────
function OrderTimeline({ status }) {
  const steps = ['placed', 'processing', 'shipped', 'delivered']
  const idx = steps.indexOf(status)
  const labels = { placed:'Placed', processing:'Processing', shipped:'Shipped', delivered:'Delivered' }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:12 }}>
      {steps.map((s, i) => {
        const done = i <= idx
        const isLast = i === steps.length - 1
        return (
          <span key={s} style={{ display:'contents' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background: done ? TC : '#EDE4D8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color: done ? 'white' : '#9C7A63', fontWeight:700, flexShrink:0 }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize:9, color: done ? TC : '#9C7A63', fontWeight: done ? 700 : 400, whiteSpace:'nowrap' }}>{labels[s]}</div>
            </div>
            {!isLast && <div style={{ flex:1, height:2, background: i < idx ? TC : '#EDE4D8', margin:'0 3px', marginBottom:16 }} />}
          </span>
        )
      })}
    </div>
  )
}

// ── PROFILE ROW ───────────────────────────────────────────────────
function ProfileRow({ icon, label, sub, right, onClick, noBorder }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 0', background: hov ? '#FDFAF7' : 'transparent', border:'none', cursor:'pointer', textAlign:'left', borderBottom: noBorder ? 'none' : '1px solid #F0EBE4', transition:'background 0.15s' }}>
      <div style={{ color:'#6B4F3A', flexShrink:0, display:'flex', alignItems:'center' }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:500, color:'#2C1A0E', lineHeight:1.2 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'#9C7A63', marginTop:2 }}>{sub}</div>}
      </div>
      {right || <IconChevR />}
    </button>
  )
}

// ── REWARD CHIP ───────────────────────────────────────────────────
function RewardChip({ icon, label, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex:'1 1 calc(50% - 5px)', display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:10, border:'1.5px solid #E8E0D8', background: hov ? '#FAF7F2' : 'white', cursor:'pointer', transition:'all 0.15s', minWidth:0 }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1, fontSize:13, fontWeight:500, color:'#2C1A0E', textAlign:'left', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{label}</span>
      <IconChevR />
    </button>
  )
}

// ── ACCORDION ROW ─────────────────────────────────────────────────
function AccordionRow({ icon, label, children, noBorder }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'15px 0', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', borderBottom: open || noBorder ? 'none' : '1px solid #F0EBE4' }}>
        <div style={{ color:'#6B4F3A', flexShrink:0, display:'flex' }}>{icon}</div>
        <div style={{ flex:1, fontSize:14, fontWeight:500, color:'#2C1A0E' }}>{label}</div>
        <div style={{ color:'#BBADA0', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}><IconChevD /></div>
      </button>
      {open && (
        <div style={{ paddingBottom:14, color:'#6B4F3A', fontSize:13, lineHeight:1.7 }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── SUPPORT CARD (contact us) ─────────────────────────────────────
// Same visual design as the old "Exclusive Member Deals" promo banner —
// tapping it opens a bottom sheet with WhatsApp / Email support channels
// sourced from the admin-managed contact config (/api/public/contact).
function SupportCard({ onToast }) {
  const [open, setOpen] = useState(false)
  const [contact, setContact] = useState(null)

  useEffect(() => {
    contactApi.get()
      .then(({ data }) => setContact(data))
      .catch(() => setContact(null))
  }, [])

  const channels = []
  if (contact?.emailEnabled !== false && (contact?.supportEmail || !contact)) {
    const email = contact?.supportEmail || SUPPORT_EMAIL
    channels.push({ key:'email', icon:'✉️', label:'Email Support', href:`mailto:${email}?subject=${encodeURIComponent('Prettycrafted Support Request')}`, toast:'Opening your email app…' })
  }
  if (contact?.whatsappEnabled && contact?.whatsappNumber) {
    channels.push({ key:'whatsapp', icon:'💬', label:'WhatsApp Support', href:`https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent('Hi! I need help with my order.')}`, external:true, toast:'Opening WhatsApp…' })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ width:'100%', borderRadius:16, overflow:'hidden', border:'none', cursor:'pointer', display:'block', background:'none', padding:0 }}>
        <div style={{ background:'linear-gradient(110deg,#B5451B 0%,#E8703A 45%,#F4A25B 100%)', padding:'18px 20px', display:'flex', alignItems:'center', gap:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
          <div style={{ position:'absolute', bottom:-20, right:60, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
          <div style={{ background:'rgba(255,255,255,0.18)', borderRadius:12, padding:'10px 12px', flexShrink:0, backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'white', textAlign:'center', letterSpacing:'0.04em', lineHeight:1.3 }}>NEED<br/>HELP?</div>
          </div>
          <div style={{ flex:1, textAlign:'left' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'white', letterSpacing:'0.01em', lineHeight:1.2, textShadow:'0 1px 4px rgba(0,0,0,0.15)' }}>Need Help? Contact Us</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.88)', marginTop:4, fontWeight:500 }}>Get support for orders, returns,</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.88)', fontWeight:500 }}>payments, or any questions.</div>
          </div>
        </div>
      </button>

      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:1250, background:'rgba(44,26,14,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxWidth:420, background:'white', borderRadius:'20px 20px 0 0', padding:'10px 20px 28px', animation:'uaSlideUp 0.25s cubic-bezier(.2,.9,.3,1)' }}>
            <div style={{ width:36, height:4, borderRadius:99, background:'#EDE4D8', margin:'8px auto 16px' }} />
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#2C1A0E', marginBottom:4 }}>Need Help?</div>
            <div style={{ fontSize:13, color:'#9C7A63', marginBottom:18 }}>Choose how you'd like to reach us</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {channels.map(ch => (
                <a key={ch.key} href={ch.href}
                  {...(ch.external ? { target:'_blank', rel:'noreferrer' } : {})}
                  onClick={() => { onToast?.(ch.toast); setOpen(false) }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, border:'1.5px solid #EDE4D8', textDecoration:'none', background:'#FDF8F4' }}>
                  <span style={{ fontSize:20 }}>{ch.icon}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:'#2C1A0E' }}>{ch.label}</span>
                  <span style={{ marginLeft:'auto' }}><IconChevR /></span>
                </a>
              ))}
            </div>
            <button onClick={() => setOpen(false)}
              style={{ width:'100%', marginTop:16, padding:'13px', borderRadius:99, border:'1.5px solid #EDE4D8', background:'white', color:'#6B4F3A', fontWeight:700, fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── PROMO BANNERS ─────────────────────────────────────────────────

function DailyBanner({ onClick }) {
  return (
    <button onClick={onClick} style={{ width:'100%', borderRadius:16, overflow:'hidden', border:'none', cursor:'pointer', display:'block', background:'none', padding:0 }}>
      <div style={{ background:'linear-gradient(110deg,#E8A040 0%,#F5C26B 100%)', padding:'16px 18px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🎁</div>
        <div style={{ textAlign:'left' }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#3D1F00', lineHeight:1.2 }}>Daily Craft Picks!</div>
          <div style={{ fontSize:12, color:'#7A4010', marginTop:2, fontWeight:500 }}>Win gift vouchers up to ₹500 today</div>
        </div>
        <div style={{ marginLeft:'auto', color:'rgba(61,31,0,0.5)' }}><IconChevR /></div>
      </div>
    </button>
  )
}

// ── HELP CENTER PAGE ──────────────────────────────────────────────
// Categories deep-link to the relevant account view; FAQs are loaded live from
// the admin-managed CMS (/api/public/faqs) and rendered as an interactive accordion.
function HelpCenterPage({ onToast, onNavigate }) {
  const categories = [
    { label:'Account',                bg:'#FDECEA', color:'#C0444A', to:'profile', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { label:'Returns &\nExchanges',   bg:'#F5EEE6', color:'#6B4F3A', to:'returns', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg> },
    { label:'Offers',                 bg:'#FEF5E4', color:'#B07B2A', to:'offers', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="15" x2="15.01" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg> },
    { label:'Payments',               bg:'#E4F5F0', color:'#2A7A6A', to:'orders', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { label:'Cancellations &\nCharges', bg:'#FDECEA', color:'#C0444A', to:'orders', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  ]

  const [faqs, setFaqs] = useState(null)   // null = loading
  const [openId, setOpenId] = useState(null)
  const [contact, setContact] = useState(null)

  useEffect(() => {
    faqApi.list()
      .then(({ data }) => setFaqs(data || []))
      .catch(() => setFaqs([]))
    contactApi.get()
      .then(({ data }) => setContact(data))
      .catch(() => setContact(null))
  }, [])

  // Build the list of enabled support channels from the CMS config (email fallback).
  const channels = []
  if (contact?.emailEnabled !== false && (contact?.supportEmail || !contact)) {
    const email = contact?.supportEmail || SUPPORT_EMAIL
    channels.push({ key: 'email', label: 'Email', href: `mailto:${email}?subject=${encodeURIComponent('Help Center support request')}`, toast: 'Opening your email app…' })
  }
  if (contact?.whatsappEnabled && contact?.whatsappNumber) {
    channels.push({ key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent('Hi, I need help with my order')}`, external: true, toast: 'Opening WhatsApp…' })
  }
  if (contact?.phoneEnabled && contact?.phoneNumber) {
    channels.push({ key: 'phone', label: 'Call', href: `tel:${contact.phoneNumber.replace(/[^\d+]/g, '')}`, toast: 'Calling support…' })
  }

  const go = (to) => { if (to) onNavigate?.(to) }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Category cards — 2-up; the trailing odd card spans the row so there are no gaps */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:8 }}>
        {categories.map((cat, i) => {
          const spanFull = categories.length % 2 === 1 && i === categories.length - 1
          return (
            <button key={i} onClick={() => go(cat.to)}
              style={{ gridColumn: spanFull ? '1 / -1' : 'auto', display:'flex', alignItems:'center', gap:14, padding:'18px 16px', borderRadius:14, border:'1.5px solid #EDE4D8', background:'white', cursor:'pointer', textAlign:'left', transition:'box-shadow 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.09)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:cat.bg, display:'flex', alignItems:'center', justifyContent:'center', color:cat.color, flexShrink:0 }}>{cat.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#2C1A0E', lineHeight:1.35, whiteSpace:'pre-line' }}>{cat.label}</div>
            </button>
          )
        })}
      </div>

      {/* FAQ accordion — live from the CMS */}
      <div style={{ height:8, background:'#F0EBE4', margin:'6px -16px 0' }} />
      <div style={{ background:'white', margin:'0 -16px', padding:'4px 16px' }}>
        {faqs === null ? (
          <div style={{ padding:'28px 0', textAlign:'center', color:'#9C7A63', fontSize:13 }}>
            <div style={{ width:26, height:26, border:'3px solid #EDE4D8', borderTopColor:TC, borderRadius:'50%', margin:'0 auto 10px', animation:'uaSpin 0.8s linear infinite' }} />
            Loading FAQs…
          </div>
        ) : faqs.length === 0 ? (
          <div style={{ padding:'24px 0', color:'#9C7A63', fontSize:13 }}>No FAQs available right now.</div>
        ) : faqs.map((f, i) => {
          const open = openId === f.id
          return (
            <div key={f.id} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #EDE4D8' : 'none' }}>
              <button onClick={() => setOpenId(open ? null : f.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'17px 0', border:'none', background:'transparent', cursor:'pointer', textAlign:'left', gap:12 }}>
                <span style={{ fontSize:14, color:'#2C1A0E', lineHeight:1.4, fontWeight: open ? 700 : 400 }}>{f.question}</span>
                <span style={{ flexShrink:0, color:'#9C7A63', transform: open ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}><IconChevR /></span>
              </button>
              {open && (
                <div style={{ padding:'0 0 17px', fontSize:13.5, color:'#6B4F3A', lineHeight:1.65, whiteSpace:'pre-line', animation:'uaUp 0.2s ease' }}>
                  {f.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Recent Queries — wired to the support-ticket service in a later phase */}
      <div style={{ height:8, background:'#F0EBE4', margin:'0 -16px' }} />
      <div style={{ padding:'20px 0 8px' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#2C1A0E', marginBottom:10 }}>Recent Queries</div>
        <div style={{ fontSize:13, color:'#9C7A63', lineHeight:1.6 }}>You haven’t raised any support requests yet.</div>
      </div>

      {/* Contact — opens whichever support channels the admin has enabled */}
      <div style={{ marginTop:8, padding:'16px', borderRadius:14, border:'1.5px solid #EDE4D8', background:'#FDF8F4' }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#2C1A0E', marginBottom:2 }}>Still need help?</div>
          <div style={{ fontSize:12, color:'#9C7A63' }}>
            {contact?.hours ? `We’re available ${contact.hours}` : 'Reach our support team'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {channels.map(ch => (
            <a key={ch.key} href={ch.href}
              {...(ch.external ? { target:'_blank', rel:'noreferrer' } : {})}
              onClick={() => onToast(ch.toast)}
              style={{ flex:'1 1 auto', textAlign:'center', minWidth:96, padding:'10px 16px', borderRadius:99, border:'none', background: ch.key === 'whatsapp' ? '#25D366' : TC, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', textDecoration:'none' }}>
              {ch.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── OFFERS PAGE ───────────────────────────────────────────────────
// Live active coupons / promotions from /api/public/promotions, with eligibility.
function OffersPage({ onToast }) {
  const [offers, setOffers] = useState(null)

  useEffect(() => {
    promotionsApi.list()
      .then(({ data }) => setOffers(data || []))
      .catch(() => setOffers([]))
  }, [])

  const copy = (code) => {
    try { navigator.clipboard?.writeText(code) } catch { /* ignore */ }
    onToast(`Copied ${code}`)
  }

  if (offers === null) return (
    <div style={{ textAlign:'center', padding:'48px', color:'#9C7A63' }}>
      <div style={{ width:32, height:32, border:'3px solid #EDE4D8', borderTopColor:TC, borderRadius:'50%', margin:'0 auto 12px', animation:'uaSpin 0.8s linear infinite' }} />
      Loading offers…
    </div>
  )

  if (offers.length === 0) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:44, marginBottom:14 }}>🏷️</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, marginBottom:6 }}>No active offers</div>
      <div style={{ fontSize:13, color:'#9C7A63' }}>Check back soon for new coupons and promotions</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {offers.map(o => {
        const left = o.maxUses != null ? Math.max(0, o.maxUses - (o.uses || 0)) : null
        return (
          <div key={o.id} style={{ background:'white', borderRadius:16, padding:'16px 18px', border:'1px solid #EDE4D8', boxShadow:'0 1px 4px rgba(44,26,14,0.04)', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:50, height:50, borderRadius:12, background:'#FDF1EA', color:TC, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:800, fontSize:15 }}>
              {o.discountPercent != null ? `${o.discountPercent}%` : '%'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, color:'#2C1A0E', fontSize:14, marginBottom:3 }}>{o.disc || `${o.discountPercent}% off`}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11.5, fontWeight:700, color:TC, letterSpacing:'0.08em', background:'#FAF7F2', border:'1px dashed #D9CBBF', borderRadius:7, padding:'3px 9px' }}>{o.code}</span>
                {o.expires && <span style={{ fontSize:11, color:'#9C7A63' }}>Expires {o.expires}</span>}
                {left != null && <span style={{ fontSize:11, color:'#9C7A63' }}>{left} left</span>}
              </div>
            </div>
            <button onClick={() => copy(o.code)} style={{ padding:'8px 14px', borderRadius:99, border:'none', background:TC, color:'white', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>Copy</button>
          </div>
        )
      })}
    </div>
  )
}

// ── RETURNS & EXCHANGES PAGE ──────────────────────────────────────
// Lists delivered orders/items eligible for a return or exchange, runs the
// submit workflow (type → reason → optional photos), and tracks request status.
const RETURN_REASONS = ['Damaged or defective', 'Wrong item received', 'Not as described', 'Size or fit issue', 'Changed my mind', 'Other']
const RET_STATUS = {
  PENDING:   { bg:'#FEF3E2', color:'#B07B2A', label:'Pending' },
  APPROVED:  { bg:'#EAF3E6', color:'#3F7A2E', label:'Approved' },
  REJECTED:  { bg:'#FDECEA', color:'#C0444A', label:'Rejected' },
  COMPLETED: { bg:'#E4F0EC', color:'#2A7A6A', label:'Completed' },
}

function RetBadge({ status }) {
  const s = RET_STATUS[status] || RET_STATUS.PENDING
  return <span style={{ fontSize:10, fontWeight:700, color:s.color, background:s.bg, padding:'3px 10px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</span>
}

function ReturnsPage({ onToast }) {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [requests, setRequests] = useState([])
  const [refresh, setRefresh] = useState(0)

  // Submit-form state (set when an item is selected)
  const [selected, setSelected] = useState(null) // { order, item }
  const [type, setType] = useState('RETURN')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([
      ordersApi.list({ size: 50, sort: 'createdAt,desc' }).then(({ data }) => data?.content || []).catch(() => []),
      returnsApi.listMine().then(({ data }) => data || []).catch(() => []),
    ]).then(([os, rs]) => {
      if (!alive) return
      setOrders(os.filter(o => o.status === 'DELIVERED'))
      setRequests(rs)
    }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [refresh])

  const openItemIds = new Set(requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED').map(r => r.orderItemId))

  const startRequest = (order, item) => {
    setSelected({ order, item }); setType('RETURN'); setReason(''); setDetails(''); setImages([])
  }

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    try {
      for (const f of files) {
        if (images.length >= 6) break
        const { data } = await returnsApi.upload(f)
        setImages(prev => prev.length < 6 ? [...prev, data.url] : prev)
      }
    } catch { onToast('Image upload failed') }
    finally { setUploading(false) }
  }

  const submit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      await returnsApi.create({ orderId: selected.order.id, orderItemId: selected.item.id, type, reason, details: details.trim() || null, images })
      onToast('Request submitted')
      setSelected(null)
      setLoading(true)
      setRefresh(n => n + 1)
    } catch (e) {
      onToast(e.response?.data?.message || 'Could not submit request')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:'48px', color:'#9C7A63' }}>
      <div style={{ width:32, height:32, border:'3px solid #EDE4D8', borderTopColor:TC, borderRadius:'50%', margin:'0 auto 12px', animation:'uaSpin 0.8s linear infinite' }} />
      Loading…
    </div>
  )

  // ── Submit form ──
  if (selected) {
    const { item } = selected
    const pill = (active) => ({ flex:1, padding:'11px 0', borderRadius:12, border:`1.5px solid ${active ? TC : '#EDE4D8'}`, background: active ? TC : 'white', color: active ? 'white' : '#6B4F3A', fontSize:13, fontWeight:700, cursor:'pointer' })
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <button onClick={() => setSelected(null)} style={{ alignSelf:'flex-start', background:'none', border:'none', color:TC, fontSize:13, fontWeight:700, cursor:'pointer', padding:0 }}>← Back</button>

        <div style={{ background:'white', borderRadius:14, padding:'14px 16px', border:'1px solid #EDE4D8' }}>
          <div style={{ fontSize:11, color:'#9C7A63', fontWeight:600, marginBottom:3 }}>Order #{selected.order.id}</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:'#2C1A0E' }}>{item.itemName}</div>
        </div>

        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#2C1A0E', marginBottom:8 }}>What would you like to do?</div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setType('RETURN')} style={pill(type === 'RETURN')}>Return</button>
            <button onClick={() => setType('EXCHANGE')} style={pill(type === 'EXCHANGE')}>Exchange</button>
          </div>
        </div>

        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#2C1A0E', marginBottom:8 }}>Reason</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {RETURN_REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${reason === r ? TC : '#EDE4D8'}`, background: reason === r ? '#FDF1EA' : 'white', cursor:'pointer', textAlign:'left' }}>
                <span style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${reason === r ? TC : '#CCBFB5'}`, background: reason === r ? TC : 'white', flexShrink:0, boxShadow: reason === r ? 'inset 0 0 0 2px white' : 'none' }} />
                <span style={{ fontSize:13, color:'#2C1A0E', fontWeight: reason === r ? 700 : 500 }}>{r}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#2C1A0E', marginBottom:8 }}>Details <span style={{ color:'#9C7A63', fontWeight:500 }}>(optional)</span></div>
          <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} placeholder="Tell us a little more…"
            style={{ width:'100%', padding:'11px 13px', borderRadius:12, border:'1.5px solid #EDE4D8', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', color:'#2C1A0E', resize:'vertical', lineHeight:1.5, boxSizing:'border-box' }} />
        </div>

        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#2C1A0E', marginBottom:8 }}>Photos <span style={{ color:'#9C7A63', fontWeight:500 }}>(optional, up to 6)</span></div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {images.map((src, i) => (
              <div key={i} style={{ position:'relative' }}>
                <img src={src} alt={`evidence ${i + 1}`} style={{ width:60, height:60, objectFit:'cover', borderRadius:10, border:'1px solid #EDE4D8' }} />
                <button onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', border:'none', background:'#2C1A0E', color:'white', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              </div>
            ))}
            {images.length < 6 && (
              <label style={{ width:60, height:60, borderRadius:10, border:'1.5px dashed #CCBFB5', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#9C7A63', fontSize:22, background:'#FDFAF7' }}>
                {uploading ? '…' : '+'}
                <input type="file" accept="image/*" multiple onChange={onUpload} style={{ display:'none' }} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <button onClick={submit} disabled={!reason || submitting || uploading}
          style={{ width:'100%', padding:14, borderRadius:99, border:'none', background:(!reason || submitting || uploading) ? '#EDE4D8' : TC, color:(!reason || submitting || uploading) ? '#9C7A63' : 'white', fontWeight:700, fontSize:14, cursor:(!reason || submitting || uploading) ? 'default' : 'pointer' }}>
          {submitting ? 'Submitting…' : `Submit ${type === 'EXCHANGE' ? 'Exchange' : 'Return'} Request`}
        </button>
      </div>
    )
  }

  // ── List view: existing requests + eligible items ──
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {requests.length > 0 && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#2C1A0E', marginBottom:10 }}>Your Requests</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {requests.map(r => (
              <div key={r.id} style={{ background:'white', borderRadius:14, padding:'14px 16px', border:'1px solid #EDE4D8' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:5 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#6B4F3A', background:'#F5EEE6', padding:'2px 9px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>{r.type}</span>
                  <RetBadge status={r.status} />
                </div>
                <div style={{ fontSize:13.5, fontWeight:600, color:'#2C1A0E', marginBottom:2 }}>{r.itemName}</div>
                <div style={{ fontSize:12, color:'#9C7A63' }}>Order #{r.orderId} · {r.reason} · {fmtDate(r.createdAt)}</div>
                {r.adminNote && <div style={{ fontSize:12, color:'#6B4F3A', background:'#FBF7F2', borderRadius:10, padding:'8px 11px', marginTop:8 }}><strong>Update:</strong> {r.adminNote}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize:15, fontWeight:700, color:'#2C1A0E', marginBottom:4 }}>Eligible Items</div>
        <div style={{ fontSize:12.5, color:'#9C7A63', marginBottom:12 }}>Returns &amp; exchanges are available on delivered orders.</div>
        {orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', background:'white', borderRadius:14, border:'1px solid #EDE4D8' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📦</div>
            <div style={{ fontSize:14, fontWeight:600, color:'#2C1A0E', marginBottom:4 }}>No delivered orders yet</div>
            <div style={{ fontSize:12.5, color:'#9C7A63' }}>Items become eligible once your order is delivered</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {orders.map(order => (
              <div key={order.id} style={{ background:'white', borderRadius:14, padding:'14px 16px', border:'1px solid #EDE4D8' }}>
                <div style={{ fontSize:11, color:'#9C7A63', fontWeight:600, marginBottom:10 }}>Order #{order.id} · {fmtDate(order.createdAt)}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {(order.items || []).map(item => {
                    const requested = openItemIds.has(item.id)
                    return (
                      <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#2C1A0E', lineHeight:1.3 }}>{item.itemName}</div>
                          {item.quantity > 1 && <div style={{ fontSize:11, color:'#9C7A63' }}>Qty {item.quantity}</div>}
                        </div>
                        {requested ? (
                          <span style={{ fontSize:11, fontWeight:700, color:'#9C7A63', whiteSpace:'nowrap' }}>Requested</span>
                        ) : (
                          <button onClick={() => startRequest(order, item)} style={{ padding:'7px 14px', borderRadius:99, border:`1.5px solid ${TC}`, background:'white', color:TC, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>Return / Exchange</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ORDERS PAGE ───────────────────────────────────────────────────
function OrdersPage({ onToast }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    ordersApi.list({ size: 20, sort: 'createdAt,desc' })
      .then(({ data }) => setOrders(data?.content || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toTimelineStatus = (s) => {
    if (s === 'DELIVERED') return 'delivered'
    if (s === 'SHIPPED') return 'shipped'
    if (s === 'PROCESSING' || s === 'PAID') return 'processing'
    return 'placed'
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:'48px', color:'#9C7A63' }}>
      <div style={{ width:32, height:32, border:'3px solid #EDE4D8', borderTopColor:TC, borderRadius:'50%', margin:'0 auto 12px', animation:'uaSpin 0.8s linear infinite' }} />
      Loading orders…
    </div>
  )

  if (orders.length === 0) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📦</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, marginBottom:8 }}>No orders yet</div>
      <div style={{ fontSize:14, color:'#9C7A63' }}>Your orders will appear here once you place one</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {orders.map((order) => {
        const statusLower = (order.status || '').toLowerCase()
        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—'
        return (
          <div key={order.id} style={{ background:'white', borderRadius:16, padding:'18px 20px', border:'1px solid #EDE4D8', boxShadow:'0 1px 4px rgba(44,26,14,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontWeight:700, color:TC, fontSize:13 }}>#{order.id}</span>
                  <UABadge status={statusLower} />
                </div>
                <div style={{ fontSize:12, color:'#9C7A63' }}>{dateStr}</div>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700 }}>
                ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
              {(order.items || []).map((item, j) => (
                <div key={j} style={{ display:'flex', alignItems:'center', gap:5, background:'#FAF7F2', padding:'5px 11px', borderRadius:99, fontSize:12, color:'#6B4F3A', fontWeight:500 }}>
                  <span>{item.itemName}</span>
                  {item.quantity > 1 && <span style={{ color:'#9C7A63' }}>×{item.quantity}</span>}
                </div>
              ))}
            </div>
            {order.status !== 'CANCELLED' && (
              <OrderTimeline status={toTimelineStatus(order.status)} />
            )}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={() => { dispatch(closeUserAccount()); navigate(`/orders/${order.id}`) }} style={{ padding:'7px 16px', borderRadius:99, border:'1.5px solid #EDE4D8', background:'white', color:'#6B4F3A', fontSize:12, fontWeight:600, cursor:'pointer' }}>View Details</button>
              <button onClick={() => onToast('Added to cart')} style={{ padding:'7px 16px', borderRadius:99, border:'none', background:TC, color:'white', fontSize:12, fontWeight:600, cursor:'pointer' }}>Reorder</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── WISHLIST PAGE ─────────────────────────────────────────────────
function WishlistPage({ onToast }) {
  const dispatch = useDispatch()
  const wishlistIds = useSelector(selectWishlistIds)
  const products = useSelector(selectProducts)
  const wishlisted = products.filter(p => wishlistIds.includes(wishlistKey(p)))

  if (wishlisted.length === 0) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>♡</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, marginBottom:6 }}>Your wishlist is empty</div>
      <div style={{ fontSize:13, color:'#9C7A63' }}>Save products you love while browsing</div>
    </div>
  )

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      {wishlisted.map(p => (
        <div key={p.id} style={{ background:'white', borderRadius:16, overflow:'hidden', border:'1px solid #EDE4D8' }}>
          <div style={{ height:120, background:p.bg || '#EDE4D8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, position:'relative' }}>
            <button onClick={() => { dispatch(toggleWishlist(wishlistKey(p))); onToast('Removed from wishlist') }} style={{ position:'absolute', top:6, right:6, background:'rgba(255,255,255,0.9)', border:'none', borderRadius:'50%', width:26, height:26, cursor:'pointer', fontSize:13, color:'#A02A2A', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            {p.emoji}
          </div>
          <div style={{ padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:'#9C7A63', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{p.category}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:600, color:'#2C1A0E', marginBottom:8, lineHeight:1.3 }}>{p.name}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, color:TC, fontSize:14 }}>₹{Number(p.price || 0).toLocaleString('en-IN')}</span>
              <button onClick={() => { dispatch(addLocal(p)); onToast('Added to cart') }} style={{ padding:'5px 11px', borderRadius:99, border:'none', background:TC, color:'white', fontSize:11, fontWeight:700, cursor:'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ADDRESSES PAGE ────────────────────────────────────────────────
const BLANK_ADDR = { label:'', recipientName:'', phone:'', line1:'', line2:'', city:'', state:'', zip:'', country:'India', isDefault:false }

const addrInputSt = { width:'100%', padding:'10px 13px', borderRadius:11, border:'1.5px solid #EDE4D8', fontSize:13, fontFamily:"'DM Sans',sans-serif", background:'white', color:'#2C1A0E', outline:'none', transition:'border-color 0.2s' }

function AddressForm({ initial, user, onCancel, onSaved, onToast }) {
  const [form, setForm] = useState({ ...BLANK_ADDR, recipientName: user?.name || '', ...(initial || {}) })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.recipientName.trim() && form.phone.trim() && form.line1.trim() && form.city.trim() && form.zip.trim()
  const editing = Boolean(initial?.id)

  const save = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      const payload = {
        label: form.label.trim() || undefined,
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim() || undefined,
        zip: form.zip.trim(),
        country: form.country.trim() || 'India',
        isDefault: form.isDefault,
      }
      if (editing) await addressApi.update(initial.id, payload)
      else await addressApi.create(payload)
      onToast(editing ? 'Address updated' : 'Address saved')
      onSaved()
    } catch {
      onToast('Save failed — please try again')
      setSaving(false)
    }
  }

  const field = (k, label, ph) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</label>
      <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph} style={addrInputSt}
        onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = '#EDE4D8'} />
    </div>
  )

  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()}
      style={{ position:'fixed', inset:0, zIndex:1300, background:'rgba(44,26,14,0.4)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#FAF7F2', borderRadius:24, padding:'26px', width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(44,26,14,0.18)' }} className="ua-no-scrollbar">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700 }}>{editing ? 'Edit Address' : 'New Address'}</div>
          <button onClick={onCancel} style={{ background:'#F5EEE6', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B4F3A', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
        {field('label', 'Label (Home / Office)', 'Home')}
        {field('recipientName', 'Full Name *', 'Jane Doe')}
        {field('phone', 'Phone *', '+91 98765 43210')}
        {field('line1', 'Address Line 1 *', '123 Main Street')}
        {field('line2', 'Address Line 2', 'Apt, Suite (optional)')}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {field('city', 'City *', 'Mumbai')}
          {field('state', 'State', 'Maharashtra')}
        </div>
        {field('zip', 'Pincode *', '400001')}
        <label style={{ display:'flex', alignItems:'center', gap:9, margin:'4px 0 16px', cursor:'pointer', fontSize:13, color:'#6B4F3A', fontWeight:500 }}>
          <input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} style={{ accentColor:TC, width:16, height:16 }} />
          Set as default address
        </label>
        <button onClick={save} disabled={!valid || saving}
          style={{ width:'100%', padding:'13px', borderRadius:99, border:'none', background: !valid || saving ? '#EDE4D8' : TC, color: !valid || saving ? '#9C7A63' : 'white', fontWeight:700, fontSize:14, cursor: !valid || saving ? 'default' : 'pointer' }}>
          {saving ? 'Saving…' : editing ? 'Update Address' : 'Save Address'}
        </button>
      </div>
    </div>
  )
}

function AddressesPage({ onToast }) {
  const user = useSelector(selectUser)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // address being edited, or {} for new, or null when closed

  const load = () => {
    setLoading(true)
    addressApi.list()
      .then(({ data }) => setAddresses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  // Initial fetch — inlined (not via load()) so we don't call setState
  // synchronously inside the effect; `loading` already starts true.
  useEffect(() => {
    let cancelled = false
    addressApi.list()
      .then(({ data }) => { if (!cancelled) setAddresses(Array.isArray(data) ? data : []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const onSaved = () => { setEditing(null); load() }

  const setDefault = async (id) => {
    try { await addressApi.setDefault(id); onToast('Default address set'); load() }
    catch { onToast('Could not update — please try again') }
  }
  const remove = async (id) => {
    try { await addressApi.remove(id); onToast('Address removed'); load() }
    catch { onToast('Could not remove — please try again') }
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:'48px', color:'#9C7A63' }}>
      <div style={{ width:32, height:32, border:'3px solid #EDE4D8', borderTopColor:TC, borderRadius:'50%', margin:'0 auto 12px', animation:'uaSpin 0.8s linear infinite' }} />
      Loading addresses…
    </div>
  )

  return (
    <div>
      {addresses.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 20px 28px' }}>
          <div style={{ fontSize:44, marginBottom:14 }}>📍</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, marginBottom:6 }}>No saved addresses</div>
          <div style={{ fontSize:13, color:'#9C7A63' }}>Add one to check out faster next time</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:18 }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{ background:'white', borderRadius:16, padding:'16px 18px', border:`1.5px solid ${addr.isDefault ? TC : '#EDE4D8'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'#2C1A0E' }}>{addr.label || 'Address'}</span>
                    {addr.isDefault && <span style={{ fontSize:10, fontWeight:700, color:TC, background:'#FDF6F1', padding:'2px 8px', borderRadius:99 }}>Default</span>}
                  </div>
                  <div style={{ fontSize:12, color:'#6B4F3A', lineHeight:1.7 }}>
                    {addr.recipientName}{addr.phone ? ` · ${addr.phone}` : ''}<br/>
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br/>
                    {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip}, {addr.country}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                  <button onClick={() => setEditing(addr)} style={{ padding:'5px 12px', borderRadius:99, border:'1.5px solid #EDE4D8', background:'white', color:'#6B4F3A', fontSize:11, fontWeight:600, cursor:'pointer' }}>Edit</button>
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)}
                      style={{ padding:'5px 12px', borderRadius:99, border:'none', background:'#F5EEE6', color:TC, fontSize:11, fontWeight:600, cursor:'pointer' }}>Set Default</button>
                  )}
                  <button onClick={() => remove(addr.id)} style={{ padding:'5px 12px', borderRadius:99, border:'1.5px solid #F3D9D9', background:'white', color:'#C44A4A', fontSize:11, fontWeight:600, cursor:'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setEditing({})}
        style={{ width:'100%', marginTop: addresses.length === 0 ? 8 : 0, padding:'13px', borderRadius:99, border:'2px dashed #D9CBBF', background:'white', color:'#9C7A63', fontWeight:600, fontSize:13, cursor:'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = TC; e.currentTarget.style.color = TC }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#D9CBBF'; e.currentTarget.style.color = '#9C7A63' }}>
        + Add New Address
      </button>
      {editing && (
        <AddressForm
          initial={editing.id ? editing : null}
          user={user}
          onCancel={() => setEditing(null)}
          onSaved={onSaved}
          onToast={onToast}
        />
      )}
    </div>
  )
}

// ── PROFILE EDIT PAGE ─────────────────────────────────────────────
function ProfileEditPage({ user, onToast }) {
  const dispatch = useDispatch()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)
  const inp = { width:'100%', padding:'11px 14px', borderRadius:12, border:'1.5px solid #EDE4D8', fontSize:13, fontFamily:"'DM Sans',sans-serif", background:'white', color:'#2C1A0E', outline:'none', transition:'border-color 0.2s' }

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await authApi.updateMe({ name: name.trim(), phone: phone.trim() || undefined })
      dispatch(setUser(data))
      onToast('Profile updated')
    } catch {
      onToast('Save failed — please try again')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ background:'white', borderRadius:16, padding:'20px', border:'1px solid #EDE4D8', marginBottom:16 }}>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inp}
            onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = '#EDE4D8'} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Email Address</label>
          <input value={user?.email || ''} disabled style={{ ...inp, background:'#F9F6F2', color:'#9C7A63', cursor:'not-allowed' }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" style={inp}
            onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = '#EDE4D8'} />
        </div>
        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'13px', borderRadius:99, border:'none', background: saving ? '#EDE4D8' : TC, color: saving ? '#9C7A63' : 'white', fontWeight:700, fontSize:14, cursor: saving ? 'default' : 'pointer', transition:'background 0.3s' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ── MOBILE PROFILE HOME ───────────────────────────────────────────
const LEGAL_LINKS = [
  { label: 'Terms of Service',            to: '/terms' },
  { label: 'Privacy Policy',              to: '/privacy' },
  { label: 'Return & Refund Policy',      to: '/return-refund-policy' },
  { label: 'Shipping & Delivery Policy',  to: '/shipping-delivery-policy' },
  { label: 'Cancellation Policy',         to: '/cancellation-policy' },
  { label: 'Cookie Policy & Settings',    to: '/cookie-policy' },
  { label: 'Payment Terms',               to: '/payment-terms' },
  { label: 'Contact & Customer Support',  to: '/contact-support' },
]

function MobileProfilePage({ user, onClose, onNavigate, onToast, onLogout, onAdmin, onLegalNav }) {
  const name = user?.name || 'Guest'
  const email = user?.email || ''
  const initial = name.charAt(0).toUpperCase()

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F5F2EE' }}>

      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'white', flexShrink:0, borderBottom:'1px solid #EDE8E0' }}>
        <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', padding:'4px 0', minWidth:40, minHeight:40, justifyContent:'flex-start' }}>
          <IconBack />
        </button>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:'#2C1A0E', letterSpacing:'-0.01em' }}>My Profile</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => onToast('Account Balance: ₹0')} style={{ display:'flex', alignItems:'center', gap:5, background:'#F0FBF2', border:'none', borderRadius:99, padding:'6px 11px', cursor:'pointer' }}>
            <span style={{ fontSize:14 }}>🟢</span>
            <span style={{ fontSize:12, fontWeight:700, color:'#2A7A3B' }}>₹0</span>
          </button>
          <button onClick={() => onNavigate('help')} style={{ display:'flex', alignItems:'center', gap:5, background:'#F5F2EE', border:'none', borderRadius:99, padding:'6px 11px', cursor:'pointer' }}>
            <IconHelp />
            <span style={{ fontSize:12, fontWeight:600, color:'#6B4F3A' }}>Help</span>
          </button>
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:40 }} className="ua-no-scrollbar">

        {/* HERO */}
        <div style={{ background:'linear-gradient(160deg,#F0EAE0 0%,#EDE4D8 60%,#E8D8C8 100%)', padding:'28px 20px 24px', textAlign:'center', position:'relative' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,rgba(196,112,74,0.08) 1px,transparent 1px)', backgroundSize:'18px 18px', pointerEvents:'none' }} />
          {/* Avatar with + button */}
          <div style={{ position:'relative', display:'inline-block', marginBottom:14 }}>
            <div style={{ width:76, height:76, borderRadius:'50%', background:'linear-gradient(135deg,#C4704A 0%,#A85A38 100%)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', boxShadow:'0 6px 20px rgba(196,112,74,0.35)' }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700, color:'white' }}>{initial}</span>
            </div>
            <button onClick={() => onToast('Edit photo coming soon')} style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:'white', border:`2px solid ${TC}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:TC, fontWeight:700, lineHeight:1 }}>+</button>
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#2C1A0E', marginBottom:14 }}>{name}</div>
          {/* Membership badges */}
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => onToast('Artisan Member perks!')} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:99, border:'1.5px solid rgba(196,112,74,0.3)', background:'rgba(255,255,255,0.72)', cursor:'pointer', backdropFilter:'blur(4px)' }}>
              <span style={{ fontSize:13 }}>🤲</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#6B4F3A', letterSpacing:'0.02em' }}>Artisan Member</span>
              <IconChevR />
            </button>
            <button onClick={() => onToast('Gift Club perks!')} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:99, border:'1.5px solid rgba(122,154,107,0.3)', background:'rgba(255,255,255,0.72)', cursor:'pointer', backdropFilter:'blur(4px)' }}>
              <span style={{ fontSize:13 }}>🎁</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#4A7A3B', letterSpacing:'0.02em' }}>Gift Club Select</span>
              <IconChevR />
            </button>
            {onAdmin && (
              <button onClick={onAdmin}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:99, border:'1.5px solid rgba(44,26,14,0.25)', background:'rgba(44,26,14,0.82)', cursor:'pointer', backdropFilter:'blur(4px)', transition:'all 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(44,26,14,0.95)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(44,26,14,0.82)'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.04em' }}>Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* QUICK LINKS */}
        <div style={{ margin:'14px 14px 0', background:'white', borderRadius:16, padding:'0 18px', border:'1px solid #EDE8E0', overflow:'hidden' }}>
          <ProfileRow icon={<IconBag />}   label="My Orders"   sub="Track, return or reorder"       onClick={() => onNavigate('orders')} />
          <ProfileRow icon={<IconHeart />} label="Wishlist"    sub="Your saved items"                onClick={() => onNavigate('wishlist')} />
          <ProfileRow icon={<IconCard />}  label="Get 10% off your next gift" sub="Exclusive member offer" onClick={() => onToast('Offer applied!')} noBorder />
        </div>

        {/* SUPPORT CARD */}
        <div style={{ margin:'14px 14px 0' }}>
          <SupportCard onToast={onToast} />
        </div>

        {/* REWARDS & COUPONS */}
        <div style={{ margin:'14px 14px 0', background:'white', borderRadius:16, padding:'16px 18px', border:'1px solid #EDE8E0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ color:'#6B4F3A' }}><IconGift /></div>
            <span style={{ fontSize:14, fontWeight:700, color:'#2C1A0E' }}>Rewards & Coupons</span>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
            <RewardChip icon="🟢" label="Account Balance" onClick={() => onToast('Account Balance: ₹0')} />
            <RewardChip icon="⭐" label="Gift Points"      onClick={() => onToast('Gift Points: 0')} />
            <RewardChip icon="🎫" label="Coupons"          onClick={() => onToast('No coupons yet')} />
            <RewardChip icon="🥇" label="My Prizes"        onClick={() => onToast('No prizes yet')} />
          </div>
          <div style={{ height:1, background:'#F0EBE4', margin:'4px 0 0' }} />
          <ProfileRow icon={<IconGift />} label="Gift Cards" sub="Buy or redeem gift cards" onClick={() => onToast('Gift cards coming soon')} noBorder />
        </div>

        {/* PAYMENTS & ACCOUNT */}
        <div style={{ margin:'14px 14px 0', background:'white', borderRadius:16, padding:'0 18px', border:'1px solid #EDE8E0' }}>
          <AccordionRow icon={<IconPay />} label="Payments & Credits">
            <div style={{ paddingLeft:32 }}>
              <div style={{ marginBottom:8 }}>💳 Saved cards: none</div>
              <div>🟢 PC Credits balance: ₹0</div>
            </div>
          </AccordionRow>
          <AccordionRow icon={<IconUser />} label="Manage Account & Address" noBorder>
            <div style={{ paddingLeft:32 }}>
              <div style={{ marginBottom:6 }}>👤 {name}</div>
              {email && <div style={{ marginBottom:8 }}>✉️ {email}</div>}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
                <button onClick={() => onNavigate('profile')} style={{ background:'none', border:'none', color:TC, fontWeight:600, fontSize:13, cursor:'pointer', padding:0 }}>Edit Profile →</button>
                <button onClick={() => onNavigate('addresses')} style={{ background:'none', border:'none', color:TC, fontWeight:600, fontSize:13, cursor:'pointer', padding:0 }}>Manage Addresses →</button>
              </div>
            </div>
          </AccordionRow>
        </div>

        {/* DAILY PROMO */}
        <div style={{ margin:'14px 14px 0' }}>
          <DailyBanner onClick={() => onToast('Daily picks loading...')} />
        </div>

        {/* HELP & SETTINGS */}
        <div style={{ margin:'14px 14px 0', background:'white', borderRadius:16, padding:'0 18px', border:'1px solid #EDE8E0' }}>
          <ProfileRow icon={<IconHelp />}     label="Help Centre"              sub="Chat, call or email us"      onClick={() => onNavigate('help')} />
          <ProfileRow icon={<IconStar />}     label="Pretty.Crafted Suggests"  sub="Personalized gift ideas"     onClick={() => onToast('Coming soon')} />
          <ProfileRow icon={<IconSettings />} label="Settings"                 sub="Notifications, privacy"      onClick={() => onToast('Settings coming soon')} />
          <AccordionRow icon={<IconLegal />}  label="Legal & Policies" noBorder>
            <div style={{ paddingLeft:32, display:'flex', flexDirection:'column', gap:10 }}>
              {LEGAL_LINKS.map(l => (
                <button key={l.to} onClick={() => onLegalNav(l.to)} style={{ background:'none', border:'none', color:TC, fontWeight:500, fontSize:13, cursor:'pointer', padding:0, textAlign:'left' }}>{l.label} →</button>
              ))}
            </div>
          </AccordionRow>
        </div>

        {/* LOG OUT */}
        <div style={{ margin:'18px 14px 8px' }}>
          <button onClick={onLogout}
            style={{ width:'100%', padding:'14px', borderRadius:99, border:'1.5px solid #D94040', background:'white', color:'#D94040', fontWeight:700, fontSize:15, cursor:'pointer', letterSpacing:'0.06em', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='#FFF0F0'}
            onMouseLeave={e => e.currentTarget.style.background='white'}>
            LOG OUT
          </button>
        </div>

        {/* VERSION */}
        <div style={{ textAlign:'center', fontSize:11, color:'#BBA898', padding:'8px 0 10px', letterSpacing:'0.04em' }}>
          Pretty.Crafted v1.0
        </div>
      </div>
    </div>
  )
}

// ── MAIN MODAL ────────────────────────────────────────────────────
export default function UserAccountModal() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const ww = useWindowWidth()
  const isMobile = ww < 768
  // The modal is unmounted when closed, so the requested screen (e.g. the /orders
  // route dispatches openUserAccount('orders')) is picked up fresh on every open.
  const initialView = useSelector(selectUI).userAccountView
  const [view, setView] = useState(initialView || 'home')
  const [toast, setToast] = useState(null)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') {
        if (view !== 'home') setView('home')
        else dispatch(closeUserAccount())
      }
    }
    window.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [view, dispatch])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const handleLogout = () => { dispatch(logoutThunk()); dispatch(closeUserAccount()) }

  const subTitles = {
    orders:    'My Orders',
    wishlist:  'Wishlist',
    addresses: 'Addresses',
    help:      'Help Center',
    offers:    'Offers',
    returns:   'Returns & Exchanges',
    profile:   'Edit Profile',
  }

  const subViews = {
    orders:    <OrdersPage    onToast={setToast} />,
    wishlist:  <WishlistPage  onToast={setToast} />,
    addresses: <AddressesPage onToast={setToast} />,
    help:      <HelpCenterPage onToast={setToast} onNavigate={setView} />,
    offers:    <OffersPage    onToast={setToast} />,
    returns:   <ReturnsPage   onToast={setToast} />,
    profile:   <ProfileEditPage user={user} onToast={setToast} />,
  }

  const content = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F5F2EE', overflow:'hidden', borderRadius: isMobile ? 0 : 24 }}>
      {view === 'home' ? (
        <MobileProfilePage
          user={user}
          onClose={() => dispatch(closeUserAccount())}
          onNavigate={setView}
          onToast={setToast}
          onLogout={handleLogout}
          onAdmin={isAdmin ? () => { dispatch(closeUserAccount()); navigate('/admin') } : null}
          onLegalNav={(path) => { dispatch(closeUserAccount()); navigate(path) }}
        />
      ) : (
        <>
          {/* Sub-page header */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background:'white', flexShrink:0, borderBottom:'1px solid #EDE8E0' }}>
            <button onClick={() => setView('home')} style={{ background:'#F5F2EE', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <IconBack />
            </button>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:'#2C1A0E' }}>{subTitles[view]}</div>
          </div>
          {/* Sub-page content */}
          <div style={{ flex:1, overflowY:'auto', padding:'18px 16px 32px' }} className="ua-no-scrollbar">
            <div style={{ animation:'uaUp 0.28s ease' }}>
              {subViews[view]}
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      {!isMobile && (
        <div onClick={() => dispatch(closeUserAccount())}
          style={{ position:'fixed', inset:0, zIndex:1099, background:'rgba(44,26,14,0.5)', backdropFilter:'blur(6px)' }} />
      )}
      {isMobile && (
        <div style={{ position:'fixed', inset:0, zIndex:1099 }} />
      )}

      {/* Panel */}
      <div style={{
        position:'fixed',
        inset: isMobile ? 0 : 'auto',
        top: isMobile ? 0 : '50%',
        left: isMobile ? 0 : '50%',
        transform: isMobile ? 'none' : 'translate(-50%,-50%)',
        width: isMobile ? '100%' : 420,
        height: isMobile ? '100%' : 'min(92vh,820px)',
        zIndex: 1100,
        animation: isMobile ? 'uaSlideUp 0.3s cubic-bezier(.2,.9,.3,1)' : 'uaUp 0.3s ease',
        borderRadius: isMobile ? 0 : 24,
        overflow: 'hidden',
        boxShadow: isMobile ? 'none' : '0 32px 80px rgba(44,26,14,0.24)',
      }}>
        {content}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom: isMobile ? 24 : 28, left:'50%', transform:'translateX(-50%)', zIndex:1400, background:'#2C1A0E', color:'white', borderRadius:12, padding:'12px 20px', fontSize:13, fontWeight:600, boxShadow:'0 8px 28px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:8, animation:'uaUp 0.22s ease', whiteSpace:'nowrap' }}>
          <span style={{ color:TC }}>✓</span> {toast}
        </div>
      )}

      <style>{`
        @keyframes uaUp      { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes uaSlideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes uaSpin    { to{transform:rotate(360deg)} }
        .ua-no-scrollbar::-webkit-scrollbar { display:none; }
        .ua-no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </>
  )
}
