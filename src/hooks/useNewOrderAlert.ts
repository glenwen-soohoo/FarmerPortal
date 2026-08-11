import { useEffect, useRef, useState } from 'react'
import type { Order } from '../types'
import { isInShippablePage } from '../utils/shipDate'
import { fireNewOrderAlert, isAlertEnabled } from '../utils/newOrderAlert'

/**
 * 偵測「新出現且今天要出貨」的訂單,觸發震動 + 提示音,並回傳畫面提示條要用的筆數。
 *
 * - baseline 記已見過的**訂單編號**(orderNumber,訂單層去重;一張多品項的新單只算一筆)。
 * - 「首次載入完成」才建基準、不提醒:baseline 只在觀察到 loading 由 true→false(一次真正 fetch 結束)時建立,
 *   避免用 store 初始的空清單(loading 尚為 false)建成空基準、把既有整批當新單狂響。
 * - 之後每次資料更新(SignalR 推播 / 下拉 / 前景 refetch 皆走靜默 reload、不動 loading):
 *   新增的訂單編號中「今天要出貨(isInShippablePage)」者 → 累加 newCount;開關開啟時同時 fireNewOrderAlert()。
 *   非今日的新單只推進 baseline、不提醒(日後轉可出貨也不會誤報)。
 * - today 變動(dev 面板改測試日)不會誤報:baseline 已含當前所有編號,diff 為空。
 */
export function useNewOrderAlert(orders: Order[], farmerId: number, today: string, loading: boolean) {
  const baseline = useRef<Set<string> | null>(null)
  const hasLoaded = useRef(false)
  const prevLoading = useRef(loading)
  const lastFarmerId = useRef(farmerId)
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    // 切換農友(理論上會重掛,防禦性重置):清基準、旗標與提示。
    if (lastFarmerId.current !== farmerId) {
      lastFarmerId.current = farmerId
      baseline.current = null
      hasLoaded.current = false
      setNewCount(0)
    }

    const wasLoading = prevLoading.current
    prevLoading.current = loading
    if (loading) return // 載入中不判斷

    const mine = orders.filter((o) => o.farmerId === farmerId)
    const allNums = new Set(mine.map((o) => o.orderNumber))

    // 尚未完成過任何一次真正載入 → 僅在「剛從 loading 結束」時建基準(不提醒);純初始的 false 略過。
    if (!hasLoaded.current) {
      if (wasLoading) {
        hasLoaded.current = true
        baseline.current = allNums
      }
      return
    }

    const shippableTodayNums = new Set(
      mine.filter((o) => isInShippablePage(o, today)).map((o) => o.orderNumber)
    )
    let fresh = 0
    for (const n of allNums) {
      if (!baseline.current!.has(n) && shippableTodayNums.has(n)) fresh++
    }

    baseline.current = allNums // 推進基準(含非今日新單)

    if (fresh > 0) {
      setNewCount((c) => c + fresh)
      if (isAlertEnabled()) fireNewOrderAlert()
    }
  }, [orders, farmerId, today, loading])

  return { newCount, dismiss: () => setNewCount(0) }
}
