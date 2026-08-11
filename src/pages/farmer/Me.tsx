import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth'
import BigButton from '../../components/BigButton'
import ConfirmDialog from '../../components/ConfirmDialog'
import { isAlertEnabled, setAlertEnabled } from '../../utils/newOrderAlert'
import { FONT_LEVELS, type FarmerOutletCtx } from './FarmerLayout'

export default function Me() {
  const { farmer, logout } = useAuth()
  const { fontPx, setFontPx } = useOutletContext<FarmerOutletCtx>()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [alertOn, setAlertOn] = useState(isAlertEnabled())

  const toggleAlert = () => {
    const v = !alertOn
    setAlertOn(v)
    setAlertEnabled(v)
  }

  return (
    <div className="mx-auto max-w-md">
      {/* 個人資料（登入後由 JWT / 農友主檔取得） */}
      <div className="rounded-card border border-hairline bg-white p-5 space-y-3" style={{ boxShadow: 'var(--l1)' }}>
        <div>
          <div className="text-base text-ink-sub">農園名稱</div>
          <div className="text-2xl font-bold text-ink">{farmer?.name}</div>
        </div>
        <div>
          <div className="text-base text-ink-sub">登入帳號（手機）</div>
          <div className="text-xl text-ink">{farmer?.mobile}</div>
        </div>
      </div>

      {/* 字體大小 */}
      <div className="mt-4 rounded-card border border-hairline bg-white p-5" style={{ boxShadow: 'var(--l1)' }}>
        <div className="text-base font-bold text-ink-sub">字體大小</div>
        <div className="mt-3 flex gap-2">
          {FONT_LEVELS.map((lv) => {
            const active = lv.px === fontPx
            return (
              <button
                key={lv.px}
                onClick={() => setFontPx(lv.px)}
                aria-pressed={active}
                className={`flex-1 rounded-full border-2 text-base font-bold ${
                  active ? 'border-act bg-act text-white' : 'border-hairline bg-white text-ink'
                }`}
                style={{ minHeight: 52 }}
              >
                {lv.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-base text-ink-sub">調整後整個畫面的字會跟著變大或變小。</p>
      </div>

      {/* 新訂單提醒開關：只 gate 震動/提示音；關掉仍會顯示畫面提示條 */}
      <div className="mt-4 rounded-card border border-hairline bg-white p-5" style={{ boxShadow: 'var(--l1)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="text-xl font-bold text-ink">新訂單提醒</div>
          <button
            role="switch"
            aria-checked={alertOn}
            aria-label="新訂單提醒"
            onClick={toggleAlert}
            /* tap44：軌道視覺留 64×36（再高就不像開關了），可點區撐到 44。
               ⚠️ relative 要留著、不要因為 .tap44 也給 position: relative 就刪掉——旋鈕是
               absolute 定位在這顆上面，這裡若失去定位脈絡，旋鈕會飛到外層容器的左上角（實測位移 −588,−388）。 */
            className={`tap44 relative shrink-0 rounded-full transition-colors ${alertOn ? 'bg-act' : 'bg-ink-faint'}`}
            style={{ width: 64, height: 36 }}
          >
            <span
              className="absolute rounded-full bg-white transition-all"
              style={{ top: 3, left: alertOn ? 31 : 3, width: 30, height: 30, boxShadow: 'var(--key)' }}
            />
          </button>
        </div>
        <p className="mt-3 text-base text-ink-sub leading-relaxed">
          有新的「今天要出貨」訂單時，平板會震動並發出提示音。關閉後仍會顯示畫面提示，只是不震動、不出聲。
        </p>
      </div>

      {/* 登出：罕用動作放這裡，避免日常誤觸；點擊先跳確認再登出 */}
      <div className="mt-4 rounded-card border border-hairline bg-white p-5" style={{ boxShadow: 'var(--l1)' }}>
        <BigButton variant="danger" className="w-full" onClick={() => setConfirmLogout(true)}>
          登出
        </BigButton>
        <p className="mt-2 text-base text-ink-sub">登出後需重新輸入手機帳號與密碼才能使用。</p>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          title="確定要登出嗎？"
          message="登出後需重新輸入手機帳號與密碼。"
          confirmText="登出"
          cancelText="取消"
          confirmVariant="danger"
          onConfirm={logout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  )
}
