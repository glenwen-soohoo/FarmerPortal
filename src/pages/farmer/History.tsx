import { useStore } from '../../store'
import OrderCard from '../../components/OrderCard'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'

// 出貨紀錄：只含「已出貨」（黑貓已收貨後才進來）。已印單仍留在「可出貨」頁等收貨。
export default function History() {
  const { orders, currentFarmerId } = useStore()
  const list = orders.filter((o) => o.farmerId === currentFarmerId && o.shipStatus === '已出貨')
  const { filtered, filterButton, filterPanel } = useListFilter(list)

  return (
    <div>
      <div className="mx-auto mb-4 max-w-2xl">
        {filterButton}
        {filterPanel}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={list.length === 0 ? '尚無出貨紀錄' : '沒有符合篩選的單'} />
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  )
}
