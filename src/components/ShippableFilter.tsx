import { useId, useMemo, useState } from 'react'
import type { Order } from '../types'
import { Picker } from './Picker'
import { productKey } from '../utils/product'

/**
 * 需出貨頁的篩選列：左邊一格搜尋、右邊一顆「品項」。
 *
 * 為什麼不掛回 useListFilter：那支的形狀是「整條展開鈕 + 內嵌面板」，而這裡是一列常駐控制
 * ＋ 一顆直接開 Picker 的鈕——不是同一個元件的兩種設定，是兩種東西。硬塞成第三個 opts
 * 旗標會讓 useListFilter 變成「依旗標長出兩套完全不同 DOM」的分岔元件。
 *
 * 需出貨頁不留出貨日與規格：出貨日在這頁幾乎篩不掉東西（這頁的定義就是「今天要出的 + 逾期的」），
 * 規格則已經在商品分區裡以小計 chip 呈現。（出貨預告頁跨未來多日，仍用完整的 useListFilter。）
 */
export function useShippableFilter(list: Order[]) {
  const [product, setProduct] = useState('')
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const searchId = `${useId()}-search`

  const kw = keyword.trim()
  const matchKw = (o: Order) =>
    !kw ||
    o.orderNumber.includes(kw) ||
    o.recipient.includes(kw) ||
    o.phone.includes(kw) ||
    o.address.includes(kw) ||
    (o.trackingNos ?? []).some((t) => t.includes(kw))

  // 兩份品項清單，各有各的用途，刻意不合併：
  //   allKeys  —— 從**未經關鍵字過濾**的清單來。負責「這顆鈕要不要出現」與「選中的品項是否還存在」。
  //               若改用關鍵字過濾後的清單，農友每打一個字這顆鈕就會閃現／消失，
  //               而且「打了關鍵字剛好排除掉選中的品項」會靜默把品項篩選清掉——那不是失效，是使用者還要的條件。
  //   options  —— 從關鍵字過濾後的清單來。彈窗裡的張數必須是「選下去真的會剩幾張」，否則數字對不上畫面。
  const allKeys = useMemo(() => new Set(list.map(productKey).filter(Boolean)), [list])
  const options = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of list) {
      if (!matchKw(o)) continue
      const k = productKey(o)
      if (k) m.set(k, (m.get(k) ?? 0) + 1)
    }
    // 順序＝第一次出現的順序，刻意不排序：清單已被 sortForFarmer 依急迫度排過，
    // 照這個順序列出來，彈窗的順序就和畫面上商品分區由上而下的順序一致。
    return [...m.entries()].map(([value, n]) => ({ value, n }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, kw])

  // 選中的品項可能已不在清單裡（切了訂單類別、或推播重抓後那品項剛好出完）→ 視同未篩選，
  // 否則畫面會停在空清單、而清空的鈕藏在彈窗裡。
  const active = allKeys.has(product) ? product : ''
  const filtered = list.filter((o) => (!active || productKey(o) === active) && matchKw(o))
  const matchedCount = list.filter(matchKw).length

  const filterBar = (
    /* justify-between 而不是讓搜尋欄吃掉整列：搜尋欄封頂 max-w-sm（24rem，
       剛好裝得下那串 placeholder），多出來的橫向空間留在中間，「品項」才停得住右緣、
       與商品組表頭的「批次列印」對齊（實測兩者右緣同為 968.3px）。 */
    <div className="flex items-center justify-between gap-2">
      <div className="relative flex min-w-0 max-w-sm flex-1 items-center">
        <input
          id={searchId}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="搜尋這頁的訂單"
          placeholder="收件人 / 手機 / 訂單編號 / 物流編號"
          /* 高度與右邊的「品項」同一條規格（.pg-hbtn 的 max(2.75rem, 44px)）：
             兩顆並排時上下緣才齊，且小字級時仍守得住 44px 觸控地板。
             ⚠️ pr 留給清除鈕，否則長關鍵字會鑽到 ✕ 底下。 */
          className="w-full rounded-full border border-edge bg-white pl-4 pr-12 text-base text-ink"
          style={{ minHeight: 'max(2.75rem, 44px)' }}
        />
        {kw && (
          /* 清除鈕給實際 44px 可點區（視覺仍是一個小 ✕）。
             不用 <input type="search"> 的原生 ✕：各家瀏覽器樣式不一，且 Android WebView 上不一定出現。 */
          <button
            type="button"
            onClick={() => setKeyword('')}
            aria-label="清除搜尋"
            className="absolute right-0 flex items-center justify-center text-ink-sub"
            style={{ width: 44, height: 44 }}
          >
            <span aria-hidden>✕</span>
          </button>
        )}
      </div>

      {/* 只有一種品項時篩了也是同一批 → 不顯示，比照類別切換鈕「沒有特殊類別就不出現」。 */}
      {allKeys.size >= 2 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          /* 借用 .pg-hbtn ——它就是這套系統的「描邊按鈕」（見 DESIGN.md Shapes 節末），
             商品組表頭的「批次列印」用的是同一顆。共用之後這顆的右緣、高度、圓角、
             edge 描邊與鍵感都跟批次列印對齊，不必再養第二套。
             ⚠️ .pg-hbtn-on 只換顏色、不動高度：若沿用 .pg-hbtn-pri（min-height 48）
             會讓整列在「有沒有篩選」之間跳 4px。 */
          className={`pg-hbtn shrink-0 ${active ? 'pg-hbtn-on' : ''}`}
        >
          {/* 截斷是防禦性的：品名優先取清洗後的品種名（都很短），但沒清洗到的單會退回
              原始品名（中秋嚴選【…】…），那種長度會把整列撐爆。全名在彈窗裡看得到。 */}
          <span className="inline-block max-w-[10rem] truncate align-middle">
            {active ? `品項：${active}` : '品項'}
          </span>
          <span aria-hidden> ▾</span>
        </button>
      )}

      {open && (
        <Picker
          title="品項"
          options={[
            { label: `全部（${matchedCount} 張）`, value: '' },
            ...options.map((p) => ({ label: `${p.value} · ${p.n} 張`, value: p.value })),
          ]}
          value={active}
          onSelect={setProduct}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )

  return { filtered, filterBar }
}
