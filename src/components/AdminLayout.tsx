import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import '../gox/gox.css'

const MENU = [
  { to: '/admin/dashboard', label: '派單總覽' },
  { to: '/admin/binding', label: '商品綁定' },
  { to: '/admin/accounts', label: '農友帳號管理' },
]

interface Props {
  title: string
  children: ReactNode
}

export default function AdminLayout({ title, children }: Props) {
  return (
    <div className="gox-page">
      {/* header（淺綠，仿 GoX）*/}
      <header className="gox-header">
        <span className="gox-logo">無毒農</span>
        <div className="gox-breadcrumb">
          <a href="#">後台管理系統</a>
          <span className="sep">›</span>
          <strong>{title}</strong>
        </div>
        <div className="gox-header-right">
          <span className="gox-user">營運人員</span>
          <button className="gox-icon-btn">登出</button>
        </div>
      </header>

      <div className="gox-body">
        {/* 深灰側欄 */}
        <nav className="gox-sidebar">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) => `gox-menu-item${isActive ? ' is-active' : ''}`}
            >
              <span className="gox-arrow">›</span>
              <span>{m.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 內容區 */}
        <main className="gox-content">{children}</main>
      </div>
    </div>
  )
}
