import type { TempLayer } from '../types'

// 只用有顏色的文字：常溫=綠、冷藏=藍、冷凍=深藍（無框、無底色）
const COLOR: Record<TempLayer, string> = {
  常溫: '#389e0d',
  冷藏: '#0958d9',
  冷凍: '#1d39c4',
}

export default function TempLayerTag({ layer }: { layer: TempLayer }) {
  return (
    <span className="whitespace-nowrap font-medium" style={{ color: COLOR[layer] }}>
      {layer}
    </span>
  )
}
