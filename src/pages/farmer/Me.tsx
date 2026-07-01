import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../../store'
import BigButton from '../../components/BigButton'

export default function Me() {
  const { farmers, currentFarmerId } = useStore()
  const me = farmers.find((f) => f.id === currentFarmerId)
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-xl font-bold text-ink">我的</h2>
      <div className="rounded-card border border-line bg-white p-5 space-y-3">
        <div>
          <div className="text-base text-ink2">農場名稱</div>
          <div className="text-xl text-ink">{me?.farm}</div>
        </div>
        <div>
          <div className="text-base text-ink2">聯絡電話</div>
          <div className="text-xl text-ink">{me?.phone}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link to="/farmer/history">
          <BigButton variant="secondary" className="w-full">
            出貨紀錄
          </BigButton>
        </Link>
        <BigButton variant="secondary" className="w-full" onClick={() => navigate('/farmer/login')}>
          登出
        </BigButton>
      </div>
    </div>
  )
}
