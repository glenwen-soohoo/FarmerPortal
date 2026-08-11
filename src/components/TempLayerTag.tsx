import type { TempLayer } from '../types'

// 溫層標籤：淺底方角記號。溫層是「類別」不是「狀態」，顏色只做輔助——訊息由文字承載。
// 常溫去色：它原本用的 #1F6E43 就是 act 本色，出現在每張常溫卡上、緊鄰同色的「印單」鈕，
// 稀釋了色票宣告的「act＝主要動作」。改中性後對比反而升高（6.13:1）。
// 冷藏／冷凍保留色相：使用者年齡帶涵蓋水晶體黃化範圍、藍—黃區辨力下降，這兩者的辨識度不該再削弱。
const STYLE: Record<TempLayer, { bg: string; fg: string }> = {
  常溫: { bg: 'var(--c-inset)', fg: 'var(--c-ink-sub)' }, // 中性（常溫是預設，不需標記）
  冷藏: { bg: 'var(--c-tint-chill)', fg: 'var(--c-chill)' }, // 藍
  冷凍: { bg: 'var(--c-tint-frozen)', fg: 'var(--c-frozen)' }, // 青
}

export default function TempLayerTag({ layer, small }: { layer: TempLayer; small?: boolean }) {
  const s = STYLE[layer]
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full font-bold ${small ? 'px-2.5 text-sm' : 'px-3 py-0.5 text-sm'}`}
      style={{ background: s.bg, color: s.fg }}
    >
      {layer}
    </span>
  )
}
