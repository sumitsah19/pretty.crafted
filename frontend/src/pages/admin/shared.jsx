import { useEffect } from 'react'

// ─── DESIGN TOKENS ────────────────────────────────────────────────
export const TC = '#C4704A'
export const TC2 = '#A85A38'
export const DARK = '#2C1A0E'
export const MID = '#6B4F3A'
export const LIGHT = '#9C7A63'
export const BEIGE = '#EDE4D8'
export const CREAM = '#FAF7F2'
export const BG = '#F7F3EE'
export const SAGE = '#7A9A6B'

// ─── SHARED HELPERS ────────────────────────────────────────────────
export function Badge({ status }) {
  const map = {
    delivered:  { bg: '#EBF7EC', color: '#2A7A3B' },
    shipped:    { bg: '#EAF0FB', color: '#2A52A0' },
    processing: { bg: '#FEF3E8', color: TC2       },
    cancelled:  { bg: '#FEE8E8', color: '#A02A2A' },
  }
  const s = map[status] || map.processing
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize', letterSpacing: '0.04em' }}>
      {status}
    </span>
  )
}

export function StatCard({ icon, label, value, sub, trend, delay = 0 }) {
  const up = trend >= 0
  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '22px 24px', border: `1px solid ${BEIGE}`, boxShadow: '0 2px 12px rgba(44,26,14,0.05)', animationDelay: `${delay}s`, animation: 'fadeUp 0.4s ease forwards' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 28 }}>{icon}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: up ? '#2A7A3B' : '#A02A2A', background: up ? '#EBF7EC' : '#FEE8E8', padding: '3px 9px', borderRadius: 99 }}>
          {up ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: DARK, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: LIGHT, fontWeight: 500, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#B8A090' }}>{sub}</div>}
    </div>
  )
}


export function BarChart({ data, color = TC, height = 80 }) {
  const max = Math.max(...data.map(d => d.value))
  const bw = 24, gap = 10
  const totalW = data.length * (bw + gap) - gap
  return (
    <svg width="100%" height={height + 20} viewBox={`0 0 ${totalW} ${height + 20}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const bh = Math.max(4, (d.value / max) * height)
        const x = i * (bw + gap)
        return (
          <g key={i}>
            <rect x={x} y={height - bh} width={bw} height={bh} rx={4} fill={`${color}20`} />
            <rect x={x} y={height - bh} width={bw} height={bh * 0.5} rx={4} fill={color} opacity={0.85} />
            <text x={x + bw / 2} y={height + 14} textAnchor="middle" fontSize={8} fill={LIGHT} fontFamily="DM Sans">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function SectionHeader({ title, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 3 }}>{title}</h2>
        {sub && <div style={{ fontSize: 13, color: LIGHT }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} style={{ padding: '8px 18px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {action}
        </button>
      )}
    </div>
  )
}

export function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: DARK, color: 'white', borderRadius: 14, padding: '13px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(44,26,14,0.25)', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp 0.3s ease' }}>
      <span style={{ color: TC }}>✓</span> {msg}
    </div>
  )
}
