import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import ProductGroupList from '../../components/ProductGroupList'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'
import { isInUpcomingPage, sortForFarmer } from '../../utils/shipDate'
import type { FarmerOutletCtx } from './FarmerLayout'

export default function Upcoming() {
  const { orders, currentFarmerId } = useStore()
  const { today, earlyEligible, setNavLocked } = useOutletContext<FarmerOutletCtx>()

  const list = sortForFarmer(
    orders.filter((o) => o.farmerId === currentFarmerId && isInUpcomingPage(o, today))
  )
  const { filtered, filterButton, filterPanel } = useListFilter(list)

  return (
    <div>
      <div className="mx-auto mb-4 max-w-4xl">
        {filterButton}
        {filterPanel}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={list.length === 0 ? '目前沒有預告中的單' : '沒有符合篩選的單'} />
      ) : (
        <div className="mx-auto max-w-4xl space-y-3">
          <p className="text-base text-ink2">以下訂單還沒到出貨時間，先讓您有心理準備，暫時還不能出貨。</p>
          {/* 依商品分區大卡片；有提早資格時右上角有批次提早印單（只印同商品） */}
          <ProductGroupList orders={filtered} mode="early" earlyEligible={earlyEligible} setNavLocked={setNavLocked} />
        </div>
      )}
    </div>
  )
}
