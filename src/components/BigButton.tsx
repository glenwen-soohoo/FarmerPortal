import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'lg' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-white active:bg-brand-dark',
  secondary: 'bg-white text-ink border border-line active:bg-mutedbg',
  danger: 'bg-white text-danger border border-danger active:bg-red-50',
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
      className={`rounded ${sizing} ${VARIANT[variant]} disabled:opacity-40 transition-colors ${className}`}
      style={minH}
      {...rest}
    >
      {children}
    </button>
  )
}
