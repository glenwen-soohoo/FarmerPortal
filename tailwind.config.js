/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans TC'", 'sans-serif'],
      },
      colors: {
        // 農友端（清新墨綠 + 米白）
        brand: {
          DEFAULT: '#1F6E43',
          dark: '#18583A',
        },
        accent: '#D99A2B', // 琥珀：要注意 / 已更新
        ok: '#2E7D32',
        danger: '#C0392B',
        muted: '#8A877C', // 暖灰
        mutedbg: '#F0EDE6', // 內嵌淺底（暖）
        cream: '#F7F6F2', // 頁面米白底
        ink: '#2B2B26', // 暖近黑
        ink2: '#6B6B5F', // 暖次文字
        line: '#E5E1D8', // 暖邊框
        // 溫層（小型 outline chip，稍微收斂）
        temp: {
          normal: '#8A877C',
          chill: '#2C7A9E',
          freeze: '#1F5E86',
        },
        // 後台 admin
        admin: {
          primary: '#409eff',
          success: '#67c23a',
          warning: '#e6a23c',
          danger: '#f56c6c',
          text: '#303133',
          line: '#dcdfe6',
        },
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
}
