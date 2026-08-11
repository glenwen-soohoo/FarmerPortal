import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'lg' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

/**
 * 三個 variant 都是全圓膠囊——Apple 的規則是 **capsule 給「控制」**，不分主次。
 * 階層不靠形狀、靠填色承擔：primary 實底綠、secondary 白底描邊、danger 白底紅框。
 * ⚠️ 原本三個都是 `rounded`（4px＝記號階）。第 3 批的文件寫過「BigButton 的 4px 收到 8px」，
 *    但那條從未實際套用；這次直接跳到膠囊。
 */
const VARIANT: Record<Variant, string> = {
  primary: 'rounded-full bg-act text-white active:bg-act-deep',
  secondary: 'rounded-full bg-white text-ink border-2 border-hairline active:bg-inset',
  danger: 'rounded-full bg-white text-urgent border-2 border-urgent active:bg-red-50',
}

export default function BigButton({
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
  ...rest
}: Props) {
  const sizing = size === 'lg' ? 'text-xl font-bold px-6' : 'text-base px-4'
  const minH = size === 'lg' ? { minHeight: 56 } : { minHeight: 48 }
  return (
    <button
      className={`btn-key ${sizing} ${VARIANT[variant]} disabled:border-hairline disabled:bg-inset disabled:text-ink-faint ${className}`}
      style={minH}
      {...rest}
    >
      {children}
    </button>
  )
}
