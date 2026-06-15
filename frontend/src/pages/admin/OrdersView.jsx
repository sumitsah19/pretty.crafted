import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, Badge, SectionHeader } from './shared'

// ─── ORDER DETAIL MODAL ────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onUpdateStatus, onUpdateTracking, updatingId, savingTracking }) {
  const nextStatus = (status) => {
    const map = { PENDING: 'PAID', PAID: 'SHIPPED', SHIPPED: 'DELIVERED' }
    return map[status] || null
  }
  const next = nextStatus(order.status)

  const [courier, setCourier] = useState(order.courier || '')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '')
  const trackingDirty = courier !== (order.courier || '') || trackingNumber !== (order.trackingNumber || '') || trackingUrl !== (order.trackingUrl || '')
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: 'white', color: DARK, outline: 'none', boxSizing: 'border-box' }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(44,26,14,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: CREAM, borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,26,14,0.25)', animation: 'fadeUp 0.25s ease' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${BEIGE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: DARK }}>Order #{order.id}</div>
            <div style={{ fontSize: 12, color: LIGHT, marginTop: 2 }}>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
          </div>
          <button onClick={onClose} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 18, color: MID, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge status={order.status?.toLowerCase()} />
            <span style={{ fontSize: 12, color: LIGHT }}>Payment:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: order.paymentStatus === 'PAID' ? '#2A7A3B' : order.paymentStatus === 'FAILED' ? '#A02A2A' : MID }}>{order.paymentStatus}</span>
          </div>

          {/* Customer */}
          <div style={{ background: 'white', borderRadius: 16, padding: '16px 18px', border: `1px solid ${BEIGE}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TC, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Customer</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: LIGHT }}>Name</span>
                <span style={{ fontWeight: 600, color: DARK }}>{order.userName || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: LIGHT }}>Email</span>
                <span style={{ fontWeight: 600, color: DARK }}>{order.userEmail || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: LIGHT }}>Phone</span>
                <span style={{ fontWeight: 600, color: DARK }}>{order.contactPhone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div style={{ background: 'white', borderRadius: 16, padding: '16px 18px', border: `1px solid ${BEIGE}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TC, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Shipping Address</div>
            <div style={{ fontSize: 13, color: DARK, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{order.shippingAddress || '—'}</div>
          </div>

          {/* Items */}
          <div style={{ background: 'white', borderRadius: 16, padding: '16px 18px', border: `1px solid ${BEIGE}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TC, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Items Ordered</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: i < order.items.length - 1 ? 10 : 0, borderBottom: i < order.items.length - 1 ? `1px solid ${BEIGE}` : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{item.itemName || (item.type === 'GIFT_BOX' ? 'Custom Gift Box' : 'Product')}</div>
                    <div style={{ fontSize: 11, color: LIGHT, marginTop: 2 }}>
                      {item.type === 'GIFT_BOX' ? 'Gift Box' : 'Product'} · Qty: {item.quantity}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>₹{Number(item.lineTotal).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: LIGHT }}>₹{Number(item.unitPrice).toLocaleString()} each</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `2px solid ${BEIGE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: MID }}>Total</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: DARK }}>₹{Number(order.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          {/* Shipment tracking */}
          <div style={{ background: 'white', borderRadius: 16, padding: '16px 18px', border: `1px solid ${BEIGE}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TC, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Shipment Tracking</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={courier} onChange={e => setCourier(e.target.value)} placeholder="Courier (e.g. Delhivery)" style={inputStyle}
                onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking / AWB number" style={inputStyle}
                onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              <input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} placeholder="Tracking URL (https://…)" style={inputStyle}
                onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
              <button
                disabled={!trackingDirty || savingTracking}
                onClick={() => onUpdateTracking(order.id, { courier, trackingNumber, trackingUrl })}
                style={{ alignSelf: 'flex-start', padding: '9px 18px', borderRadius: 99, border: 'none', background: (!trackingDirty || savingTracking) ? BEIGE : TC, color: (!trackingDirty || savingTracking) ? MID : 'white', fontSize: 12, fontWeight: 700, cursor: (!trackingDirty || savingTracking) ? 'default' : 'pointer' }}>
                {savingTracking ? 'Saving…' : 'Save Tracking'}
              </button>
            </div>
          </div>

          {/* Actions */}
          {(next || order.status === 'PENDING') && (
            <div style={{ display: 'flex', gap: 10 }}>
              {next && (
                <button
                  disabled={updatingId === order.id}
                  onClick={() => onUpdateStatus(order.id, next)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 99, border: 'none', background: TC, color: 'white', fontSize: 13, fontWeight: 700, cursor: updatingId === order.id ? 'default' : 'pointer', opacity: updatingId === order.id ? 0.6 : 1 }}>
                  {updatingId === order.id ? '…' : `Mark ${next.charAt(0) + next.slice(1).toLowerCase()}`}
                </button>
              )}
              {order.status === 'PENDING' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                  style={{ flex: next ? '0 0 auto' : 1, padding: '12px 20px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ORDERS VIEW ───────────────────────────────────────────────────
export default function OrdersView({ onToast }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [savingTracking, setSavingTracking] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const STATUS_FILTERS = ['all', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

  const fetchOrders = useCallback(async (status) => {
    setLoading(true)
    try {
      const params = status !== 'all' ? { status, size: 50 } : { size: 50 }
      const { data } = await adminApi.orders(params)
      setOrders(data?.content || [])
    } catch { /* keep previous list on failure */ } finally { setLoading(false) }
  }, [])

  // Deferred a tick so fetchOrders' setLoading(true) is an async side effect,
  // not a synchronous setState inside the effect body.
  useEffect(() => {
    const t = setTimeout(() => fetchOrders(filter), 0)
    return () => clearTimeout(t)
  }, [filter, fetchOrders])

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const { data } = await adminApi.updateOrderStatus(id, newStatus)
      setOrders(os => os.map(o => o.id === data.id ? data : o))
      if (selectedOrder?.id === id) setSelectedOrder(data)
      onToast(`Order #${id} → ${newStatus}`)
    } catch { onToast('Status update failed') } finally { setUpdatingId(null) }
  }

  const updateTracking = async (id, tracking) => {
    setSavingTracking(true)
    try {
      const { data } = await adminApi.updateOrderTracking(id, tracking)
      setOrders(os => os.map(o => o.id === data.id ? data : o))
      if (selectedOrder?.id === id) setSelectedOrder(data)
      onToast(`Tracking saved for order #${id}`)
    } catch { onToast('Tracking update failed') } finally { setSavingTracking(false) }
  }

  const nextStatus = (status) => {
    const map = { PENDING: 'PAID', PAID: 'SHIPPED', SHIPPED: 'DELIVERED' }
    return map[status] || null
  }

  return (
    <div>
      <SectionHeader title="Orders" sub={loading ? 'Loading…' : `${orders.length} orders`} />
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name, email or order ID…"
          style={{ width: '100%', maxWidth: 400, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: 'white', color: DARK, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '7px 16px', borderRadius: 99, border: filter === s ? 'none' : `1.5px solid ${BEIGE}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === s ? TC : 'white', color: filter === s ? 'white' : MID, transition: 'all 0.2s', textTransform: s === 'all' ? 'none' : 'capitalize' }}>
            {s === 'all' ? 'All Orders' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders.filter(o => {
          if (!search.trim()) return true
          const q = search.toLowerCase()
          return String(o.id).includes(q) || (o.userName || '').toLowerCase().includes(q) || (o.userEmail || '').toLowerCase().includes(q)
        }).map((o, i) => {
          const next = nextStatus(o.status)
          return (
            <div key={o.id} onClick={() => setSelectedOrder(o)} style={{ background: 'white', borderRadius: 18, padding: '18px 22px', border: `1px solid ${BEIGE}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(44,26,14,0.04)', animation: 'fadeUp 0.4s ease forwards', animationDelay: `${i * 0.03}s`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,26,14,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(44,26,14,0.04)'}>
              <div style={{ flex: '0 0 auto' }}>
                <div style={{ fontWeight: 700, color: TC, fontSize: 13 }}>#{o.id}</div>
                <div style={{ fontSize: 11, color: LIGHT, marginTop: 2 }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 600, color: DARK, marginBottom: 2 }}>{o.userName || o.userEmail || '—'}</div>
                <div style={{ fontSize: 12, color: LIGHT }}>{o.items?.length || 0} items · {o.contactPhone}</div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK }}>₹{Number(o.totalAmount).toLocaleString()}</div>
              <Badge status={o.status?.toLowerCase()} />
              <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                {next && (
                  <button
                    disabled={updatingId === o.id}
                    onClick={() => updateStatus(o.id, next)}
                    style={{ padding: '6px 14px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontSize: 11, fontWeight: 600, cursor: updatingId === o.id ? 'default' : 'pointer', opacity: updatingId === o.id ? 0.6 : 1 }}>
                    {updatingId === o.id ? '…' : `Mark ${next.charAt(0) + next.slice(1).toLowerCase()}`}
                  </button>
                )}
                {o.status === 'PENDING' && (
                  <button onClick={() => updateStatus(o.id, 'CANCELLED')}
                    style={{ padding: '6px 14px', borderRadius: 99, border: '1.5px solid #FED7D7', background: '#FFF5F5', color: '#A02A2A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                )}
                <button style={{ padding: '6px 12px', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setSelectedOrder(o)}>Details</button>
              </div>
            </div>
          )
        })}
        {!loading && orders.filter(o => {
          if (!search.trim()) return true
          const q = search.toLowerCase()
          return String(o.id).includes(q) || (o.userName || '').toLowerCase().includes(q) || (o.userEmail || '').toLowerCase().includes(q)
        }).length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: LIGHT, background: 'white', borderRadius: 18, border: `1px solid ${BEIGE}` }}>No orders found</div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          onUpdateTracking={updateTracking}
          updatingId={updatingId}
          savingTracking={savingTracking}
        />
      )}
    </div>
  )
}
