import './index.css'

import React, { useCallback,useState } from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import type { SorokitClient } from './lib/client.ts'
import { createMockClient } from './lib/mock-client'

// Client Strategy: Using createMockClient() from mock-client.ts for local development and demo mode.
// This single authoritative mock provides realistic delays, pagination, deterministic state, and balances.
// To connect to a live Soroban/Stellar network adapter in production, replace this factory with a real ClientAdapter.
const createClient = (): SorokitClient => createMockClient() as SorokitClient

function Root() {
  const [client, setClient] = useState<SorokitClient>(createClient)

  // Retrying re-attempts client creation, so a boundary tripped by a failed
  // initialisation comes back with a fresh client instead of the broken one.
  const handleRetry = useCallback(() => {
    setClient(createClient())
  }, [])

  return (
    <ErrorBoundary onRetry={handleRetry}>
      <App client={client} />
    </ErrorBoundary>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
