import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 70 // 觸發更新的下拉距離（px）
const MAX = 90 // 最大下拉距離
const RESISTANCE = 0.5 // 阻力：實際位移 = 手指位移 × 此值

/**
 * 下拉重整（給 WebView / 觸控用）。掛在捲動容器：捲到最頂再往下拉 → 放開觸發 onRefresh。
 * 作為 SignalR 斷線時的手動同步 / 重連手勢。回傳 ref 掛到捲動元素、目前下拉距離與更新中狀態供畫指示器。
 * disabled（如批次模式）時完全不作用。
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, disabled = false) {
  const scrollRef = useRef<HTMLElement>(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // 用 ref 持有隨 render 變動的值，讓事件監聽只綁一次、不重綁。
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let startY = 0
    let pulling = false

    const setPullBoth = (v: number) => {
      pullRef.current = v
      setPull(v)
    }

    const onStart = (e: TouchEvent) => {
      if (disabledRef.current || refreshingRef.current) return
      if (el.scrollTop > 0) return
      startY = e.touches[0].clientY
      pulling = true
    }
    const onMove = (e: TouchEvent) => {
      if (!pulling) return
      if (el.scrollTop > 0) {
        pulling = false
        setPullBoth(0)
        return
      }
      const dy = e.touches[0].clientY - startY
      if (dy <= 0) {
        setPullBoth(0)
        return
      }
      const dist = Math.min(MAX, dy * RESISTANCE)
      setPullBoth(dist)
      if (dist > 5) e.preventDefault() // 阻止原生捲動/彈跳，讓下拉指示可見
    }
    const onEnd = async () => {
      if (!pulling) return
      pulling = false
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true
        setRefreshing(true)
        setPullBoth(THRESHOLD)
        try {
          await onRefreshRef.current()
        } finally {
          refreshingRef.current = false
          setRefreshing(false)
          setPullBoth(0)
        }
      } else {
        setPullBoth(0)
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  return { scrollRef, pull, refreshing, threshold: THRESHOLD }
}
