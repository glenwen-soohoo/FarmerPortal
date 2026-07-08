import { useNavigate, useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import BigButton from '../../components/BigButton'
import { FONT_LEVELS, type FarmerOutletCtx } from './FarmerLayout'

export default function Me() {
  const { farmers, currentFarmerId } = useStore()
  const me = farmers.find((f) => f.id === currentFarmerId)
  const navigate = useNavigate()
  const { fontPx, setFontPx } = useOutletContext<FarmerOutletCtx>()

  return (
    <div className="mx-auto max-w-md">
      {/* 個人資料 */}
      <div className="rounded-card border border-line bg-white p-5 space-y-3">
        <div>
          <div className="text-base text-ink2">農場名稱</div>
          <div className="text-2xl font-bold text-ink">{me?.farm}</div>
        </div>
        <div>
          <div className="text-base text-ink2">聯絡人</div>
          <div className="text-xl text-ink">{me?.name}</div>
        </div>
        <div>
          <div className="text-base text-ink2">聯絡電話</div>
          <div className="text-xl text-ink">{me?.phone}</div>
        </div>
      </div>

      {/* 字體大小 */}
      <div className="mt-4 rounded-card border border-line bg-white p-5">
        <div className="text-base font-bold text-ink2">字體大小</div>
        <div className="mt-3 flex gap-2">
          {FONT_LEVELS.map((lv) => {
            const active = lv.px === fontPx
            return (
              <button
                key={lv.px}
                onClick={() => setFontPx(lv.px)}
                className={`flex-1 rounded border-2 text-base font-bold ${
                  active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'
                }`}
                style={{ minHeight: 52 }}
              >
                {lv.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-base text-ink2">調整後整個畫面的字會跟著變大或變小。</p>
      </div>

      <BigButton variant="secondary" className="mt-6 w-full" onClick={() => navigate('/farmer/login')}>
        登出
      </BigButton>
    </div>
  )
}
