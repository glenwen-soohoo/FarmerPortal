/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans TC'", 'sans-serif'],
      },
      colors: {
        // ── 農友端配色系統（重規劃 #24）─────────────────────────────
        // 原則：中性為主（暖灰底 + 白卡 + 墨黑字），三個語意色各司其職、只做小記號：
        //   brand 綠＝主要動作、danger 紅＝今日/急、accent 琥珀＝有異動。其餘一律去色。
        // 中性
        canvas: '#DAD5CB', // 暖灰頁面底（襯托白卡，不搶戲）
        panel: '#F3F0E9', // 群組左側標籤欄（中性暖白）
        cream: '#F7F6F2', // 米白（登入卡等）
        ink: '#2B2B26', // 主文字（暖近黑）
        ink2: '#6B6B5F', // 次文字
        muted: '#8A877C', // 第三層文字 / 去色標籤
        mutedbg: '#F0EDE6', // 內嵌淺底
        line: '#E5E1D8', // 邊框
        // 語意（克制使用）
        brand: {
          DEFAULT: '#1F6E43', // 主要動作：印單、分頁選中、總數
          dark: '#18583A',
        },
        danger: '#C0392B', // 今日 / 急：指定今日、無法出貨
        accent: '#D99A2B', // 有異動：改單重印、出貨提醒
        amberink: '#8A5A12', // 琥珀標籤的深字色（淺琥珀底上可讀）
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
