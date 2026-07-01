import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore, sortShippable } from '../../store'
import OrderCard from '../../components/OrderCard'
import BigButton from '../../components/BigButton'
import ConfirmDialog from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'
import { isInShippablePage } from '../../utils/shipDate'
import type { Order } from '../../types'
import type { FarmerOutletCtx } from './FarmerLayout'

const COFFEE = '#7A5230'
type Mode = null | 'print' | 'receive'

// 批次收貨只針對「已印單」；批次列印所有可出貨頁的單皆可
const isEligible = (o: Order, mode: Mode) => (mode === 'receive' ? o.shipStatus === '已印單' : true)

export default function Shippable() {
  const { orders, currentFarmerId, printOrder, shipOrder } = useStore()
  const { setNavLocked, today } = useOutletContext<FarmerOutletCtx>()

  const list = sortShippable(
    orders.filter((o) => o.farmerId === currentFarmerId && isInShippablePage(o, today))
  )
  const { filtered, filterButton, filterPanel, activeCount } = useListFilter(list)

  const [mode, setMode] = useState<Mode>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [processing, setProcessing] = useState(false)

  const batch = mode !== null
  useEffect(() => {
    setNavLocked(batch)
    return () => setNavLocked(false)
  }, [batch, setNavLocked])

  // 可批次列印的單（任何可出貨頁的單）；可批次收貨的單（已印單）
  const printableCount = list.length
  const receivableCount = list.filter((o) => o.shipStatus === '已印單').length

  const enter = (m: Mode) => {
    setMode(m)
    setSelected(new Set())
  }
  const cancelBatch = () => {
    setMode(null)
    setSelected(new Set())
  }
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const eligibleFiltered = filtered.filter((o) => isEligible(o, mode))
  const allSelected = eligibleFiltered.length > 0 && eligibleFiltered.every((o) => selected.has(o.id))
  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(eligibleFiltered.map((o) => o.id)))

  const doBatch = () => {
    setConfirming(false)
    setProcessing(true)
    const act = mode === 'receive' ? shipOrder : printOrder
    const ids = [...selected]
    window.setTimeout(() => {
      ids.forEach((id) => act(id))
      setProcessing(false)
      cancelBatch()
    }, 1600)
  }

  const confirmLabel = mode === 'receive' ? '確認勾選收貨' : '列印勾選訂單'

  return (
    <div>
      {/* 動作列。批次鈕與篩選鈕同一列高度 */}
      {!batch ? (
        <div className="mx-auto mb-4 max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            {filterButton}
            <div className="flex gap-2">
              <BigButton size="md" variant="secondary" onClick={() => enter('print')} disabled={printableCount === 0}>
                批次列印出貨單
              </BigButton>
              <button
                onClick={() => enter('receive')}
                disabled={receivableCount === 0}
                className="rounded px-4 text-base font-bold text-white disabled:opacity-40"
                style={{ minHeight: 48, background: COFFEE }}
              >
                批次黑貓收貨
              </button>
            </div>
          </div>
          {filterPanel}
        </div>
      ) : (
        <div className="mx-auto mb-4 flex max-w-2xl items-center gap-3">
          {/* 左：篩選按鈕（批次模式鎖住；若有作用中篩選仍顯示綠色數量） */}
          <button
            disabled
            className="inline-flex items-center gap-2 rounded border border-line bg-white px-4 text-base font-medium text-ink opacity-40"
            style={{ minHeight: 44 }}
          >
            篩選
            {activeCount > 0 && <span className="rounded-full bg-brand px-2 text-sm text-white">{activeCount}</span>}
          </button>
          <BigButton size="md" variant="secondary" onClick={cancelBatch}>
            取消
          </BigButton>
          <span className="ml-auto text-base text-ink2">已勾選 {selected.size} 筆</span>
          <BigButton size="md" variant="secondary" onClick={toggleSelectAll} disabled={eligibleFiltered.length === 0}>
            {allSelected ? '取消全選' : '全選'}
          </BigButton>
          {mode === 'receive' ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={selected.size === 0}
              className="rounded px-4 text-base font-bold text-white disabled:opacity-40"
              style={{ minHeight: 48, background: COFFEE }}
            >
              {confirmLabel}
            </button>
          ) : (
            <BigButton size="md" disabled={selected.size === 0} onClick={() => setConfirming(true)}>
              {confirmLabel}
            </BigButton>
          )}
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
              selectDisabled={batch && !isEligible(o, mode)}
              onToggleSelect={() => toggle(o.id)}
            />
          ))}
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={mode === 'receive' ? '批次黑貓收貨' : '批次列印出貨單'}
          message={
            mode === 'receive'
              ? `確定勾選的 ${selected.size} 筆都已由黑貓收貨？確認後即完成出貨、不能再修改囉。`
              : `確定要列印勾選的 ${selected.size} 筆出貨單嗎？`
          }
          confirmText={mode === 'receive' ? '確認收貨' : '開始列印'}
          onConfirm={doBatch}
          onCancel={() => setConfirming(false)}
        />
      )}

      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,43,38,0.4)' }}>
          <div className="rounded-card bg-white px-10 py-8 text-center">
            <p className="text-2xl font-bold text-ink">
              {mode === 'receive' ? '批次收貨處理中…' : '批次列印中…'}
            </p>
            <p className="mt-2 text-base text-ink2">
              {mode === 'receive' ? `共 ${selected.size} 筆` : `請至印表機取單（共 ${selected.size} 張）`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
