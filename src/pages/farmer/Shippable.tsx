import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import ProductGroupList from '../../components/ProductGroupList'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'
import { isInShippablePage, sortForFarmer } from '../../utils/shipDate'
import type { FarmerOutletCtx } from './FarmerLayout'

export default function Shippable() {
  const { orders, currentFarmerId } = useStore()
  const { setNavLocked, today } = useOutletContext<FarmerOutletCtx>()

  const list = sortForFarmer(
    orders.filter((o) => o.farmerId === currentFarmerId && isInShippablePage(o, today))
  )
  const { filtered, filterButton, filterPanel } = useListFilter(list)

  return (
    <div>
      <div className="mx-auto mb-4 max-w-4xl">
        {filterButton}
        {filterPanel}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={list.length === 0 ? '目前沒有要出貨的單' : '沒有符合篩選的單'} />
      ) : (
        <div className="mx-auto max-w-4xl">
          {/* 依商品分區大卡片；批次列印出貨單在各大卡片右上角（只印同商品） */}
          <ProductGroupList orders={filtered} mode="print" setNavLocked={setNavLocked} />
        </div>
      )}
    </div>
  )
}
