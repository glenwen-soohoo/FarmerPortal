import React from 'react'
import ReactDOM from 'react-dom/client'
// gh-pages 靜態站用 HashRouter，deep-link / 重新整理不會 404（免 basename、免 404.html）
import { HashRouter } from 'react-router-dom'
import App from './App'
import { OrdersProvider } from './store'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <OrdersProvider>
        <App />
      </OrdersProvider>
    </HashRouter>
  </React.StrictMode>
)
