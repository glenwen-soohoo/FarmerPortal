import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore, sortShippable } from '../../store'
import OrderCard from '../../components/OrderCard'
import BigButton from '../../components/BigButton'
import ConfirmDialog from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'
import { isInShippablePage } from '../../utils/shipDate'
import type { FarmerOutletCtx } from './FarmerLayout'

export default function Shippable() {
  const { orders, currentFarmerId, printOrder } = useStore()
  const { setNavLocked, today } = useOutletContext<FarmerOutletCtx>()

  // 依測試日期分桶：已印單/改單待重印固定在此頁；可出貨(原始)須「已達出貨起始日」才留在此頁，否則落到出貨預告
  const list = sortShippable(
    orders.filter((o) => o.farmerId === currentFarmerId && isInShippablePage(o, today))
  )
  const { filtered, filterButton, filterPanel, activeCount } = useListFilter(list)

  // 批次列印模式
  const [batch, setBatch] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    setNavLocked(batch)
    return () => setNavLocked(false)
  }, [batch, setNavLocked])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const cancelBatch = () => {
    setBatch(false)
    setSelected(new Set())
  }
  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((o) => o.id)))
  const doBatchPrint = () => {
    setConfirming(false)
    setPrinting(true)
    window.setTimeout(() => {
      selected.forEach((id) => printOrder(id))
      setPrinting(false)
      cancelBatch()
    }, 1600)
  }

  return (
    <div>
      {/* 動作列。批次鈕與篩選鈕同一列高度 */}
      {!batch ? (
        <div className="mx-auto mb-4 max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            {filterButton}
            <BigButton size="md" variant="secondary" onClick={() => setBatch(true)} disabled={list.length === 0}>
              批次列印出貨單
            </BigButton>
          </div>
          {filterPanel}
        </div>
      ) : (
        <div className="mx-auto mb-4 flex max-w-2xl items-center gap-3">
          {/* 左：篩選按鈕（批次模式鎖住；若有作用中篩選仍顯示綠色數量）+ 全選 */}
          <button
            disabled
            className="inline-flex items-center gap-2 rounded border border-line bg-white px-4 text-base font-medium text-ink opacity-40"
            style={{ minHeight: 44 }}
          >
            篩選
            {activeCount > 0 && <span className="rounded-full bg-brand px-2 text-sm text-white">{activeCount}</span>}
          </button>
          {/* 取消移到左側（篩選旁）；全選移到列印勾選訂單左邊 */}
          <BigButton size="md" variant="secondary" onClick={cancelBatch}>
            取消
          </BigButton>
          <span className="ml-auto text-base text-ink2">已勾選 {selected.size} 筆</span>
          <BigButton size="md" variant="secondary" onClick={toggleSelectAll} disabled={filtered.length === 0}>
            {allSelected ? '取消全選' : '全選'}
          </BigButton>
          <BigButton size="md" disabled={selected.size === 0} onClick={() => setConfirming(true)}>
            列印勾選訂單
          </BigButton>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState message={list.length === 0 ? '目前沒有要出貨的單' : '沒有符合篩選的單'} />
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              selectable={batch}
              selected={selected.has(o.id)}
              onToggleSelect={() => toggle(o.id)}
            />
          ))}
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title="批次列印出貨單"
          message={`確定要列印勾選的 ${selected.size} 筆出貨單嗎？`}
          confirmText="開始列印"
          onConfirm={doBatchPrint}
          onCancel={() => setConfirming(false)}
        />
      )}

      {printing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,43,38,0.4)' }}>
          <div className="rounded-card bg-white px-10 py-8 text-center">
            <p className="text-2xl font-bold text-ink">批次列印中…</p>
            <p className="mt-2 text-base text-ink2">請至印表機取單（共 {selected.size} 張）</p>
          </div>
        </div>
      )}
    </div>
  )
}
