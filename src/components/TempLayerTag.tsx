import type { TempLayer } from '../types'

const MAP: Record<TempLayer, string> = {
  常溫: '#8A877C',
  冷藏: '#2C7A9E',
  冷凍: '#1F5E86',
}

// 標籤感（小圓點 + 文字），不要做成像按鈕的外框膠囊
export default function TempLayerTag({ layer }: { layer: TempLayer }) {
  return (
    <span className="inline-flex items-center gap-1 text-base font-medium whitespace-nowrap" style={{ color: MAP[layer] }}>
      <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: MAP[layer] }} />
      {layer}
    </span>
  )
}
