import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#FAF7F2',
          textAlign: 'center', padding: 32,
        }}>
          <div>
            <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>
              Something went wrong
            </div>
            <div style={{ color: '#9C7A63', marginBottom: 24, fontSize: 14 }}>
              Please refresh the page to try again
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 28px', borderRadius: 99, border: 'none', background: '#C4704A', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
