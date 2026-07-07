import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import BigButton from '../../components/BigButton'

export default function Me() {
  const { farmers, currentFarmerId } = useStore()
  const me = farmers.find((f) => f.id === currentFarmerId)
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-md">
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

      <BigButton variant="secondary" className="mt-6 w-full" onClick={() => navigate('/farmer/login')}>
        登出
      </BigButton>
    </div>
  )
}
