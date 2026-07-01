import * as Sentry from '@sentry/react'
import { initAnalytics } from './analytics'
import { getCookieConsent } from './utils/cookieConsent'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'
import { store } from './store'
import './index.css'
import App from './App.jsx'

initAnalytics()

// Session Replay records the visitor's screen — that's beyond the "technical
// diagnostic data" our privacy policy promises Sentry receives, so it only
// runs with Analytics consent (granted on the Cookie Settings page; a changed
// preference takes effect on the next page load). Plain error monitoring and
// tracing stay on regardless — they're the diagnostics the policy describes.
const replayConsent = !!getCookieConsent()?.analytics

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    ...(replayConsent ? [Sentry.replayIntegration()] : []),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  replaysSessionSampleRate: replayConsent ? 0.05 : 0,
  replaysOnErrorSampleRate: replayConsent ? 1.0 : 0,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  </StrictMode>,
)
