import { TC, DARK, LIGHT, BEIGE, BarChart, SectionHeader } from './shared'

// ─── MOCK DATA ─────────────────────────────────────────────────────
// Dashboard, Products, Orders views use real APIs.
// Customers, Occasions, Marketing use mock data — no backend endpoints exist yet.

const OCCASION_STATS = [
  { name: "Mother's Day", rev: 4820, orders: 48, trend: +18, icon: '💐', color: '#F0D5DC' },
  { name: 'Birthday',     rev: 3640, orders: 36, trend: +12, icon: '🎂', color: '#E8D5C4' },
  { name: 'Wedding',      rev: 6210, orders: 31, trend: +24, icon: '💒', color: '#F2EAE0' },
  { name: "Valentine's",  rev: 2890, orders: 29, trend: -3,  icon: '💝', color: '#E8C5C5' },
  { name: 'Anniversary',  rev: 2440, orders: 24, trend: +8,  icon: '💍', color: '#E0D5C5' },
  { name: 'Graduation',   rev: 1820, orders: 18, trend: +5,  icon: '🎓', color: '#D4C5B5' },
]

// ─── OCCASIONS VIEW ────────────────────────────────────────────────
export default function OccasionsView() {
  const monthly = [
    { label: 'Jan', value: 28 }, { label: 'Feb', value: 86  }, { label: 'Mar', value: 54  },
    { label: 'Apr', value: 72 }, { label: 'May', value: 96  }, { label: 'Jun', value: 44  },
    { label: 'Jul', value: 38 }, { label: 'Aug', value: 52  }, { label: 'Sep', value: 60  },
    { label: 'Oct', value: 48 }, { label: 'Nov', value: 68  }, { label: 'Dec', value: 120 },
  ]

  return (
    <div>
      <SectionHeader title="Occasion Analytics" sub="Revenue and engagement by occasion" />
      <div style={{ background: 'white', borderRadius: 20, padding: 28, border: `1px solid ${BEIGE}`, marginBottom: 24, boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Seasonal trend</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>Monthly Orders by Season</div>
        </div>
        <BarChart data={monthly} height={100} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {OCCASION_STATS.map((o, i) => {
          const pct = Math.round((o.rev / 6210) * 100)
          return (
            <div key={o.name} style={{ background: 'white', borderRadius: 20, padding: 22, border: `1px solid ${BEIGE}`, boxShadow: '0 2px 8px rgba(44,26,14,0.04)', animation: 'fadeUp 0.4s ease forwards', animationDelay: `${i * 0.06}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: o.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{o.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: DARK }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: LIGHT }}>{o.orders} orders</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: o.trend >= 0 ? '#2A7A3B' : '#A02A2A', background: o.trend >= 0 ? '#EBF7EC' : '#FEE8E8', padding: '3px 8px', borderRadius: 99 }}>
                  {o.trend >= 0 ? '▲' : '▼'} {Math.abs(o.trend)}%
                </div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 10 }}>${o.rev.toLocaleString()}</div>
              <div style={{ height: 5, background: BEIGE, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: TC, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 11, color: LIGHT, marginTop: 6 }}>{pct}% of top revenue</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
