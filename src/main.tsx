import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { NativeBridge } from './utils/nativeBridge'
import { AccountGate } from './components/AccountGate'

registerSW({ immediate: true })
NativeBridge.init().catch(console.warn)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccountGate>
      <App />
    </AccountGate>
  </StrictMode>,
)
