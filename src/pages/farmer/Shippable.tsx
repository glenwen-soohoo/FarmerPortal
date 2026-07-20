import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import ProductGroupList from '../../components/ProductGroupList'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'
import { useBulkTypeFilter } from '../../components/BulkTypeToggle'
import FilterBar from '../../components/FilterBar'
import { isInShippablePage, isCancelHidden, sortForFarmer } from '../../utils/shipDate'
import type { FarmerOutletCtx } from './FarmerLayout'

export default function Shippable() {
  const { orders, currentFarmerId } = useStore()
  const { setNavLocked, today } = useOutletContext<FarmerOutletCtx>()

  const list = sortForFarmer(
    orders.filter((o) => o.farmerId === currentFarmerId && isInShippablePage(o, today) && !isCancelHidden(o, today)),
    today
  )
  const { filtered: byType, toggle } = useBulkTypeFilter(list)
  const { filtered, filterButton, filterPanel } = useListFilter(byType, { keyword: true })

  if (list.length === 0) {
    return <EmptyState message="今天沒有要出的貨，辛苦了！可到「出貨預告」看接下來的單。" />
  }

  return (
    <div>
      <FilterBar
        toggle={toggle}
        filter={
          <>
            {filterButton}
            {filterPanel}
          </>
        }
      />
      {filtered.length === 0 ? (
        <EmptyState message="沒有符合篩選的單" />
      ) : (
        <ProductGroupList orders={filtered} mode="print" setNavLocked={setNavLocked} today={today} />
      )}
    </div>
  )
}
