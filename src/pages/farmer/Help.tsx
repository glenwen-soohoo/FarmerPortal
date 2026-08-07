import { useState, type ReactNode } from 'react'

// 農友端「操作說明」：完整版、折疊式、大字。內容對應規劃文件 F12。
// 設計取向（3C 弱長輩）：速查目錄一點就展開＋捲到該段；每段預設收合、點大標題才展開；
// 圖文交錯（截圖穿插在對應步驟之間，不集中在最上面）；字體沿用 App 的「我的設定 → 字體大小」自動縮放。

// ⚠️ 待填：無毒農／客服電話、LINE、故障叫修窗口（下方 CONTACT）。
const CONTACT = {
  catPhone: '＿＿＿＿＿＿',
  catLine: '＿＿＿＿',
  repair: '＿＿＿＿＿＿',
}

interface Section {
  id: string
  title: string
  chip?: string // 速查用的短名（有＝進速查目錄）
  body: ReactNode
}

// —— 小工具排版 ——
function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="ml-5 list-decimal space-y-2">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ol>
  )
}
function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-2">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  )
}
function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-accent bg-accent/5 px-4 py-3 text-ink2">{children}</div>
  )
}
const B = ({ children }: { children: ReactNode }) => <span className="font-bold text-ink">{children}</span>
// 說明截圖（放 public/help/）：穿插在對應文字之間，沿用 App 字級縮放
const HELP_IMG_BASE = 'https://fruitbox.blob.core.windows.net/pagematerials/FarmerPortal'

function Img({ f, alt }: { f: string; alt?: string }) {
  return (
    <img
      src={`${HELP_IMG_BASE}/${f}`}
      alt={alt ?? ''}
      loading="lazy"
      className="w-full rounded-lg border border-line"
    />
  )
}

const SECTIONS: Section[] = [
  {
    id: 'basic',
    title: '開始之前：你的設備',
    body: (
      <Bullets
        items={[
          <>一台<B>平板</B>（所有操作都在這台）＋一台<B>印表機</B>（出貨單從這裡印）。</>,
          <>平板<B>只會打開這一個 App</B>，不會亂跑，<B>放心亂看不會弄壞</B>。</>,
        ]}
      />
    ),
  },
  {
    id: 'login',
    title: '登入、忘記密碼',
    body: (
      <Bullets
        items={[
          <><B>帳號</B>＝你的手機號碼；<B>密碼</B>＝無毒農給你的那組；打完按「登入」。</>,
          <><B>忘記密碼／想換密碼</B>：打電話給無毒農幫你重設，<B>自己不用改</B>。</>,
          <>平板通常<B>一直保持登入</B>，不會每次都叫你打密碼。</>,
        ]}
      />
    ),
  },
  {
    id: 'screen',
    title: '看懂主畫面',
    body: (
      <>
        <p className="font-bold text-ink">底下幾個分頁：</p>
        <Bullets
          items={[
            <><B>需出貨</B>：目前可以出的單，也在這裡印單。</>,
            <><B>出貨預告</B>：還沒到出貨時間的單，先讓你知道之後要出什麼。</>,
            <><B>備貨總覽</B>：同一種水果加總要出幾箱，方便一次備；也能印出貨總表。</>,
            <><B>更多</B>包含：所有訂單查詢、我的設定（可調字體大小）、操作說明。</>,
          ]}
        />
        <Img f="help-overview.png" />
        <p className="mt-2 font-bold text-ink">一張「單」上會看到：</p>
        <Bullets
          items={[
            <>水果＋規格＋<B>數量</B></>,
            <><B>出貨提醒</B>：要注意的事寫在這（黃色底線），<B>一定要看一下</B>。</>,
            <><B>物流編號</B>：黑貓單號（印過才有；可能會有好幾組）。</>,
            <><B>收件資訊</B>（收件人／電話／地址／給司機備註）預設收起來，按「顯示收件資訊」展開。</>,
          ]}
        />
        <Img f="help-order.png" />
        <p className="mt-2 font-bold text-ink">卡片顏色代表急不急：</p>
        <Bullets
          items={[
            <><B>白色</B>＝正常照順序；<B>黃→橙→紅</B>＝快到期、越紅越先出；<B>灰色</B>＝取消了、不用出。</>,
          ]}
        />
        <Img f="help-order-color.png" />
      </>
    ),
  },

  // —— 四種印單（別搞混）——
  {
    id: 'print-types',
    chip: '四種印單',
    title: '四種「印單」別搞混',
    body: (
      <>
        <p className="font-bold text-ink">都在「需出貨」那張單上操作：</p>
        <Bullets
          items={[
            <><B>印單（初次印單）</B>：按「印單／批次列印」，第一次向黑貓要物流編號、印成出貨單。（情境1）</>,
            <><B>重印（印壞了／不見了）</B>：按「重印相同貨單」，<B>同一個號、不會變成新的一單</B>。（情境2）</>,
            <><B>補單（一箱裝不完、要多幾箱）</B>：按「多箱追加補單」，<B>每箱一個新號</B>。（情境3）</>,
            <><B>改單（客人改了地址／收件人）</B>：卡片亮「⚠️已更新，請重印」，按土黃色「印單（取新物流編號）」，<B>換新號、舊號作廢要撕掉</B>。（情境12）</>,
          ]}
        />
      </>
    ),
  },

  // —— 情境 ——
  {
    id: 'scn-1',
    chip: '今天出貨',
    title: '情境1：今天要出貨（最常見）',
    body: (
      <>
        <Steps
          items={[
            <>開<B>「需出貨」</B>，能出的單都整理在這。</>,
            <>看水果、規格、數量，把貨<B>裝好箱</B>。</>,
            <>印表機放好黑貓底紙，按那張單的<B>「印單」</B>、選要印幾張。</>,
            <>印出貨單 → <B>貼在對應的箱子上</B> → 請黑貓司機來收就完成。</>,
          ]}
        />
        <Img f="help-order-print.png" />
        <Note>
          印出來<B>不代表已寄出</B>，是「準備好了」；<B>貼上、黑貓收走</B>才算真的出貨。
          <br/><B>第一張一定要貼</B>（有數量的那張），系統靠它幫你追貨到哪了。
        </Note>
        <Img f="help-order-main-shipping.png" />
      </>
    ),
  },
  {
    id: 'scn-2',
    chip: '重印',
    title: '情境2：印壞了／不見了，要重印',
    body: (
      <>
        <Steps
          items={[
            <>在「需出貨」找到那筆，按<B>「重印相同貨單」</B>，可勾選要重印哪幾張。</>,
            <>會印出<B>一模一樣、同一個號</B>的貨單；把壞的丟掉、用新的。</>,
          ]}
        />
        <Img f="help-order-print-again.png" />
        <Img f="help-order-print-again-first.png" />
      </>
    ),
  },
  {
    id: 'scn-3',
    chip: '補單',
    title: '情境3：一箱裝不完，要追加幾箱（補單）',
    body: (
      <>
        <Steps
          items={[
            <>在那筆單按<B>「多箱追加補單」</B>。</>,
            <>會再給一張<B>新編號</B>的貨單，上面標<B>「第幾箱／共幾箱」</B>，照著貼。</>,
            <>要幾箱就補幾張，<B>箱數沒有上限</B>。</>,
          ]}
        />
        <Note>補的那幾張<B>不印數量</B>，只有第一張才印數量。
        <br/>已經印的單不見想重印，請用「重印相同貨單」，別用補單。</Note>
        <Img f="help-order-print-more.png" />
      </>
    ),
  },
  {
    id: 'scn-4',
    chip: '批次列印',
    title: '情境4：同品項一次全部印完（批次列印）',
    body: (
      <>
        <Steps
          items={[
            <>在「需出貨」，該品項下方點<B>「批次列印」</B>。</>,
            <>檢查要印的單有勾到、確認每筆要印幾張。</>,
            <>按<B>「列印勾選」</B>一次全部印出。</>,
            <>批次模式下不能做別的事，要切別頁先離開批次模式。</>,
          ]}
        />
        <Img f="help-order-print-bacth.png" />
        <Img f="help-order-print-batch-mode.png" />
      </>
    ),
  },
  {
    id: 'scn-5',
    chip: '出貨預告',
    title: '情境5：想看還沒到出貨時間的單',
    body: (
      <>
        <Bullets
          items={[
            <>下面選<B>「出貨預告」</B>，看到所有還不能出的單。</>,
            <>還沒到時間<B>不能印單</B>；要提早請聯絡無毒農。出貨預告仍可回報無法出貨。</>,
            <>若客人指定某天不可出貨，單會從「需出貨」跳回「出貨預告」，等下次可出才回來。</>,
          ]}
        />
        <Img f="help-upcoming.png" />
      </>
    ),
  },
  {
    id: 'scn-6',
    chip: '快到期',
    title: '情境6：卡片變色了（快到期）',
    body: (
      <>
        <Bullets items={[<>卡片<B>變黃、變橙、變紅</B>＝有狀況或快到期、甚至逾期。<B>越紅越先處理</B>。</>]} />
        <Img f="help-order-color.png" />
      </>
    ),
  },
  {
    id: 'scn-7',
    chip: '篩選',
    title: '情境7：只看特定品項／備註',
    body: (
      <>
        <Steps
          items={[
            <>「需出貨」「出貨預告」右上角有<B>「篩選」</B>。</>,
            <>展開可依<B>出貨日期、商品、關鍵字</B>篩訂單。</>,
          ]}
        />
        <Img f="help-filter.png" />
      </>
    ),
  },
  {
    id: 'scn-8',
    chip: '備貨總覽',
    title: '情境8：想知道總共要備幾箱',
    body: (
      <>
        <Steps
          items={[
            <>開下面<B>「備貨總覽」</B>，上方選「需出貨」。</>,
            <>會告訴你某水果、某規格<B>總共要出幾箱</B>，並用標籤標快到期、有狀況的單。</>,
          ]}
        />
        <Img f="help-preview-shippable.png" />
      </>
    ),
  },
  {
    id: 'scn-9',
    chip: '印單未出',
    title: '情境9：已經印了、還沒出的單',
    body: (
      <>
        <Steps
          items={[
            <>開「備貨總覽」，上方切到<B>「印單未出」</B>。</>,
            <>看到已印過、但黑貓還沒收走的單；可用<B>「印單日篩選」</B>依印單日期找。</>,
          ]}
        />
        <Img f="help-preview-printed.png" />
      </>
    ),
  },
  {
    id: 'scn-10',
    chip: '出貨總表',
    title: '情境10：印一張出貨總表',
    body: (
      <>
        <Steps
          items={[
            <>開「備貨總覽」，選<B>「需出貨」</B>或<B>「印單未出」</B>。</>,
            <>按<B>「列印出貨總表」</B>，彈窗預覽後印出 A4 清單（那段還沒出的單一次看）。</>,
            <>有備註的那列會<B>黃底紅字</B>，特別注意那幾筆。</>,
          ]}
        />
        <Img f="help-preview-list-button.png" />
        <Img f="help-preview-list.png" />
      </>
    ),
  },
  {
    id: 'scn-11',
    chip: '無法出貨',
    title: '情境11：真的出不了貨（缺貨、天氣、有事）',
    body: (
      <>
        <Steps
          items={[
            <>在那張單按<B>「無法出貨」</B>（紅色那顆，在最下面）。</>,
            <>填<B>原因</B>＋你大概哪天可以出。</>,
            <>無毒農會幫你改時間，改好會<B>重新回到可以出貨</B>，到時再出。</>,
            <><B>急件請務必也打電話給無毒農</B>，避免漏接。</>,
          ]}
        />
        <Img f="help-order-unable.png" />
      </>
    ),
  },
  {
    id: 'scn-12',
    chip: '改單重印',
    title: '情境12：客人改了單、要重新印',
    body: (
      <>
        <Steps
          items={[
            <>收到通知：某單已印過、但客人改了資訊。</>,
            <>那張單會亮<B>「⚠️已更新，請重印」</B>，舊物流編號被<B>劃掉（作廢）</B>。</>,
            <>按土黃色<B>「印單（取新物流編號）」</B>，印出<B>換了新號</B>的貨單。</>,
            <><B>把舊的撕掉丟掉</B>、貼上新的（常見是地址／收件人改了）。</>,
          ]}
        />
        <Img f="help-order-update.png" />
      </>
    ),
  },
  {
    id: 'scn-13',
    chip: '被取消',
    title: '情境13：這單被取消了',
    body: (
      <>
        <Bullets
          items={[
            <><B>還沒印</B>的：卡片變灰、標「已取消／無需出貨」，不用出；看過按「知道了」收起（不按 7 天後自動隱藏）。</>,
            <><B>已經印了</B>的：卡片出現<B>紅色「請撕單」</B>——把已貼的貨單<B>撕掉作廢</B>，這箱不用寄。</>,
          ]}
        />
        <Img f="help-order-cancel.png" />
      </>
    ),
  },
  {
    id: 'scn-16',
    chip: '查已出貨',
    title: '情境14：查以前出過的貨、某張單到哪了',
    body: (
      <>
        <Steps
          items={[
            <>點右下角<B>「更多」→「所有訂單查詢」</B>（手機按右上角選單）。</>,
            <>一打開<B>預設就顯示「已出貨」</B>，以前出過的貨都找得到。</>,
            <>要找特定一張：打開「篩選」，用<B>關鍵字</B>搜（收件人／手機／訂單編號／物流編號）。</>,
            <>「出貨狀態」可切<B>全部／未出貨／已出貨／其他</B>。</>,
          ]}
        />
        <Img f="help-all.png" />
        <Img f="help-all-list.png" />
      </>
    ),
  },

  {
    id: 'qa',
    title: '常見疑問',
    body: (
      <Bullets
        items={[
          <><B>按錯會壞掉／出兩次嗎？</B> 不會。亂按不會弄壞；系統只算你實際貼上、被黑貓收走的那箱。</>,
          <><B>印壞了？</B> 按「重印相同貨單」再印一張（同號）。</>,
          <><B>印表機沒反應／一直紅燈？</B> 先看電源、紙，還是不行就打電話，別硬弄。</>,
          <><B>沒網路？</B> 先打電話回報，用電話跟無毒農確認今天要出的單。</>,
          <><B>平板不見了？</B> 馬上打給無毒農，我們會停用你的帳號。</>,
          <><B>看不懂／不確定怎麼出？</B> 不要猜，打電話問無毒農，寧可多問一句，也不要出錯。</>,
        ]}
      />
    ),
  },
]

export default function Help() {
  // 預設全收合；點速查或大標題才展開
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setOpen((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const openAndScroll = (id: string) => {
    setOpen((prev) => new Set(prev).add(id))
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    )
  }
  const chips = SECTIONS.filter((s) => s.chip)

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
      {/* 速查目錄：一點就展開＋捲到 */}
      <div className="rounded-card border border-line bg-white p-4">
        <div className="mb-2 text-base font-bold text-ink2">情境速查（點一下跳到說明）</div>
        <div className="flex flex-wrap gap-2">
          {chips.map((s) => (
            <button
              key={s.id}
              onClick={() => openAndScroll(s.id)}
              className="rounded-full border-2 border-line bg-white px-4 py-1.5 text-base font-bold text-ink active:bg-mutedbg"
            >
              {s.chip}
            </button>
          ))}
        </div>
      </div>

      {/* 各段折疊（圖文交錯：圖片已嵌在 body 裡對應位置） */}
      <div className="space-y-2">
        {SECTIONS.map((s) => {
          const isOpen = open.has(s.id)
          return (
            <div key={s.id} id={s.id} className="overflow-hidden rounded-card border border-line bg-white">
              <button
                onClick={() => toggle(s.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left active:bg-mutedbg"
              >
                <span className="text-xl font-bold text-ink">{s.title}</span>
                <span className="shrink-0 text-2xl text-ink2">{isOpen ? '▴' : '▾'}</span>
              </button>
              {isOpen && (
                <div className="space-y-3 px-5 pb-5 text-lg leading-relaxed text-ink2">{s.body}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* 找誰（永遠展開，放最底） */}
      <div className="rounded-card border-2 border-brand bg-white p-5">
        <div className="text-xl font-bold text-ink">有問題找誰</div>
        <ul className="ml-5 mt-2 list-disc space-y-1 text-lg text-ink2">
          <li>出貨、改單、密碼問題 → 無毒農（客服）：☎ {CONTACT.catPhone}　LINE：{CONTACT.catLine}</li>
          <li>平板／印表機壞了 → {CONTACT.repair}</li>
        </ul>
      </div>
    </div>
  )
}
