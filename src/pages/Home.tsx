import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-mutedbg p-6">
      <h1 className="text-3xl font-bold text-ink">農友出貨平台 — Demo</h1>
      <p className="text-ink2">前端 mock，未接後端。選擇要看的端：</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          to="/farmer/login"
          className="rounded-card bg-brand px-10 py-8 text-center text-xl font-bold text-white"
        >
          農友端
          <div className="mt-1 text-sm font-normal opacity-90">平板 · 年長友善</div>
        </Link>
        <Link
          to="/admin/dashboard"
          className="rounded-card px-10 py-8 text-center text-xl font-bold text-white"
          style={{ background: 'var(--admin-primary)' }}
        >
          業務端後台
          <div className="mt-1 text-sm font-normal opacity-90">GoX 風格</div>
        </Link>
        <Link
          to="/flow"
          className="rounded-card border border-line bg-white px-10 py-8 text-center text-xl font-bold text-ink"
        >
          狀態流程說明
          <div className="mt-1 text-sm font-normal text-ink2">判定 × 出貨 流程圖</div>
        </Link>
      </div>
    </div>
  )
}
