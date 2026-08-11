import React from 'react'
import ReactDOM from 'react-dom/client'
// gh-pages 靜態站用 HashRouter，deep-link / 重新整理不會 404（免 basename、免 404.html）
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth'
import { OrdersProvider } from './store'
import './index.css'
import { initAutoUpdate } from './utils/autoUpdate'

// demo 版為 no-op（見 utils/autoUpdate）；呼叫安全、不做任何事。
initAutoUpdate()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <OrdersProvider>
          <App />
        </OrdersProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
)
