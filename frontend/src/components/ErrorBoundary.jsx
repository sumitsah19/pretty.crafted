import * as Sentry from '@sentry/react'
import { Component } from 'react'

const TC = '#C4704A'

export default class ErrorBoundary extends Component {
  state = { hasError: false, eventId: null }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    const eventId = Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    })
    this.setState({ eventId })
  }

  render() {
    if (this.state.hasError) {
      const { inline } = this.props
      if (inline) {
        return (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9C7A63', fontSize: 13 }}>
            Something went wrong loading this section.{' '}
            <button onClick={() => this.setState({ hasError: false })}
              style={{ background: 'none', border: 'none', color: TC, cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )
      }
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
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => window.location.reload()}
                style={{ padding: '12px 28px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Refresh Page
              </button>
              {this.state.eventId && (
                <button onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId })}
                  style={{ padding: '12px 28px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  Report This
                </button>
              )}
            </div>
            {this.state.eventId && (
              <div style={{ marginTop: 16, fontSize: 11, color: '#C5B5A5' }}>
                Error ID: {this.state.eventId}
              </div>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
