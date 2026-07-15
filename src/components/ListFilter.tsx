import { useMemo, useState, type ReactNode } from 'react'
import type { Order, ShipStatus } from '../types'
import { Picker } from './Picker'
import CalendarPicker from './CalendarPicker'

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
  status?: boolean // 顯示出貨狀態四分類按鈕（預設「已出貨」）
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
      className={`flex flex-1 items-center justify-between rounded-lg border border-line px-3 text-left ${
        disabled ? 'cursor-not-allowed bg-mutedbg' : 'bg-white'
      }`}
      style={{ minHeight: 52 }}
    >
      <span className={`text-lg font-medium ${disabled ? 'text-muted' : value ? 'text-ink' : 'text-muted'}`}>
        {value || placeholder}
      </span>
      <span className="text-ink2">▾</span>
    </button>
  )
}

// 左標籤 + 右欄位的一列
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-base text-ink2">{label}</span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  )
}

// 出貨日區間比對：MM/DD 同年度字典序＝時間序。未輸入起 → 不限開始；未輸入迄 → 不限結束。
function inDayRange(day: string | undefined, from: string, to: string) {
  if (!from && !to) return true
  if (!day) return false
  if (from && day < from) return false
  if (to && day > to) return false
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
  const withKeyword = !!opts?.keyword
  const withStatus = !!opts?.status
  const advanced = withStatus // 進階面板（所有訂單）：商品名+規格併列；僅開關鍵字的頁面維持各自一列
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [name, setName] = useState('')
  const [spec, setSpec] = useState('')
  const [keyword, setKeyword] = useState('')
  const [ship, setShip] = useState<ShipGroup>('shipped') // 預設「已出貨」
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
      className={`flex w-full items-center justify-between border-2 border-line bg-white px-4 ${
        open ? 'rounded-t-lg border-b-0' : 'rounded-lg'
      }`}
      style={{ minHeight: 56 }}
    >
      <span className="flex flex-wrap items-center gap-2 text-lg font-bold text-ink">
        篩選
        {(from || to) && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">時間</span>}
        {name && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">商品</span>}
        {spec && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">規格</span>}
        {withKeyword && kw && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">關鍵字</span>}
        {withStatus && ship !== 'all' && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">
            {SHIP_GROUPS.find((g) => g.value === ship)?.label}
          </span>
        )}
      </span>
      <span className="text-lg text-ink2">{open ? '▲' : '▼'}</span>
    </button>
  )

  const filterPanel = (
    <>
      {open && (
        <div className="anim-slide-down space-y-3 rounded-b-lg border-2 border-line bg-white p-4">
          {/* 出貨日：一個標籤，輸入分起～迄 */}
          <Row label="出貨日">
            <Trigger value={from} placeholder="起" onClick={() => setPicker('from')} />
            <span className="text-ink2">～</span>
            <Trigger value={to} placeholder="迄" onClick={() => setPicker('to')} />
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
            <Row label="關鍵字">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="收件人 / 手機 / 訂單編號 / 物流編號"
                className="min-w-0 flex-1 rounded-lg border border-line px-3 text-lg text-ink"
                style={{ minHeight: 52 }}
              />
            </Row>
          )}
          {/* 出貨狀態：四分類按鈕（預設「已出貨」），放最下方 */}
          {withStatus && (
            <Row label="出貨狀態">
              <div className="flex flex-1 gap-2">
                {SHIP_GROUPS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setShip(g.value)}
                    className={`flex-1 rounded-lg border-2 text-base font-bold ${
                      ship === g.value ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink2'
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
                if (withStatus) setShip('shipped')
              }}
              className="w-full rounded-lg border-2 border-line text-base font-medium text-brand"
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
