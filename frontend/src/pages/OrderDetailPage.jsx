import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersApi } from '../api/services'
import { useWindowWidth } from '../hooks/useWindowWidth'

const TC = '#C4704A'

// The fallback invoice is assembled as an HTML string and written into a new
// window — item names and the shipping address must be escaped exactly like
// the backend InvoiceController does, or they inject markup into that window.
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

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
    <span style={{ background:s.bg, color:s.color, fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:99, textTransform:'capitalize' }}>{status}</span>
  )
}

function OrderTimeline({ status }) {
  const steps = ['placed', 'processing', 'shipped', 'delivered']
  const idx = steps.indexOf((status || '').toLowerCase())
  const labels = { placed:'Placed', processing:'Processing', shipped:'Shipped', delivered:'Delivered' }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:12 }}>
      {steps.map((s, i) => {
        const done = i <= idx
        const isLast = i === steps.length - 1
        return (
          <span key={s} style={{ display:'contents' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background: done ? TC : '#EDE4D8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color: done ? 'white' : '#9C7A63', fontWeight:700 }}>{done ? '✓' : i + 1}</div>
              <div style={{ fontSize:11, color: done ? TC : '#9C7A63', fontWeight: done ? 700 : 400 }}>{labels[s]}</div>
            </div>
            {!isLast && <div style={{ flex:1, height:2, background: i < idx ? TC : '#EDE4D8', margin:'0 6px', marginBottom:16 }} />}
          </span>
        )
      })}
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const ww = useWindowWidth()
  const isMobile = ww < 640

  const generateInvoiceHtml = (o) => {
    const itemsHtml = (o.items || []).map(it => {
      const unit = Number(it.unitPrice || 0)
      const line = Number(it.lineTotal || 0)
      return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(it.itemName)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${Number(it.quantity) || 0}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${unit.toLocaleString('en-IN')}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${line.toLocaleString('en-IN')}</td></tr>`
    }).join('')

    const ship = esc(o.shippingAddress)
    const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : ''

    return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice #${o.id}</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family: Arial, Helvetica, sans-serif;color:#2C1A0E;padding:24px} .header{display:flex;justify-content:space-between;align-items:flex-start} .brand{font-family:'Playfair Display',serif;font-size:20px;color:${TC}} table{width:100%;border-collapse:collapse;margin-top:18px} th,td{padding:8px;text-align:left} .right{text-align:right} .muted{color:#6B4F3A;font-size:13px} .total{font-weight:800;font-size:16px;text-align:right;margin-top:12px}</style></head><body><div class="header"><div><div class="brand">Prettycrafted</div><div class="muted">Invoice #: ${o.id}</div></div><div style="text-align:right"><div style="font-weight:700">₹${Number(o.totalAmount||0).toLocaleString('en-IN')}</div><div class="muted">${dateStr}</div></div></div><hr/><div style="display:flex;gap:20px;margin-top:10px"><div><div style="font-weight:700">Bill To</div><div class="muted">${ship || ''}</div></div></div><table class="items"><thead><tr><th style="text-align:left">Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="total">Total: ₹${Number(o.totalAmount||0).toLocaleString('en-IN')}</div><div style="margin-top:18px;font-size:12px;color:#9C7A63">Thank you for ordering from Prettycrafted. This is an electronically generated invoice.</div></body></html>`
  }

  const handleDownloadInvoice = () => {
    if (!order) return
    // Try server-side PDF first
    ordersApi.invoice(order.id)
      .then(({ data }) => {
        const blob = new Blob([data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${order.id}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      })
      .catch(() => {
        // Fallback: client-side printable HTML
        const html = generateInvoiceHtml(order)
        const w = window.open('', '_blank', 'width=900,height=700')
        if (!w) return
        w.document.write(html)
        w.document.close()
        w.focus()
        setTimeout(() => { try { w.print() } catch { /* ignore */ } }, 600)
      })
  }

  const shipmentUrl = order?.trackingUrl || null

  useEffect(() => {
    if (!id) return
    // Defer setState out of the synchronous effect body to satisfy
    // react-hooks/set-state-in-effect (same pattern as admin/OrdersView.jsx).
    const t = setTimeout(() => {
      setLoading(true)
      ordersApi.byId(id)
        .then(({ data }) => setOrder(data))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(t)
  }, [id])

  if (loading) return (
    <div style={{ padding:32, textAlign:'center' }}>
      <div className="animate-spin-slow" style={{ width:36, height:36, border:'3px solid #EDE4D8', borderTopColor:TC, borderRadius:'50%', margin:'0 auto 12px' }} />
      Loading order…
    </div>
  )

  if (!order) return (
    <div style={{ padding:32, textAlign:'center' }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:12 }}>Order not found</div>
      <button onClick={() => navigate(-1)} style={{ padding:'10px 16px', borderRadius:99, border:'none', background:TC, color:'white' }}>Go back</button>
    </div>
  )

  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—'
  const subtotal = (order.items || []).reduce((sum, it) => sum + Number(it.lineTotal || 0), 0)

  return (
    <div style={{ padding:20, maxWidth:940, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700 }}>Order #{order.id}</div>
          <div style={{ fontSize:13, color:'#9C7A63' }}>{dateStr}</div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <UABadge status={order.status} />
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <button onClick={handleDownloadInvoice} style={{ padding:'9px 14px', borderRadius:99, border:'none', background:TC, color:'white', fontWeight:700, cursor:'pointer' }}>Download Invoice</button>
        {shipmentUrl ? (
          <a href={shipmentUrl} target="_blank" rel="noreferrer" style={{ padding:'9px 14px', borderRadius:99, border:'1px solid #EDE4D8', background:'white', color:'#6B4F3A', fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center' }}>Track Shipment</a>
        ) : (
          <button disabled style={{ padding:'9px 14px', borderRadius:99, border:'1px solid #EDE4D8', background:'#F7F5F2', color:'#9C7A63', fontWeight:700 }}>Track Shipment</button>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap:20 }}>
        <div>
          <div style={{ background:'white', borderRadius:12, padding:16, border:'1px solid #EDE4D8', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Items</div>
            {order.items && order.items.map((it, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'8px 0', borderBottom: i < order.items.length - 1 ? '1px solid #F0EBE4' : 'none' }}>
                <div style={{ width:56, height:56, borderRadius:8, overflow:'hidden', background:'#F5F2EE', flexShrink:0 }}>
                  {it.imageUrl && <img src={it.imageUrl} alt={it.itemName} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:'#2C1A0E' }}>{it.itemName}</div>
                  <div style={{ fontSize:12, color:'#9C7A63' }}>Qty: {it.quantity} · ₹{Number(it.unitPrice || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ fontWeight:700 }}>₹{Number(it.lineTotal || 0).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'white', borderRadius:12, padding:16, border:'1px solid #EDE4D8' }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Timeline</div>
            <OrderTimeline status={order.status} />
          </div>
        </div>

        <div>
          <div style={{ background:'white', borderRadius:12, padding:16, border:'1px solid #EDE4D8', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Shipping</div>
            <div style={{ fontSize:13, color:'#6B4F3A', lineHeight:1.6 }}>{order.shippingAddress || ''}</div>
            {(order.courier || order.trackingNumber) && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F0EBE4', fontSize:13, color:'#6B4F3A', lineHeight:1.6 }}>
                {order.courier && <div><span style={{ color:'#9C7A63' }}>Courier:</span> {order.courier}</div>}
                {order.trackingNumber && <div><span style={{ color:'#9C7A63' }}>Tracking #:</span> {order.trackingNumber}</div>}
              </div>
            )}
          </div>

          <div style={{ background:'white', borderRadius:12, padding:16, border:'1px solid #EDE4D8' }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Summary</div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>Subtotal <span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            {Number(order.discountAmount || 0) > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, color:'#7A9A6B' }}>
                Discount{order.couponCode ? ` (${order.couponCode})` : ''} <span>−₹{Number(order.discountAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            {/* deliveryFee is null on orders placed before the fee existed — shown as Free */}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              Delivery {Number(order.deliveryFee || 0) > 0
                ? <span>₹{Number(order.deliveryFee).toLocaleString('en-IN')}</span>
                : <span style={{ color:'#7A9A6B', fontWeight:600 }}>Free</span>}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, marginTop:8 }}>Total <span>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
