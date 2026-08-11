/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans TC'", 'sans-serif'],
      },
      colors: {
        // ══════════════════════════════════════════════════════════════
        // 農友端色票（工程師版；農友頁與其元件唯一來源）。index.css 的 var(--c-*) 由此經 theme() 取值。
        // ══════════════════════════════════════════════════════════════
        // 表面
        page: '#edeae3', // 頁底／整體（FarmerLayout 的 bg-page；0805 V2）
        inset: '#F0EDE6', // 卡內下凹區（收件資訊展開區、內嵌淺底）
        // 文字三階
        ink: '#1A1815', // 主文字（農友端；與 demo 舊值 #2B2B26 合併為單一 near-black）
        'ink-sub': '#5C574F', // 次文字
        'ink-faint': '#6F6A61', // 第三層文字 / 去色標籤
        // 邊界兩階
        hairline: '#E5E1D8', // 純分隔線
        edge: '#8A867C', // 元件邊界（input、未勾選 checkbox、描邊按鈕）
        // 語意（克制使用）
        act: {
          DEFAULT: '#1F6E43', // 主要動作：印單、分頁選中、總數
          deep: '#18583A', // 按下 / hover
        },
        urgent: '#B3261E', // 逾期未出
        notice: '#8A5A12', // 提醒／快到期的文字色（琥珀深階）
        changed: '#9A4A0E', // 改單待重印的文字色（橘深階）
        // tint- ＝ 只能當底或色條，不可當文字
        'tint-notice': '#A16207',
        'tint-today': '#DE6A1B',
        'tint-changed': '#FBE9D9',
        'tint-overdue': '#F9EEED',
        // 溫層
        chill: '#1E6FA8', // 冷藏（藍）
        'tint-chill': '#E1ECF7',
        frozen: '#0F6E7B', // 冷凍（青）
        'tint-frozen': '#E0EDEF',

        // ══════════════════════════════════════════════════════════════
        // demo 外殼 / 後台既有色票（Home / FlowDoc / AiLab / admin；保留不動）
        // ══════════════════════════════════════════════════════════════
        canvas: '#DAD5CB', // 暖灰頁面底
        panel: '#F3F0E9', // 群組左側標籤欄
        cream: '#F7F6F2', // 米白（登入卡等）
        ink2: '#6B6B5F', // 次文字（demo）
        muted: '#8A877C', // 第三層文字 / 去色標籤（demo）
        mutedbg: '#F0EDE6', // 內嵌淺底（demo）
        line: '#E5E1D8', // 邊框（demo）
        brand: {
          DEFAULT: '#1F6E43',
          dark: '#18583A',
        },
        danger: '#C0392B',
        accent: '#D99A2B',
        amberink: '#8A5A12',
        orange: '#DE6A1B',
        orangeink: '#9A4A0E',
        orangebg: '#FBE9D9',
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
        // 農友端表面級圓角（工程師版把 card 從 8px 提到 1rem＝16px；農友卡片與元件依賴此值）。
        // demo 外殼/後台的 rounded-card 也一併採用 16px。
        card: '1rem',
      },
    },
  },
  plugins: [],
}
