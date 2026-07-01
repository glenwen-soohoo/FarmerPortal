import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// gh-pages 專案站：production build 掛在 /FarmerPortal/ 底下；本機 dev 維持 /
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/FarmerPortal/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5191,
  },
}))
