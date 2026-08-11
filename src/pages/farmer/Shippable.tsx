import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import ProductGroupList from '../../components/ProductGroupList'
import EnterpriseGroupList from '../../components/EnterpriseGroupList'
import { useBulkTypeFilter } from '../../components/BulkTypeToggle'
import { EmptyState } from '../../components/States'
import { useShippableFilter } from '../../components/ShippableFilter'
import { isInShippablePage, isCancelHidden, sortForFarmer } from '../../utils/shipDate'
import type { FarmerOutletCtx } from './FarmerLayout'

export default function Shippable() {
  const { orders, currentFarmerId, loading, error } = useStore()
  const { setNavLocked, today } = useOutletContext<FarmerOutletCtx>()

  // memo：sortForFarmer 實測 n=300 要 7.97ms（桌機）／平板約 30–60ms。
  // 不 memo 的話，關鍵字每打一個字、下拉重整每一帧都會重跑整份排序。
  const list = useMemo(
    () =>
      sortForFarmer(
        orders.filter((o) => o.farmerId === currentFarmerId && isInShippablePage(o, today) && !isCancelHidden(o, today)),
        today
      ),
    [orders, currentFarmerId, today]
  )
  // 先依訂單類別（一般 / 7-11 / 企業送禮）切換，再套搜尋與品項篩選
  const { bulkType, filtered: byType, toggle } = useBulkTypeFilter(list)
  const { filtered, filterBar } = useShippableFilter(byType)

  if (loading) return <EmptyState message="載入中…" />
  if (error) return <EmptyState message={`載入失敗：${error}`} />

  if (list.length === 0) {
    return <EmptyState message="今天沒有要出的貨，辛苦了！可到「出貨預告」看接下來的單。" />
  }

  return (
    <div>
      {/* 訂單類別另起一列、不與篩選列併排：它高 56（內層 52 + border-2），
          而篩選列走 .pg-hbtn 的 44——兩個高度擠在同一列，齊不了也讀不出主從。
          分兩列還讓語意站對位置：類別是「看哪一批貨」，搜尋與品項是「在這批裡找」。
          ⚠️ 多數農友沒有 7-11／企業單，toggle 是 null，實際上只會看到一列。 */}
      <div className="mb-4 space-y-2">
        {toggle}
        {filterBar}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="沒有符合篩選的單" />
      ) : bulkType === '企業送禮' ? (
        <EnterpriseGroupList orders={filtered} mode="print" setNavLocked={setNavLocked} today={today} />
      ) : (
        <ProductGroupList orders={filtered} mode="print" setNavLocked={setNavLocked} today={today} />
      )}
    </div>
  )
}
