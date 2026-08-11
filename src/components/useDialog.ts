import { useEffect, useRef, type RefObject } from 'react'

// 彈窗內實際會出現的可聚焦型別。刻意不含 [contenteditable]（專案沒有這種欄位）。
// `:not([disabled])` 直接寫在選擇器裡，因為 FailDialog 的「下一步」與 BigButton 的 disabled 狀態
// 都必須被排除在 Tab 循環外，否則農友按 Tab 會停在按不動的鈕上。
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 同時開兩層彈窗時只有最上層該回應 Esc 與 Tab。
 * ⚠️ 不能靠 `stopPropagation` 做到——document 上的多個 keydown 監聽彼此獨立，
 * `stopPropagation` 只擋「傳到其他節點」，擋不掉同一節點上的其他監聽（那要 `stopImmediatePropagation`，
 * 但那會連應用層其他正當監聽一起殺掉）。所以改用模組層堆疊自行判斷「我是不是最上層」。
 *
 * 現有 9 個彈窗都不會疊（Picker / CalendarPicker 的 z-[60] 是為了蓋住 ListFilter 的**內嵌**面板，
 * 不是蓋另一個彈窗），這裡是防止之後加了疊層卻靜默地兩層一起關。
 * 依賴 React「先掛載的 effect 先跑」：疊層一律是先開 A、之後某次點擊才開 B，B 的 effect 在後 → B 在堆疊頂。
 */
const stack: symbol[] = []

/**
 * 彈窗共用行為：Esc 關閉 ＋ 焦點管理（初始焦點、Tab 鎖在面板內、關閉後還原）。
 *
 * 用法：把回傳的 ref 掛到面板容器，**容器必須帶 `tabIndex={-1}`**，否則 `focus()` 無效。
 * hook 必須隨彈窗一起掛載／卸載——寫在「彈窗沒開也會 render」的元件頂層，
 * 會讓它一直占著焦點堆疊頂、把其他彈窗的 Esc 吃掉。所以條件渲染的面板要抽成子元件。
 *
 * `focusKey`：面板內容整批換掉、但**容器節點沒換**時傳它。目前 FailDialog 與 BatchFailDialog
 * 都用得到——它們兩步是同一個元件的兩段 return，兩段的根元素都是同型別 div、位置也相同，
 * React 會重用容器節點（ref 不會再觸發），只替換子樹。原本聚焦的那顆鈕被換掉後
 * 焦點會掉回 `<body>`，讀屏也不會知道換了一步。傳 `confirming` 進來就會重新聚焦容器、重念一次標題。
 *
 * 初始焦點給容器、不給任何按鈕：FailDialog / BatchFailDialog 的主要動作是破壞性的（回報無法出貨），
 * autofocus 到那顆鈕等於農友一個 Enter 就送出。焦點落在帶 `role="dialog"` 的容器上，
 * 讀屏會念出彈窗標題與角色，而且沒有任何動作被預先架好。
 *
 * 沒做的兩件事：① 背景 `inert`／`aria-hidden`（靠 `aria-modal="true"` 表達模態，不動應用根節點）
 * ② body 捲動鎖（會動到現有捲動行為，屬於要在平板上實測的改動）。
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(
  onClose: () => void,
  focusKey?: unknown
): RefObject<T> {
  const panelRef = useRef<T>(null)
  // 開啟前的焦點，關閉後還原。undefined = 還沒記過；不能用 null 當哨兵，
  // 因為 document.activeElement 本身就可能是 null。
  const restoreRef = useRef<Element | null | undefined>(undefined)
  // onClose 存 ref、讓下面的鍵盤 effect 依賴是空陣列。呼叫端多半傳 inline arrow
  // （`onCancel={() => setAskPrint(false)}`），若列進依賴就會每次 render 重掛監聽、
  // 並把自己重新推上堆疊頂——兩層彈窗時下層一 render 就搶走「最上層」身分，堆疊等於白做。
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    // 記在聚焦之前，否則抓到的會是面板自己。
    if (restoreRef.current === undefined) restoreRef.current = document.activeElement
    panelRef.current?.focus()
  }, [focusKey])

  useEffect(() => {
    const token = Symbol('dialog')
    stack.push(token)

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      // 每次 Tab 重新查：彈窗內容會依狀態變（選了原因才啟用「下一步」、匯入結果的表格列數不定），
      // 快取清單會抓到過期或已 disabled 的節點。
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      )
      const active = document.activeElement
      if (items.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey) {
        // 焦點在容器上時往前 Tab 會離開彈窗（容器排在所有內容之前），要繞回最後一顆。
        if (active === first || active === panel || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !panel.contains(active)) {
        // 往後不用管「焦點在容器上」：容器是內容的祖先，瀏覽器自然會走到第一顆。
        e.preventDefault()
        first.focus()
      }
    }

    // capture：不要被底層元件的 keydown 先吃掉（先前 FailDialog 第二步就關不掉）。
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      stack.splice(stack.indexOf(token), 1)
    }
  }, [])

  // 關閉後還原焦點。isConnected 檢查是因為觸發彈窗的那顆鈕可能已隨清單重抓被換掉
  // （SignalR 推播會重繪訂單卡），對已脫離文件的節點 focus() 沒有效果、焦點會留在 body。
  useEffect(
    () => () => {
      const el = restoreRef.current
      if (el instanceof HTMLElement && el.isConnected) el.focus()
    },
    []
  )

  return panelRef
}
