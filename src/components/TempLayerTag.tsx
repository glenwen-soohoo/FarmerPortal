import type { TempLayer } from '../types'

// 溫層標籤：淺底膠囊，依溫層上色（常溫=綠、冷藏=藍、冷凍=青）
const STYLE: Record<TempLayer, { bg: string; fg: string }> = {
  常溫: { bg: '#E6F0E8', fg: '#1F6E43' }, // 綠
  冷藏: { bg: '#E1ECF7', fg: '#1E6FA8' }, // 藍
  冷凍: { bg: '#E0EDEF', fg: '#0F6E7B' }, // 青
}

export default function TempLayerTag({ layer }: { layer: TempLayer }) {
  const s = STYLE[layer]
  return (
    <span
      className="whitespace-nowrap rounded-full px-2 py-0.5 text-sm font-bold"
      style={{ background: s.bg, color: s.fg }}
    >
      {layer}
    </span>
  )
}
