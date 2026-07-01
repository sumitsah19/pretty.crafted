import { useState, useEffect, useCallback, useMemo } from 'react'
import { TC, DARK, MID, LIGHT, BEIGE, BG, Toast } from './admin/shared'
import DashboardView from './admin/DashboardView'
import ProductsView from './admin/ProductsView'
import OrdersView from './admin/OrdersView'
import OccasionsView from './admin/OccasionsView'
import MarketingView from './admin/MarketingView'
import CustomersView from './admin/CustomersView'
import BuildBoxesView from './admin/BuildBoxesView'
import CategoriesView from './admin/CategoriesView'
import FaqView from './admin/FaqView'
import ReturnsView from './admin/ReturnsView'
import ContactView from './admin/ContactView'
import PoliciesView from './admin/PoliciesView'

const NAV_ITEMS = [
  { id: 'dashboard',  icon: '◈', label: 'Dashboard'  },
  { id: 'products',   icon: '⊞', label: 'Products'   },
  { id: 'orders',     icon: '⊟', label: 'Orders'     },
  { id: 'returns',    icon: '↩', label: 'Returns'    },
  { id: 'customers',  icon: '◎', label: 'Customers'  },
  { id: 'categories', icon: '⊕', label: 'Categories' },
  { id: 'buildboxes', icon: '🎁', label: 'Build Boxes' },
  { id: 'faqs',       icon: '✷', label: 'FAQs'       },
  { id: 'contact',    icon: '☏', label: 'Contact'    },
  { id: 'policies',   icon: '📜', label: 'Policies'   },
  { id: 'occasions',  icon: '✦', label: 'Occasions'  },
  { id: 'marketing',  icon: '◇', label: 'Marketing'  },
]

// ─── SIDEBAR ───────────────────────────────────────────────────────
function Sidebar({ active, setActive, collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen }) {
  const w = collapsed && !isMobile ? 68 : 220
  if (isMobile && !mobileOpen) return null

  return (
    <>
      {isMobile && (
        <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 190, background: 'rgba(44,26,14,0.4)', backdropFilter: 'blur(4px)' }} />
      )}
      <aside style={{ position: isMobile ? 'fixed' : 'relative', top: 0, left: 0, bottom: 0, zIndex: 200, width: w, minHeight: '100vh', background: DARK, display: 'flex', flexDirection: 'column', transition: 'width 0.3s cubic-bezier(.4,0,.2,1)', overflow: 'hidden', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: collapsed && !isMobile ? '22px 0' : '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'space-between', minHeight: 68 }}>
          {(!collapsed || isMobile) && (
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>
              Pretty<span style={{ color: TC }}>.</span>Crafted
            </div>
          )}
          {collapsed && !isMobile && <div style={{ fontSize: 20, color: TC }}>✦</div>}
          {!isMobile && (
            <button onClick={() => setCollapsed(c => !c)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: LIGHT, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {collapsed ? '›' : '‹'}
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id
            return (
              <button key={item.id} onClick={() => { setActive(item.id); if (isMobile) setMobileOpen(false) }} style={{ width: '100%', padding: collapsed && !isMobile ? '13px 0' : '12px 20px', border: 'none', background: isActive ? 'rgba(196,112,74,0.15)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed && !isMobile ? 'center' : 'flex-start', borderLeft: isActive ? `3px solid ${TC}` : '3px solid transparent', transition: 'all 0.2s' }}>
                <span style={{ fontSize: 16, color: isActive ? TC : LIGHT, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                {(!collapsed || isMobile) && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'white' : LIGHT, whiteSpace: 'nowrap' }}>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Back to store */}
        <div style={{ padding: collapsed && !isMobile ? '16px 0' : '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <a href="/" aria-label="Back to Store" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14, color: MID }}>←</span>
            {(!collapsed || isMobile) && <span style={{ fontSize: 12, color: MID, fontWeight: 500 }}>Back to Store</span>}
          </a>
        </div>
      </aside>
    </>
  )
}

// ─── ADMIN APP ─────────────────────────────────────────────────────
export default function AdminPage() {
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [ww, setWw] = useState(window.innerWidth)
  const today = useMemo(() => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), [])

  useEffect(() => {
    const r = () => setWw(window.innerWidth)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  const isMobile = ww < 768
  const showToast = useCallback(msg => setToast(msg), [])

  const views = {
    dashboard:  <DashboardView />,
    products:   <ProductsView  onToast={showToast} />,
    orders:     <OrdersView    onToast={showToast} />,
    returns:    <ReturnsView   onToast={showToast} />,
    customers:  <CustomersView />,
    categories: <CategoriesView onToast={showToast} />,
    buildboxes: <BuildBoxesView onToast={showToast} />,
    faqs:       <FaqView onToast={showToast} />,
    contact:    <ContactView onToast={showToast} />,
    policies:   <PoliciesView onToast={showToast} />,
    occasions:  <OccasionsView onToast={showToast} />,
    marketing:  <MarketingView onToast={showToast} />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: BG, fontFamily: "'DM Sans',sans-serif", color: DARK }}>
      <Sidebar
        active={active} setActive={setActive}
        collapsed={collapsed} setCollapsed={setCollapsed}
        isMobile={isMobile} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ height: 68, background: 'rgba(250,247,242,0.97)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BEIGE}`, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10, boxShadow: `0 1px 0 ${BEIGE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isMobile && (
              <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: DARK, padding: 4, display: 'flex', alignItems: 'center' }}>☰</button>
            )}
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK }}>
                {NAV_ITEMS.find(n => n.id === active)?.label}
              </div>
              <div style={{ fontSize: 11, color: LIGHT }}>Pretty.Crafted Admin</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: LIGHT, background: '#F5EEE6', padding: '5px 12px', borderRadius: 99, fontWeight: 500 }}>{today}</div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>A</div>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '24px 16px' : '32px 32px' }}>
          <div key={active} style={{ maxWidth: 1100, margin: '0 auto', animation: 'fadeUp 0.4s ease forwards' }}>
            {views[active]}
          </div>
        </main>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
