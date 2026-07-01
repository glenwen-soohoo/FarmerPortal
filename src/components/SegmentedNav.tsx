import { NavLink } from 'react-router-dom'

interface Item {
  to: string
  label: string
  count?: number
}

export default function SegmentedNav({ items, locked }: { items: Item[]; locked?: boolean }) {
  return (
    <div
      className="flex gap-2 border-b border-line bg-white px-4 pt-3"
      style={locked ? { pointerEvents: 'none', opacity: 0.4 } : undefined}
    >
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `px-6 py-3 text-xl font-bold rounded-t ${
              isActive ? 'bg-brand text-white' : 'text-ink2'
            }`
          }
        >
          {it.label}
          {typeof it.count === 'number' && (
            <span className="ml-2 text-base align-middle">（{it.count}）</span>
          )}
        </NavLink>
      ))}
    </div>
  )
}
