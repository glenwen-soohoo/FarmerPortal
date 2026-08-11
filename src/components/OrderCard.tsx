import { useState, type CSSProperties } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import TempLayerTag from './TempLayerTag'
import Tag from './Tag'
import ConfirmDialog from './ConfirmDialog'
import FailDialog from './FailDialog'
import QtyInput from './QtyInput'
import OrderNo from './OrderNo'
import { EARLY_SHIP_WARNING, orderTimeTag, needsReprint, isLabelExpired, isCancelActive, isCancelDismissed, dismissCancel, shipReminderText, shipWindowText } from '../utils/shipDate'
import { COMPANY_TEL } from '../constants'

interface Props {
  order: Order
  upcoming?: boolean
  // 批次勾選模式（批次列印出貨單 / 批次黑貓收貨）
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  selectedQty?: number // 批次列印：此單要印幾張（1=原印，>1=含補印）
  onQtyChange?: (delta: number) => void
  onQtySet?: (value: number) => void // 直接鍵入份數（比照企業匯單）
  earlyEligible?: boolean // 有提早出貨資格：出貨預告的單可「提早印單」
  hideProduct?: boolean // 商品分組大卡片內：小卡不再顯示產品名 / 溫層（已在大卡標題）
  today?: string // 測試日期 'YYYY-MM-DD'，用來判定指定出貨日是否為「今日」
}


export default function OrderCard({ order, upcoming, selectable, selected, onToggleSelect, selectedQty = 1, onQtyChange, onQtySet, earlyEligible, hideProduct, today }: Props) {
  const { printOrder, failOrder, reprintOrder, refreshExpiredLabel, supplementOrder, dismissCancel: storeDismissCancel } = useStore()
  const [askReprint, setAskReprint] = useState(false)
  const [askReissue, setAskReissue] = useState(false) // 超時重印彈窗①：說明＋選張數
  const [askReissueConfirm, setAskReissueConfirm] = useState(false) // 超時重印彈窗②：出貨前再提醒用新號
  const [reissueQty, setReissueQty] = useState(1) // 超時重印：印幾張（預設沿用原箱數）
  const [askPrint, setAskPrint] = useState(false) // 印單彈窗：選印幾張(多箱)
  const [printQty, setPrintQty] = useState(1)
  const [reprintSel, setReprintSel] = useState<string[]>([]) // 重印：勾選要印的物流編號（預設全勾）
  const [supplementQty, setSupplementQty] = useState(1) // 追加補單：新增箱數
  const [askEarly, setAskEarly] = useState(false)
  const [askSupplement, setAskSupplement] = useState(false)
  const [askFail, setAskFail] = useState(false)
  const [failNotice, setFailNotice] = useState(false)
  const [showRecipient, setShowRecipient] = useState(false) // 收件資訊預設收合
  // 取消偵測：硬取消（shipStatus='取消'）或 cancelledAt 覆蓋層（示範資料保留 active shipStatus + 取消日）。
  // 有測試日期時走「7 天內才算 active」的判定；沒有時退回「只要有 cancelledAt 就算取消」。
  const cancelled = order.shipStatus === '取消' || (today ? isCancelActive(order, today) : !!order.cancelledAt)
  const [cancelDismissed, setCancelDismissed] = useState(() => cancelled && isCancelDismissed(order.id))

  const printed = order.shipStatus === '已印單'
  const shipped = order.shipStatus === '已出貨'
  const isReprint = needsReprint(order)
  // 超時：已印單但標籤過 24h → 舊號失效、要重新取號（沿用改單重印那套視覺骨架，只換文案）
  const expired = today ? isLabelExpired(order, today) : false
  // 時間相關標籤（互斥、一次一個）：逾期 > 指定今日 > 今日到期 > 指定日期 > 快到期
  const timeTag = today ? orderTimeTag(order, today) : null
  // 出貨提醒內容：farmerRemark 或（其空時）由指定出貨日/不可出貨日組出的衍生提醒；皆無為 null
  const reminder = shipReminderText(order)

  // 線框版急迫度：左緣 32px 色塊（逾期紅／今日或指定今日橙／快到期或改單重印黃），逾期再疊淡紅底；一般單白底。
  const label = timeTag?.label
  const isOverdue = label === '逾期未出'
  const isHot = label === '今日到期' || label === '客人指定今日出貨'
  const isWarn = isReprint || expired || label === '快到期'
  // 曾有 selectDisabled（批次模式下「這張不能勾」）把整卡壓到 opacity 0.45，但從沒有呼叫端傳它——
  // 那是為未開工的批次收貨留的骨架。移掉之後批次模式下每張卡都可勾，不再有永遠為 false 的分支。
  const rowStyle: CSSProperties = {}
  let rowCls = ''
  // 急迫度先算：勾選不得覆蓋它，否則批次核對「這批有沒有含逾期單」時看不到紅色標記與紅底。
  // 色條屬「非文字圖形」，WCAG 要 3:1。原本的淺橙 #FBAE4A(1.87) / 淺黃 #FBE45E(1.28) 在白卡上幾乎浮不出來，
  // 強光下更看不見——而它是急迫度的主要視覺編碼。加深到同色系的深階（色相不變，語意照舊）。
  // 32px 粗左緣改成卡片內的細圓角色條（見 .oc-sev）：粗塊吃掉太多橫向空間、視覺也過重。
  // 三階一律用色票 token（urgent / tint-today / tint-notice）：舊的 #C0392B 是已汰換的紅，
  // #DE7A1B 與 tint-today 差一碼且對白卡只有 3.04:1，貼著非文字 3:1 門檻。
  let sevColor = ''
  if (isOverdue) {
    sevColor = 'var(--c-urgent)'
    // ⚠️ 實色 token，不是 bg-urgent/[0.1]：半透明會把卡片後方的底色也算進來，而祖先鏈兩頁不同
    // （需出貨頁透到 page、企業送禮頁透到白底），同一張逾期卡因此長得不一樣、且前者的
    // ink-faint 只有 4.14:1。詳見 tailwind.config.js 的 tint-overdue 註解。
    rowCls = 'bg-tint-overdue'
  } else if (isHot) sevColor = 'var(--c-tint-today)'
  else if (isWarn) sevColor = 'var(--c-tint-notice)'
  // 勾選是「疊加」而非取代：有急迫度視覺時改用內框標示選中（另有 40px 勾選框），無急迫度才上灰底。
  if (selectable && selected) {
    // 內框與 --l1 並列：只寫 inset 會整條蓋掉 .oc-card 的 box-shadow，勾選瞬間卡片會掉出陰影系統。
    if (rowCls || sevColor) rowStyle.boxShadow = 'inset 0 0 0 3px var(--c-act), var(--l1)'
    else rowCls = 'bg-inset'
  }

  // 已出貨標記（「已印單」不再顯示——已印單由「物流編號有號」＋右側「重印」鈕表達，見 0805 回饋）
  const statusNode = shipped ? (
    <span className="whitespace-nowrap text-lg font-bold text-ink-faint">
      已出貨 ✓<span className="ml-2 text-sm font-normal text-ink-faint">{order.printedAt}</span>
    </span>
  ) : null

  // 收掉彈窗、立刻發請求。等待面板與最短顯示時間由 store 的 runPrint 負責（PrintOverlay 掛在
  // FarmerLayout），這裡不再自己維護 printing state —— 否則失敗提示條的「重試」跳不出面板。
  //
  // ⚠️ 原本是 setTimeout(…, 2000) 之後才呼叫 fn：那 2 秒內一個請求都沒送、面板卻在 1.2 秒就
  // 顯示「已產生出貨單」（當時 PDF 還不存在），而且面板在 2 秒時收掉、黑貓取號才開始——
  // 真正的等待完全沒有進度指示，農友以為沒反應會再按一次（那時按鈕已無遮罩、也沒 disabled）。
  const runPrint = (fn: () => Promise<void>) => {
    setAskReprint(false)
    setAskReissue(false)
    setAskReissueConfirm(false)
    setAskPrint(false)
    setAskSupplement(false)
    void fn()
  }
  const doPrint = (count = 1) => runPrint(() => printOrder(order.id, count))
  // 勾選重印（沿用原號、不取新號）：印勾選的物流編號。
  const doReprint = () => {
    if (reprintSel.length === 0) return setAskReprint(false)
    void runPrint(() => reprintOrder(order.id, reprintSel))
  }
  // 超時重印：作廢舊號、向黑貓重新取號（張數由農友選）、舊號寫進客服備註（後台留存）。
  const openReissue = () => {
    setReissueQty(order.trackingNos?.length || 1) // 預設沿用原箱數
    setAskReissue(true)
  }
  const doReissue = (count = 1) => runPrint(() => refreshExpiredLabel(order.id, count))
  // 多箱追加補單：取新號、只印新增那幾張，不改主號/訂單狀態。
  const doSupplement = (count = 1) => runPrint(() => supplementOrder(order.id, count))

  // 未印：開「選印幾張」彈窗；已印：開「勾選重印」彈窗（列出所有物流編號、預設全勾）。
  const openPrint = () => {
    setPrintQty(1)
    setAskPrint(true)
  }
  const openReprint = () => {
    setReprintSel(order.trackingNos ?? [])
    setAskReprint(true)
  }
  const onPrintClick = () => (printed ? openReprint() : openPrint())

  // F9 A7 取消卡片：不靜默消失——留原分頁、灰底、刪除線、無需出貨/請撕單、可「知道了」提早隱藏（保留 7 天由後端過濾）。
  if (cancelled) {
    if (cancelDismissed) return null
    return (
      /* bg-inset 掛在 .oc-card 上：白底是 :where(.oc-card) 宣告的（0 特異度），utility 蓋得過去。
         灰底是「這張單已經死了」的冗餘視覺通道，不只靠刪除線。 */
      <div className="oc-card bg-inset">
        <div className="oc-cancel">
          <div className="min-w-0 flex-1">
            <div className="mb-1">
              {/* 實色深灰膠囊 + 白字（5.37:1）。原本是 hairline 底配 ink-sub 字——字讀得到，
                  但 hairline 對 inset 底只有 1.12:1，膠囊的形狀等於看不見。
                  「已取消」是農友必須注意到的事（可能已印出黑貓出貨單要撕掉），標記要讀得出來。 */}
              <span className="oc-status inline-block rounded-full bg-ink-faint px-3 py-0.5 text-white">已取消</span>
            </div>
            {/* .oc-qty 與正常卡的品名／規格同一階，取消卡才不會比正常卡還大 */}
            {!hideProduct && <div className="oc-qty text-ink-faint line-through">{order.productName}</div>}
            <div className="oc-qty text-ink-faint line-through">
              {order.spec}　×{order.qty}
            </div>
            <div className="oc-cancel-msg mt-2 text-ink">
              {/* 「黑貓出貨單」不是「貼紙」：印出來的是黑貓託運單，而 `出貨單` 是全站主要用詞（11 處）。
                  農友要做的動作是把那張已貼上／已印出的黑貓單撕掉作廢，講清楚是哪張紙才不會撕錯。 */}
              {order.printedAt ? '此單已取消，請撕掉已印出的黑貓出貨單' : '此單已取消，無需出貨'}
            </div>
          </div>
          {/* .oc-sb ＝ 卡內次要動作鈕（膠囊、0.86em、min-height 地板），與展開區的重印／補單同一階 */}
          <button
            onClick={() => {
              // 三處一起：本機 localStorage（跨 session 記住）＋ store（讓清單過濾一致、跨裝置語意）＋ 本地 state（立刻消失）
              dismissCancel(order.id)
              storeDismissCancel(order.id)
              setCancelDismissed(true)
            }}
            className="oc-sb shrink-0"
          >
            知道了
          </button>
        </div>
      </div>
    )
  }

  const canExpand = !selectable
  const toggleExpand = () => canExpand && setShowRecipient((v) => !v)
  const stop = (fn: () => void) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    fn()
  }

  return (
    <div className={`oc-card ${rowCls}`} style={rowStyle}>
      {/* 上半：一眼可讀的資訊 + 單一主要動作。整列可點＝展開收件資訊（批次模式下改為勾選） */}
      {/* ⚠️ 這一列**刻意不掛 role="button" / tabIndex**，即使它整列可點。
          它內含 6 個真 <button>（勾選框、±步進、印單／提早印單／重印），而 role="button"
          不可包住其他互動元素——讀屏會把整張卡壓平成一顆按鈕，可及名稱變成 45 字的卡片全文。
          現在的分工：
          ・滑鼠／觸控 → 保留這裡的 onClick，整列還是點得開（div 的 onClick 不會被 AT 宣告成按鈕，不違規）
          ・讀屏／鍵盤 → 走下面那顆真的 chevron <button>，它有名稱與 aria-expanded */}
      <div
        className="oc-row flex items-stretch"
        onClick={selectable ? () => onToggleSelect?.() : toggleExpand}
      >
        {/* 急迫度色條：卡片內的細圓角條（取代原先 32px 粗左緣） */}
        {sevColor && <span className="oc-sev" style={{ background: sevColor }} aria-hidden />}

        <div className="min-w-0 flex-1">
          {!hideProduct && (
            <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="oc-qty text-ink">{order.productName}</span>
              <TempLayerTag layer={order.tempLayer} />
            </div>
          )}

          {/* 規格 × 數量：最大、最先讀到；狀態標籤跟在同一行（原本另起一行，白白多吃一行高度） */}
          <div className="oc-l1">
            <span className="oc-qty text-ink">
              {order.spec}　×{order.qty}
            </span>
            {/* 標籤只有「淺底深字 + 文字」，不加 emoji 前綴：語意已在文字裡，emoji 反而讓同一行出現粗細不一的字形。
                備貨總覽的同款標籤本來就沒有前綴，去掉後兩處才一致。 */}
            {timeTag && (
              <Tag tone={timeTag.tone} size="chip">
                {timeTag.label}
              </Tag>
            )}
            {/* 更新重印：非時間標籤，可與時間標籤並存。
                ⚠️ 超時「不」掛標籤：農友可能根本不想重印，掛「需重新取號」會逼他以為一定要動作。
                超時只在重印鈕的第二行輕提示，決定權留給農友。 */}
            {isReprint && (
              <Tag tone="changed" size="chip">
                已更新，請重印
              </Tag>
            )}
          </div>

          {/* 預計出貨（指定出貨也照樣顯示，方便對照原定區間 vs 客人指定日）；已印單/已出貨標記接其後同一行 */}
          {order.shipWindow && (
            <div className="oc-l2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="oc-k text-ink-faint">預計出貨</span>
              {/* 中性而非品牌綠：綠色留給「可以按的東西」。日期是資訊，一列出現兩次綠會稀釋按鈕的訊號 */}
              <span className="oc-win text-ink">{shipWindowText(order.shipWindow)}</span>
            </div>
          )}

          {/* 出貨提醒：顯示 AI 判到的內容——farmerRemark 或（其空時）由指定出貨日/不可出貨日組出的衍生提醒。
              皆無時：有特殊備註待人工→「客服確認中」，否則→「無」 */}
          <div className="oc-l2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="oc-k text-ink-faint">出貨提醒</span>
            {reminder ? (
              <span
                className="oc-rem leading-relaxed text-ink"
                style={{
                  textDecorationLine: 'underline',
                  // 原 #F5DE7A 只有 1.35:1，等於沒有底線；加深到 tint-notice（4.32:1）
                  textDecorationColor: 'var(--c-tint-notice)',
                  textDecorationThickness: '3px',
                  textUnderlineOffset: '3px',
                }}
              >
                {reminder}
              </span>
            ) : order.needsHuman ? (
              <span className="oc-rem text-notice">客服確認中</span>
            ) : (
              <span className="oc-rem text-ink-faint">無</span>
            )}
          </div>

          {/* 物流編號：一律常駐顯示於「出貨提醒」下方（0805 回饋：沒單號時也要有）。
              一號一行；多號時第一個標「主要編號」（黑貓以主號判斷整張單的出貨狀態）；沒號則標「尚無單號」。 */}
          <div className="oc-l2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="oc-k text-ink-faint">物流編號</span>
            {order.trackingNos?.length ? (
              <span className="inline-flex flex-col gap-y-0.5">
                {order.trackingNos.map((no, i) => (
                  <span key={no} className="inline-flex items-baseline gap-x-2">
                    {/* 改單待重印：舊的所有物流單號紅字刪除線（作廢，等重印取新號）——0805 V2 更正。
                        超時不刪除線：農友可能根本不想重印，舊號在他決定重印前仍是當下有效的號。 */}
                    <OrderNo value={no} className="oc-win" strike={isReprint} />
                    {i === 0 && order.trackingNos!.length > 1 && (
                      <span className="rounded bg-act/10 px-1.5 py-0.5 text-sm font-bold text-act">主要編號</span>
                    )}
                  </span>
                ))}
              </span>
            ) : (
              <span className="oc-win font-normal text-ink-faint/60">尚無單號</span>
            )}
          </div>

          {/* 已印單 / 已出貨：放在最後一行（設計稿順序 規格 → 預計出貨 → 出貨提醒 → 已印單）。
              原本和「預計出貨」擠同一行，窄版會換行、也和設計稿不符。 */}
          {statusNode && <div className="oc-l2">{statusNode}</div>}
        </div>

        {/* 批次模式：勾選框 + 補印份數（CSS order 把勾選框排到卡片最前） */}
        {selectable && (
          <div className="oc-select flex shrink-0 flex-col items-center gap-4 self-start">
            <button
              onClick={stop(() => onToggleSelect?.())}
              role="checkbox"
              aria-checked={!!selected}
              /* label 帶內容：批次列印動輒十幾張，AT 上只說「勾選此訂單」分不出是哪一張 */
              aria-label={`勾選 ${order.spec} ×${order.qty}`}
              /* 方塊維持 4px：全圓會變圓形、讀作單選。tap44：視覺留 40×40、可點區撐到 44 */
              className="tap44 flex items-center justify-center rounded"
              style={{
                width: 40,
                height: 40,
                border: `2px solid ${selected ? 'var(--c-act)' : 'var(--c-edge)'}`,
                background: selected ? 'var(--c-act)' : 'var(--c-white)',
                cursor: 'pointer',
              }}
            >
              {selected && <span className="text-2xl font-bold text-white">✓</span>}
            </button>
            {selected && (
              /* 份數控制器：比照企業匯單——橫排 − [可鍵入的數字框] ＋，可直接打字（例如 50），不必狂按。
                 ⚠️ 全部 stopPropagation：這顆坐在整列可點的 .oc-row 裡，點它不該把整張卡取消勾選。 */
              <div className="oc-stepper flex flex-col items-center gap-1">
                <span className="inline-flex items-center overflow-hidden rounded-full border-2 border-hairline" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={stop(() => onQtyChange?.(-1))}
                    disabled={selectedQty <= 1}
                    className="px-2 text-xl font-bold text-ink disabled:text-ink-faint"
                    style={{ minHeight: 40 }}
                    aria-label="減少份數"
                  >
                    −
                  </button>
                  <QtyInput
                    value={selectedQty}
                    onChange={(n) => onQtySet?.(n)}
                    className="w-10 border-x-2 border-hairline text-center text-lg font-bold text-ink"
                    style={{ minHeight: 40 }}
                    ariaLabel="份數"
                  />
                  <button
                    onClick={stop(() => onQtyChange?.(1))}
                    className="px-2 text-xl font-bold text-ink"
                    style={{ minHeight: 40 }}
                    aria-label="增加份數"
                  >
                    ＋
                  </button>
                </span>
                <span className="oc-k text-ink-faint">張</span>
              </div>
            )}
          </div>
        )}

        {/* 右：動作區。主要動作（印單／重印／提早印單）在最上，次要動作（多箱追加補單／無法出貨）直排其下（#11）。
            改單重印時主鈕改深棕底、與一般印單的綠底區隔（#10a）。 */}
        {!selectable && !shipped && (
          <div className="oc-action flex shrink-0 flex-col gap-2">
            {printed ? (
              /* 超時（過24h）跟一般重印一樣是「次要灰底鈕」——不用改單那種深棕主鈕，
                 免得農友誤以為「一定要重印」。只在鈕上加第二行「超過24小時」提示，點下去才在彈窗說明要取新號。 */
              <button onClick={stop(expired ? openReissue : onPrintClick)} className="oc-cta oc-ghost flex-1">
                {expired ? (
                  <span className="flex flex-col items-center leading-tight">
                    <span>重印</span>
                    <span className="oc-cta-sub mt-0.5 whitespace-nowrap">超過24小時</span>
                  </span>
                ) : (
                  '重印'
                )}
              </button>
            ) : upcoming ? (
              earlyEligible ? (
                <button
                  onClick={stop(() => setAskEarly(true))}
                  className="oc-cta flex-1 bg-act text-white active:bg-act-deep"
                >
                  提早
                  <br />
                  印單
                </button>
              ) : (
                <div className="oc-locked flex-1">
                  尚未到
                  <br />
                  出貨時間
                </div>
              )
            ) : (
              <button
                onClick={stop(onPrintClick)}
                className="oc-cta flex-1 bg-act text-white active:bg-act-deep"
                /* 改單重印：舊標籤作廢、要取新物流編號 → 深棕底與一般印單的綠底區隔（文字仍白、按下的鍵感由 .oc-cta:active 撐）。 */
                style={isReprint ? { background: '#5A3A12' } : undefined}
              >
                {isReprint ? (
                  <span className="flex flex-col items-center leading-tight">
                    <span>印單</span>
                    <span className="oc-cta-sub mt-0.5 whitespace-nowrap">取新物流編號</span>
                  </span>
                ) : (
                  '印單'
                )}
              </button>
            )}
          </div>
        )}
        {shipped && !selectable && <span className="oc-ro">已出貨 · 唯讀</span>}

        {/* 展開指示：旋轉 90° 表示已展開。
            這是整列展開的**語意入口**——真 <button>、有名稱、有 aria-expanded，讀屏與鍵盤走它。
            ⚠️ 刻意**不套 .tap44**，兩個理由：
            ① 它左邊緊鄰印單鈕（.oc-action），往外撐 44 會吃進印單鈕的可點區，誤觸就變成
               「想印單卻展開了收件資訊」——那比可點區小更糟。
            ② 整列的 onClick 做的是同一件事，所以觸控使用者按偏了仍然會展開，
               大目標本來就存在（WCAG 2.5.8 的「同頁有等效控制」例外）。 */}
        {canExpand && (
          <button
            type="button"
            onClick={stop(toggleExpand)}
            aria-expanded={showRecipient}
            aria-label={showRecipient ? '收合收件資訊' : '展開收件資訊'}
            className={`oc-chev ${showRecipient ? 'is-open' : ''}`}
          >
            <span aria-hidden>▸</span>
          </button>
        )}
      </div>

      {/* 下半：展開區＝卡片底部「整張寬」的一段（含動作欄底下），不是資訊欄內的內縮小盒 */}
      {showRecipient && canExpand && (
        <div className="oc-foot anim-slide-down">
          <div className="oc-det">
            <div>
              <div className="oc-det-k">訂單編號</div>
              {/* 0805 V2 更正：改單重印的刪除線改標在「物流單號」（舊號作廢），訂單編號不劃掉。 */}
              <div className="oc-det-v">
                <OrderNo value={order.orderNumber} />
              </div>
            </div>
            <div>
              <div className="oc-det-k">收件人 / 電話</div>
              <div className="oc-det-v font-bold text-ink">
                {order.recipient}
                <span className="ml-2 font-normal text-ink-sub">{order.phone}</span>
              </div>
            </div>
            {/* 溫層不在展開區重複顯示：品名區（.pg-gh）已有溫層標籤。 */}
            {/* 收件地址與配送提醒併成同一列（原本各自 oc-det-w 佔滿整寬、多吃一列）。
                地址放左欄、配送提醒接在溫層底下——右欄本來就是「附註型」的短欄位。
                ⚠️ 地址不再獨佔整寬，長地址會折成兩行；這是可以的，因為 grid 的列高由高的那格決定，
                右欄的配送提醒多半只有「無」，折行不會把別的欄位推歪。559px 以下整個 grid 本來就變單欄。 */}
            <div>
              <div className="oc-det-k">收件地址</div>
              <div className="oc-det-v text-ink">{order.address}</div>
            </div>
            <div>
              <div className="oc-det-k">配送提醒</div>
              <div className="oc-det-v text-ink">{order.driverRemark || <span className="text-ink-faint">無</span>}</div>
            </div>
          </div>
          {/* 次要動作放展開區（0805 回饋修正：不直接放卡片上）：多箱追加補單（已印才有）＋無法出貨。
              重印相同貨單維持移除（右側主鈕的「重印」已涵蓋）。展開區不在可點列內，無需 stop()。 */}
          {!shipped && (
            <div className="oc-dacts">
              {printed && (
                <button
                  onClick={() => {
                    setSupplementQty(1)
                    setAskSupplement(true)
                  }}
                  className="oc-sb oc-sb-tall leading-tight"
                >
                  多箱
                  <br />
                  追加補單
                </button>
              )}
              <button onClick={() => setAskFail(true)} className="oc-sb oc-sb-dgr">
                無法出貨
              </button>
            </div>
          )}
        </div>
      )}

      {askPrint && (
        <ConfirmDialog
          title="列印出貨單"
          message={
            <div>
              <p>每印一張單就會向黑貓要一個物流編號。</p>
              <div className="mt-5 flex items-center gap-4">
                <span className="text-lg text-ink">印</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPrintQty((q) => Math.max(1, q - 1))}
                    disabled={printQty <= 1}
                    className="rounded-full border-2 border-hairline bg-white text-2xl font-bold text-ink disabled:border-hairline disabled:bg-inset disabled:text-ink-faint"
                    style={{ width: 48, height: 48 }}
                    aria-label="減少張數"
                  >
                    −
                  </button>
                  <QtyInput
                    value={printQty}
                    onChange={setPrintQty}
                    className="w-16 rounded border-2 border-edge text-center text-3xl font-bold text-ink"
                    style={{ height: 48 }}
                    ariaLabel="列印張數"
                  />
                  <button
                    onClick={() => setPrintQty((q) => q + 1)}
                    className="rounded-full border-2 border-hairline bg-white text-2xl font-bold text-ink"
                    style={{ width: 48, height: 48 }}
                    aria-label="增加張數"
                  >
                    ＋
                  </button>
                </div>
                <span className="text-lg text-ink">張</span>
              </div>
            </div>
          }
          confirmText={`列印（${printQty} 張）`}
          onConfirm={() => doPrint(printQty)}
          onCancel={() => setAskPrint(false)}
        />
      )}
      {askReprint && (
        <ConfirmDialog
          title="重印相同貨單"
          message={
            <div>
              <p className="text-ink-sub">勾選要重印的物流編號（沿用原單號）：</p>
              <div className="mt-4 flex flex-col gap-3">
                {(order.trackingNos ?? []).map((no, i) => {
                  const checked = reprintSel.includes(no)
                  return (
                    <button
                      key={no}
                      onClick={() => setReprintSel((sel) => (checked ? sel.filter((x) => x !== no) : [...sel, no]))}
                      role="checkbox"
                      aria-checked={checked}
                      className="flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-xl font-bold active:opacity-80"
                      style={{ borderColor: checked ? 'var(--c-act)' : 'var(--c-edge)' }}
                    >
                      <span
                        className="flex shrink-0 items-center justify-center rounded" /* 同上：勾選框不可全圓 */
                        style={{
                          width: 32,
                          height: 32,
                          border: `2px solid ${checked ? 'var(--c-act)' : 'var(--c-edge)'}`,
                          background: checked ? 'var(--c-act)' : 'var(--c-white)',
                        }}
                      >
                        {checked && <span className="text-lg font-bold text-white">✓</span>}
                      </span>
                      <OrderNo value={no} />
                      {/* 第一個號＝主要編號：黑貓以它判斷整張單的出貨狀態 */}
                      {i === 0 && (
                        <span className="ml-auto shrink-0 rounded bg-act/10 px-2 py-0.5 text-sm font-bold text-act">
                          以此單判斷出貨狀態
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          }
          confirmText={`重印（${reprintSel.length} 張）`}
          onConfirm={doReprint}
          onCancel={() => setAskReprint(false)}
        />
      )}
      {askReissue && (
        <ConfirmDialog
          title="重印出貨單"
          message={
            <div>
              <p className="text-ink-sub">因黑貓系統設定，過24小時想重印需取新號。<br />重印後務必用新的物流編號，舊號不可再使用。</p>
              <div className="mt-5 flex items-center gap-4">
                <span className="text-lg text-ink">印</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setReissueQty((q) => Math.max(1, q - 1))}
                    disabled={reissueQty <= 1}
                    className="rounded-full border-2 border-hairline bg-white text-2xl font-bold text-ink disabled:border-hairline disabled:bg-inset disabled:text-ink-faint"
                    style={{ width: 48, height: 48 }}
                    aria-label="減少張數"
                  >
                    −
                  </button>
                  <QtyInput
                    value={reissueQty}
                    onChange={setReissueQty}
                    className="w-16 rounded border-2 border-edge text-center text-3xl font-bold text-ink"
                    style={{ height: 48 }}
                    ariaLabel="列印張數"
                  />
                  <button
                    onClick={() => setReissueQty((q) => q + 1)}
                    className="rounded-full border-2 border-hairline bg-white text-2xl font-bold text-ink"
                    style={{ width: 48, height: 48 }}
                    aria-label="增加張數"
                  >
                    ＋
                  </button>
                </div>
                <span className="text-lg text-ink">張</span>
              </div>
            </div>
          }
          confirmText={`重印（${reissueQty} 張）`}
          onConfirm={() => {
            setAskReissue(false)
            setAskReissueConfirm(true) // 先不印，跳出貨前再提醒
          }}
          onCancel={() => setAskReissue(false)}
        />
      )}
      {askReissueConfirm && (
        <ConfirmDialog
          title="請確認使用新的物流編號"
          message="重印後使用舊號會抓不到貨態，請確認使用新的物流編號出貨。"
          confirmText="我知道了，重印"
          onConfirm={() => doReissue(reissueQty)}
          onCancel={() => setAskReissueConfirm(false)}
        />
      )}
      {askEarly && (
        <ConfirmDialog
          title="提早印單"
          message={EARLY_SHIP_WARNING}
          confirmText="我了解，仍要提早印單"
          onConfirm={() => {
            setAskEarly(false)
            doPrint()
          }}
          onCancel={() => setAskEarly(false)}
        />
      )}
      {askSupplement && (
        <ConfirmDialog
          title="多箱追加補單"
          message={
            <div>
              <p>向黑貓拿新的物流編號。<br />請留意追加補單不會成為主要編號，出貨時請務必包含到主要編號。</p>
              <div className="mt-5 flex items-center gap-4">
                <span className="text-lg text-ink">追加</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSupplementQty((q) => Math.max(1, q - 1))}
                    disabled={supplementQty <= 1}
                    className="rounded-full border-2 border-hairline bg-white text-2xl font-bold text-ink disabled:border-hairline disabled:bg-inset disabled:text-ink-faint"
                    style={{ width: 48, height: 48 }}
                    aria-label="減少箱數"
                  >
                    −
                  </button>
                  <QtyInput
                    value={supplementQty}
                    onChange={setSupplementQty}
                    className="w-16 rounded border-2 border-edge text-center text-3xl font-bold text-ink"
                    style={{ height: 48 }}
                    ariaLabel="追加箱數"
                  />
                  <button
                    onClick={() => setSupplementQty((q) => q + 1)}
                    className="rounded-full border-2 border-hairline bg-white text-2xl font-bold text-ink"
                    style={{ width: 48, height: 48 }}
                    aria-label="增加箱數"
                  >
                    ＋
                  </button>
                </div>
                <span className="text-lg text-ink">箱</span>
              </div>
            </div>
          }
          confirmText={`列印補單（${supplementQty} 張）`}
          onConfirm={() => doSupplement(supplementQty)}
          onCancel={() => setAskSupplement(false)}
        />
      )}
      {askFail && (
        <FailDialog
          recipient={order.recipient}
          onCancel={() => setAskFail(false)}
          onConfirm={(reason, altDate) => {
            failOrder(order.id, reason, altDate)
            setAskFail(false)
            setFailNotice(true)
          }}
        />
      )}
      {failNotice && (
        <ConfirmDialog
          title="已回報"
          /* 電話原本是從沒填過的佔位符 0X-XXXXXXXX。改用公司電話（COMPANY_TEL）——那正是黑貓
             出貨單上的寄件人電話，農友手上的單子就印著它，不是一個陌生號碼。

             文案三處都是刻意的，改動前先讀完：
             ・「已通知業務處理」為真：MarkFailedAsync 寫進 Mongo 後，A7 每日彙總
               （DailySummaryService，由 Azure Logic App 排程觸發）會把「無法出貨」寄給貓咪。
               ⚠️ 但是 **T+1 不是即時**——這是已知且接受的節奏，不要改成暗示系統會馬上處理。
             ・「急件」是條件而非無條件請求：因為通知是 T+1，這通電話是唯一的即時管道，
               但把「隔日才處理」直接寫給農友沒有必要。用「急件」讓他自己判斷，兼顧語氣與促動力。
             ・「公司」不是「業務」：這支是公司總機（打進去要再轉），寫「業務」會被讀成直撥。 */
          message={`已通知業務處理。急件請另外電聯公司 ${COMPANY_TEL}，謝謝`}
          confirmText="我知道了"
          cancelText="關閉"
          onConfirm={() => setFailNotice(false)}
          onCancel={() => setFailNotice(false)}
        />
      )}
    </div>
  )
}
