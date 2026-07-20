import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// gh-pages 專案站：production build 掛在 /FarmerPortal/ 底下；本機 dev 維持 /
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/FarmerPortal/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5191,
    // 本地開發代理：AI 測試台抓國定假日表（gb-order-api）避開瀏覽器 CORS。
    // 僅 dev 用；正式環境 AI 判定在後端 server-side 呼叫、無此需求。
    proxy: {
      '/api/holiday': {
        target: 'https://gb-order-api.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
}))
