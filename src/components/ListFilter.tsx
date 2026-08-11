import { useId, useMemo, useState, type ReactNode } from 'react'
import type { Order, ShipStatus } from '../types'
import { Picker } from './Picker'
import CalendarPicker from './CalendarPicker'
import { mmdd, mmddToIso } from '../utils/shipDate'

const uniq = (arr: string[]) => Array.from(new Set(arr))
const opt = (arr: string[], allLabel = '全部') => [
  { label: allLabel, value: '' },
  ...arr.map((v) => ({ label: v, value: v })),
]

// 出貨狀態四分類（所有訂單查詢用）：已出貨 / 未出貨（流程中）/ 其他（例外）/ 全部
export type ShipGroup = 'all' | 'unshipped' | 'shipped' | 'other'
const SHIPPED_SET = new Set<ShipStatus>(['已出貨', '已到貨'])
const OTHER_SET = new Set<ShipStatus>(['無法出貨', '訂單失敗'])
function shipGroupOf(s: ShipStatus): Exclude<ShipGroup, 'all'> {
  if (SHIPPED_SET.has(s)) return 'shipped'
  if (OTHER_SET.has(s)) return 'other'
  return 'unshipped' // 未付款 / 未達出貨時間 / 可出貨 / 已印單 / 改單待重印 / 逾期未出
}
const SHIP_GROUPS: { label: string; value: ShipGroup }[] = [
  { label: '全部', value: 'all' },
  { label: '未出貨', value: 'unshipped' },
  { label: '已出貨', value: 'shipped' },
  { label: '其他', value: 'other' },
]

interface FilterOpts {
  keyword?: boolean // 顯示關鍵字欄位（訂單編號 / 收件人 / 地址）
  status?: boolean // 顯示出貨狀態四分類按鈕（預設「全部」）。目前只有「所有訂單查詢」開它
}

// 觸發鈕（顯示目前值 + ▾）。定義在模組層級，元件識別穩定，避免每次 render 重掛載導致輸入焦點丟失。
function Trigger({
  value,
  placeholder,
  onClick,
  disabled,
}: {
  value: string
  placeholder: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-between rounded-full border border-hairline px-4 text-left ${
        disabled ? 'cursor-not-allowed bg-inset' : 'bg-white'
      }`}
      style={{ minHeight: 52 }}
    >
      <span className={`text-lg font-medium ${disabled ? 'text-ink-faint' : value ? 'text-ink' : 'text-ink-faint'}`}>
        {value || placeholder}
      </span>
      <span className="text-ink-sub">▾</span>
    </button>
  )
}

// 左標籤 + 右欄位的一列。
// htmlFor 只在該列包的是真正可標記的表單控件時才傳（目前只有「關鍵字」的 <input>）——
// 其餘幾列包的是按鈕／Picker Trigger，<label htmlFor> 指過去會建立錯誤的關聯。
function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  const cls = 'w-16 shrink-0 text-base text-ink-sub'
  return (
    <div className="flex items-center gap-3">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={cls}>
          {label}
        </label>
      ) : (
        <span className={cls}>{label}</span>
      )}
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  )
}

// 出貨日區間比對。未輸入起 → 不限開始；未輸入迄 → 不限結束。
// 三個值都是完整 ISO 'YYYY-MM-DD'：shipWindow 由後端給、from/to 由 CalendarPicker 給，
// 所以直接字典序比即可（day 仍過一次 mmddToIso 削掉可能帶的時間部分）。
//
// ⚠️ 曾經壞過兩次，都是「格式混著比」：一次是 CalendarPicker 產 'MM/DD' 直接和 ISO 比
// （'2026-07-25' > '08/01' 為 true，設了「迄」就把全部單濾光），一次是補年份時硬寫 2026。
// 現在 CalendarPicker 直接輸出 ISO，這裡不再需要補年份。
function inDayRange(day: string | undefined, from: string, to: string) {
  if (!from && !to) return true
  if (!day) return false
  const d = mmddToIso(day)
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

/**
 * 列表分頁（需出貨 / 出貨預告 / 所有訂單）共用的篩選。
 * 標籤放左邊、欄位放右邊；出貨日只用一個標籤，但輸入仍分「起 ～ 迄」。
 */
export function useListFilter(orders: Order[], opts?: FilterOpts): {
  filtered: Order[]
  filterButton: ReactNode
  filterPanel: ReactNode
  activeCount: number
} {
  // useId：同頁若出現兩個篩選面板也不會撞 id（label htmlFor 用）
  const keywordId = `${useId()}-keyword`
  const withKeyword = !!opts?.keyword
  const withStatus = !!opts?.status
  const advanced = withStatus // 進階面板（所有訂單）：商品名+規格併列；僅開關鍵字的頁面維持各自一列
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [name, setName] = useState('')
  const [spec, setSpec] = useState('')
  const [keyword, setKeyword] = useState('')
  // 預設「全部」。⚠️ 原本是 'shipped'，但頁名叫「所有訂單查詢」、打開卻只顯示已出貨——
  // 沒有已出貨紀錄的農友（新農友、或這季還沒出過貨的）一進來就是「共 0 筆／沒有符合條件的訂單」，
  // 而底部分頁同時寫著「9 需出貨」，同一畫面兩個數字互相矛盾。
  // 在 withStatus 為 false 的頁面（需出貨、出貨預告）這個值完全惰性：:137 的判定是
  // `(!withStatus || ...)`、面板與標籤也都有 gate，所以改初值對那兩頁是 no-op。
  const [ship, setShip] = useState<ShipGroup>('all')
  const [picker, setPicker] = useState<null | 'from' | 'to' | 'name' | 'spec'>(null)

  // 商品名選項/比對用「清洗後品種 variety」（退回 productName）；避免下拉顯示完整原始品名（中秋嚴選【…】…）
  const cleanName = (o: Order) => (o.variety && o.variety.trim()) || o.productName
  const nameOptions = useMemo(() => uniq(orders.map(cleanName).filter(Boolean)), [orders])
  // 規格只列「已選商品」底下的規格；未選商品則不可選
  const specOptions = useMemo(
    () => (name ? uniq(orders.filter((o) => cleanName(o) === name).map((o) => o.spec).filter(Boolean)) : []),
    [orders, name]
  )

  const kw = keyword.trim()
  const filtered = orders.filter(
    (o) =>
      inDayRange(o.shipWindow?.[0], from.trim(), to.trim()) &&
      (!name || cleanName(o) === name) &&
      (!spec || o.spec === spec) &&
      (!withStatus || ship === 'all' || shipGroupOf(o.shipStatus) === ship) &&
      (!withKeyword ||
        !kw ||
        o.orderNumber.includes(kw) ||
        o.recipient.includes(kw) ||
        o.phone.includes(kw) ||
        o.address.includes(kw) ||
        (o.trackingNos ?? []).some((t) => t.includes(kw)))
  )
  // 「篩選中」數量：日期 / 商品 / 規格 / 關鍵字（出貨狀態視為常駐分頁、不計入，清除時另外還原）
  const activeCount = (from || to ? 1 : 0) + (name ? 1 : 0) + (spec ? 1 : 0) + (withKeyword && kw ? 1 : 0)

  const filterButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      /* ⚠️ 這顆刻意**不走膠囊**（其他控制都走了）：展開時它要與下方面板接成一體
         （`rounded-t-lg border-b-0` 配面板的 `rounded-b-lg`），膠囊上緣接方角面板會露出縫。
         它的角色是「會變成面板抬頭的展開鈕」，不是自由站立的控制。 */
      className={`flex w-full items-center justify-between border-2 border-hairline bg-white px-4 ${
        open ? 'rounded-t-lg border-b-0' : 'rounded-lg'
      }`}
      style={{ minHeight: 56 }}
    >
      <span className="flex flex-wrap items-center gap-2 text-lg font-bold text-ink">
        篩選
        {(from || to) && <span className="rounded-full bg-act/10 px-2 py-0.5 text-sm font-bold text-act">時間</span>}
        {name && <span className="rounded-full bg-act/10 px-2 py-0.5 text-sm font-bold text-act">商品</span>}
        {spec && <span className="rounded-full bg-act/10 px-2 py-0.5 text-sm font-bold text-act">規格</span>}
        {withKeyword && kw && <span className="rounded-full bg-act/10 px-2 py-0.5 text-sm font-bold text-act">關鍵字</span>}
        {withStatus && ship !== 'all' && (
          <span className="rounded-full bg-act/10 px-2 py-0.5 text-sm font-bold text-act">
            {SHIP_GROUPS.find((g) => g.value === ship)?.label}
          </span>
        )}
      </span>
      <span className="text-lg text-ink-sub">{open ? '▲' : '▼'}</span>
    </button>
  )

  const filterPanel = (
    <>
      {open && (
        <div className="anim-slide-down space-y-3 rounded-b-lg border-2 border-hairline bg-white p-4">
          {/* 出貨日：一個標籤，輸入分起～迄 */}
          {/* 觸發鈕只顯示 MM/DD：農友是用「幾月幾號」在想事情，四位年份佔掉窄螢幕的寬度。
              年份不是被丟掉——state 存的是完整 ISO，日曆打開時標題會寫著年份。 */}
          <Row label="出貨日">
            <Trigger value={mmdd(from)} placeholder="起" onClick={() => setPicker('from')} />
            <span className="text-ink-sub">～</span>
            <Trigger value={mmdd(to)} placeholder="迄" onClick={() => setPicker('to')} />
          </Row>
          {/* 進階面板（所有訂單）：商品名 + 規格併同一列左右擺；其餘分頁維持各自一列 */}
          {advanced ? (
            <Row label="商品規格">
              <Trigger value={name} placeholder="全部商品" onClick={() => setPicker('name')} />
              <Trigger value={spec} placeholder={name ? '全部規格' : '請先選商品'} disabled={!name} onClick={() => setPicker('spec')} />
            </Row>
          ) : (
            <>
              <Row label="商品名">
                <Trigger value={name} placeholder="全部" onClick={() => setPicker('name')} />
              </Row>
              <Row label="規格">
                <Trigger value={spec} placeholder={name ? '全部' : '請先選商品'} disabled={!name} onClick={() => setPicker('spec')} />
              </Row>
            </>
          )}
          {withKeyword && (
            <Row label="關鍵字" htmlFor={keywordId}>
              <input
                id={keywordId}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="收件人 / 手機 / 訂單編號 / 物流編號"
                className="min-w-0 flex-1 rounded-full border border-edge px-4 text-lg text-ink"
                style={{ minHeight: 52 }}
              />
            </Row>
          )}
          {/* 出貨狀態：四分類按鈕（預設「全部」），放最下方 */}
          {withStatus && (
            <Row label="出貨狀態">
              <div className="flex flex-1 gap-2">
                {SHIP_GROUPS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setShip(g.value)}
                    aria-pressed={ship === g.value}
                    className={`flex-1 rounded-full border-2 text-base font-bold ${
                      ship === g.value ? 'border-act bg-act text-white' : 'border-hairline bg-white text-ink-sub'
                    }`}
                    style={{ minHeight: 48 }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </Row>
          )}

          {activeCount > 0 && (
            <button
              onClick={() => {
                setFrom('')
                setTo('')
                setName('')
                setSpec('')
                setKeyword('')
                // ⚠️ 還原成 'all'（＝沒有篩選），不是 'shipped'。原本還原成 'shipped' 會讓
                // 「清除篩選」實際上**多套一個篩選**：實測從「全部」9 筆加日期變 0 筆後按清除，
                // 結果仍是 0 筆（狀態被設成已出貨），而且 activeCount 歸零讓這顆鈕自己消失，
                // 農友被留在空清單裡、沒有第二次機會。一顆叫「清除篩選」的鈕不該讓結果變少。
                if (withStatus) setShip('all')
              }}
              className="w-full rounded-full border-2 border-hairline text-base font-medium text-act"
              style={{ minHeight: 52 }}
            >
              清除篩選
            </button>
          )}
        </div>
      )}

      {picker === 'from' && (
        <CalendarPicker title="出貨日（起）" value={from} onSelect={setFrom} onClose={() => setPicker(null)} />
      )}
      {picker === 'to' && (
        <CalendarPicker title="出貨日（迄）" value={to} onSelect={setTo} onClose={() => setPicker(null)} />
      )}
      {picker === 'name' && (
        <Picker
          title="商品名"
          options={opt(nameOptions)}
          value={name}
          onSelect={(v) => {
            setName(v)
            setSpec('') // 換商品就清掉舊規格（規格是跟著商品的）
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'spec' && (
        <Picker title="規格" options={opt(specOptions)} value={spec} onSelect={setSpec} onClose={() => setPicker(null)} />
      )}
    </>
  )

  return { filtered, filterButton, filterPanel, activeCount }
}
