import { useStore } from '../../store'
import OrderCard from '../../components/OrderCard'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'

export default function Upcoming() {
  const { orders, currentFarmerId } = useStore()
  const list = orders.filter((o) => o.farmerId === currentFarmerId && o.shipStatus === '未達出貨時間')
  const { filtered, filterButton, filterPanel } = useListFilter(list)

  return (
    <div>
      <div className="mx-auto mb-4 max-w-2xl">
        {filterButton}
        {filterPanel}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={list.length === 0 ? '目前沒有預告中的單' : '沒有符合篩選的單'} />
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          <p className="text-base text-ink2">以下訂單還沒到出貨時間，先讓您有心理準備，暫時還不能出貨。</p>
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} upcoming />
          ))}
        </div>
      )}
    </div>
  )
}
