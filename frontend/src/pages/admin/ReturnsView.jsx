import { useState, useEffect } from 'react'
import { returnsAdminApi } from '../../api/services'
import { TC, DARK, MID, LIGHT, BEIGE, CREAM, SAGE, SectionHeader } from './shared'

// Note-for-customer prompt shown before Approve/Reject — replaces window.prompt()
// so it matches the rest of admin's own styled-modal pattern instead of a native
// browser dialog.
function NoteModal({ status, initialNote, onCancel, onConfirm }) {
  const [note, setNote] = useState(initialNote || '')
  const rejecting = status === 'REJECTED'
  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(44,26,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: CREAM, borderRadius: 24, padding: '28px 26px', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(44,26,14,0.2)', animation: 'fadeUp 0.25s ease' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 6 }}>
          {rejecting ? 'Reject request' : 'Approve request'}
        </div>
        <div style={{ fontSize: 12, color: LIGHT, marginBottom: 14 }}>Optional note for the customer.</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
          placeholder="e.g. Refund will be processed within 5–7 business days."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BEIGE}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: 'white', color: DARK, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = BEIGE} />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', borderRadius: 99, border: `1.5px solid ${BEIGE}`, background: 'white', color: MID, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(note.trim() || null)} style={{ flex: 1, padding: '11px 0', borderRadius: 99, border: 'none', background: rejecting ? '#A02A2A' : SAGE, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {rejecting ? 'Reject' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

const STATUSES = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']

const STATUS_STYLE = {
  PENDING:   { bg: '#FEF3E2', color: '#B07B2A' },
  APPROVED:  { bg: '#EAF3E6', color: '#3F7A2E' },
  REJECTED:  { bg: '#FDECEA', color: '#C0444A' },
  COMPLETED: { bg: '#E4F0EC', color: '#2A7A6A' },
}

// Allowed forward transitions from each status.
const NEXT = {
  PENDING:   [['APPROVED', 'Approve'], ['REJECTED', 'Reject']],
  APPROVED:  [['COMPLETED', 'Mark Completed'], ['REJECTED', 'Reject']],
  REJECTED:  [['PENDING', 'Reopen']],
  COMPLETED: [],
}

// ─── RETURNS & EXCHANGES VIEW ──────────────────────────────────────
export default function ReturnsView({ onToast }) {
  const [filter, setFilter] = useState('ALL')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  // { row, status } while the Approve/Reject note prompt is open; null otherwise.
  const [pendingNote, setPendingNote] = useState(null)

  useEffect(() => {
    let alive = true
    returnsAdminApi.list(filter === 'ALL' ? undefined : filter)
      .then(({ data }) => { if (alive) setRows(data || []) })
      .catch(() => { if (alive) onToast('Failed to load requests') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [filter, onToast])

  const applyStatus = async (r, status, adminNote) => {
    try {
      const { data } = await returnsAdminApi.updateStatus(r.id, { status, adminNote })
      // Keep the row if it still matches the active filter, else drop it from view.
      setRows(rs => rs
        .map(x => x.id === data.id ? data : x)
        .filter(x => filter === 'ALL' || x.status === filter))
      onToast(`Request #${data.id} → ${data.status.toLowerCase()}`)
    } catch { onToast('Update failed') }
  }

  const setStatus = (r, status) => {
    if (status === 'REJECTED' || status === 'APPROVED') {
      setPendingNote({ row: r, status })
      return
    }
    applyStatus(r, status, null)
  }

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div>
      <SectionHeader title="Returns & Exchanges" sub={loading ? 'Loading…' : `${rows.length} request${rows.length === 1 ? '' : 's'}`} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { if (s !== filter) { setLoading(true); setFilter(s) } }}
            style={{ padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${filter === s ? TC : BEIGE}`, background: filter === s ? TC : 'white', color: filter === s ? 'white' : MID, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
            {s.toLowerCase()}
          </button>
        ))}
      </div>

      {!loading && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: LIGHT }}>No requests{filter !== 'ALL' ? ` with status ${filter.toLowerCase()}` : ''}.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map(r => {
          const st = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING
          return (
            <div key={r.id} style={{ background: 'white', borderRadius: 18, padding: '18px 20px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: TC, fontSize: 13 }}>#{r.id}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: r.type === 'EXCHANGE' ? '#6B4F3A' : DARK, background: '#F5EEE6', padding: '2px 9px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.type}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 9px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.status}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: DARK, fontSize: 14, marginBottom: 2 }}>{r.itemName}</div>
                  <div style={{ fontSize: 12, color: LIGHT }}>Order #{r.orderId} · {r.userName || r.userEmail || 'Customer'} · {fmtDate(r.createdAt)}</div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: MID, marginBottom: 4 }}><strong style={{ color: DARK }}>Reason:</strong> {r.reason}</div>
              {r.details && <div style={{ fontSize: 12.5, color: LIGHT, lineHeight: 1.55, marginBottom: 8 }}>{r.details}</div>}

              {r.images && r.images.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
                  {r.images.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt={`evidence ${i + 1}`} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: `1px solid ${BEIGE}` }} />
                    </a>
                  ))}
                </div>
              )}

              {r.adminNote && <div style={{ fontSize: 12, color: MID, background: '#FBF7F2', borderRadius: 10, padding: '8px 12px', marginTop: 8 }}><strong>Note:</strong> {r.adminNote}</div>}

              {NEXT[r.status]?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {NEXT[r.status].map(([status, label]) => {
                    const danger = status === 'REJECTED'
                    const good = status === 'APPROVED' || status === 'COMPLETED'
                    return (
                      <button key={status} onClick={() => setStatus(r, status)}
                        style={{ padding: '7px 16px', borderRadius: 99, border: danger ? '1.5px solid #FED7D7' : 'none', background: danger ? '#FFF5F5' : good ? SAGE : BEIGE, color: danger ? '#A02A2A' : good ? 'white' : MID, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {pendingNote && (
        <NoteModal
          status={pendingNote.status}
          initialNote={pendingNote.row.adminNote}
          onCancel={() => setPendingNote(null)}
          onConfirm={(note) => { applyStatus(pendingNote.row, pendingNote.status, note); setPendingNote(null) }}
        />
      )}
    </div>
  )
}
