import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { NativeBridge } from './utils/nativeBridge'
import { AccountGate } from './components/AccountGate'

if ('serviceWorker' in navigator) {
  let refreshing = false
  const hadExistingController = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing && hadExistingController) {
      refreshing = true
      window.location.reload()
    }
  })
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true).catch(console.warn)
  },
  onRegisteredSW(_swScriptUrl, registration) {
    if (registration) {
      registration.update().catch(console.warn)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(console.warn)
        }
      })
    }
  },
  onRegisterError(error) {
    console.warn('SW registration failed:', error)
  },
})

NativeBridge.init().catch(console.warn)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccountGate>
      <App />
    </AccountGate>
  </StrictMode>,
)
