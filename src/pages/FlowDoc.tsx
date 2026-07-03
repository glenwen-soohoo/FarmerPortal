import { Link } from 'react-router-dom'

// 狀態流程說明（依 types.ts 的 JudgeStatus × ShipStatus 與 store 的轉移邏輯繪製）

type Tone = 'grey' | 'green' | 'greenDeep' | 'amber' | 'red' | 'blue' | 'coffee'
const TONE: Record<Tone, { bg: string; text: string; border: string }> = {
  grey: { bg: '#F0EDE6', text: '#6B6B5F', border: '#D8D3C7' },
  green: { bg: '#E6F0E8', text: '#1F6E43', border: '#1F6E43' },
  greenDeep: { bg: '#1F6E43', text: '#FFFFFF', border: '#1F6E43' },
  amber: { bg: '#FBF3E2', text: '#A8741A', border: '#D99A2B' },
  red: { bg: '#FBEAEA', text: '#C0392B', border: '#C0392B' },
  blue: { bg: '#E7F0FA', text: '#2C6F9E', border: '#2C6F9E' },
  coffee: { bg: '#EFE7DE', text: '#7A5230', border: '#7A5230' },
}

function Node({ label, tone = 'grey' }: { label: string; tone?: Tone }) {
  const c = TONE[tone]
  return (
    <span
      className="inline-block whitespace-nowrap rounded px-3 py-2 text-base font-bold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {label}
    </span>
  )
}

function Arrow({ label, bidi }: { label?: string; bidi?: boolean }) {
  return (
    <span className="inline-flex flex-col items-center px-1 text-muted">
      {label && <span className="text-xs leading-none">{label}</span>}
      <span className="text-xl leading-none">{bidi ? '⇄' : '→'}</span>
    </span>
  )
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-1 text-xl font-bold text-ink">{title}</h2>
      {desc && <p className="mb-3 text-base text-ink2">{desc}</p>}
      <div className="rounded-card border border-line bg-white p-4">{children}</div>
    </section>
  )
}

export default function FlowDoc() {
  return (
    <div className="min-h-screen bg-cream p-6" style={{ fontSize: 16 }}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">訂單狀態流程說明</h1>
          <Link to="/" className="text-base font-medium text-brand">
            ← 回入口
          </Link>
        </div>
        <p className="mb-6 text-base text-ink2">
          一張訂單有兩條獨立的軸：<strong className="text-ink">判定</strong>（AI／人工把客人備註清洗成可用資訊）與{' '}
          <strong className="text-ink">出貨</strong>（訂單在出貨流程走到哪）。兩軸互不阻塞。
        </p>

        {/* 判定軸 */}
        <Section
          title="① 判定流程（JudgeStatus）"
          desc="把客人母單的原始備註，清洗成「品種名 / 給農友的乾淨提醒 / 不可出貨日 / 可出貨區間」。此流程「非阻塞」——判定完成即可派單，低信心或失敗也照常派，只是後台會被提醒可介入。"
        >
          <div className="flex flex-wrap items-center gap-y-3">
            <Node label="尚未判定" tone="grey" />
            <Arrow label="AI 判定" />
            <span className="inline-flex flex-col gap-2">
              <Node label="AI判定完成" tone="green" />
              <Node label="AI判定完成(低信心)" tone="amber" />
              <Node label="AI判定失敗" tone="red" />
            </span>
            <Arrow label="後台改單覆寫" />
            <Node label="人工修正判定" tone="blue" />
          </div>
          <p className="mt-3 text-sm text-muted">
            註：業務在後台「改單」覆寫任何欄位後，該單判定來源即標為「人工修正判定」，並留下稽核紀錄。
          </p>
        </Section>

        {/* 出貨軸主流程 */}
        <Section
          title="② 出貨流程（ShipStatus）— 主線"
          desc="訂單在出貨流程的位置。農友端主要看「可出貨 → 已印單 → 已出貨」這段。"
        >
          <div className="flex flex-wrap items-center gap-y-3">
            <Node label="未付款" tone="grey" />
            <Arrow label="付款" />
            <Node label="未達出貨時間" tone="grey" />
            <Arrow label="進入區間 / 不可出貨日退回" bidi />
            <Node label="可出貨" tone="green" />
            <Arrow label="農友印單" />
            <Node label="已印單" tone="coffee" />
            <Arrow label="系統偵測黑貓收貨" />
            <Node label="已出貨" tone="greenDeep" />
            <Arrow label="配達" />
            <Node label="已到貨" tone="greenDeep" />
          </div>
        </Section>

        {/* 出貨軸分支 */}
        <Section title="③ 出貨流程 — 分支 / 例外">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-y-3">
              <Node label="可出貨 / 已印單" tone="green" />
              <Arrow label="業務改單" />
              <Node label="改單待重印" tone="amber" />
              <Arrow label="農友重印" />
              <Node label="已印單" tone="coffee" />
            </div>
            <div className="flex flex-wrap items-center gap-y-3">
              <Node label="可出貨 / 已印單" tone="green" />
              <Arrow label="出貨窗口已過" />
              <Node label="逾期未出" tone="red" />
            </div>
            <div className="flex flex-wrap items-center gap-y-3">
              <Node label="可出貨" tone="green" />
              <Arrow label="農友回報出不了" />
              <Node label="無法出貨" tone="red" />
            </div>
            <div className="flex flex-wrap items-center gap-y-3">
              <Node label="可出貨" tone="green" />
              <Arrow label="遇不可出貨日" />
              <Node label="未達出貨時間" tone="grey" />
              <span className="ml-2 text-sm text-muted">（退回，等過了不可出貨日再開放）</span>
            </div>
            <div className="flex flex-wrap items-center gap-y-3">
              <Node label="未付款" tone="grey" />
              <Arrow label="逾期未付 / 取消" />
              <Node label="訂單失敗" tone="red" />
            </div>
          </div>
        </Section>

        {/* 農友端分頁對應 */}
        <Section title="④ 農友端分頁 對應哪些出貨狀態">
          <div className="overflow-x-auto">
            <table className="w-full text-base" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F0EDE6' }}>
                  <th className="px-3 py-2 text-left font-bold" style={{ border: '1px solid #E5E1D8' }}>分頁</th>
                  <th className="px-3 py-2 text-left font-bold" style={{ border: '1px solid #E5E1D8' }}>顯示的出貨狀態</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 font-bold" style={{ border: '1px solid #E5E1D8' }}>可出貨</td>
                  <td className="px-3 py-2" style={{ border: '1px solid #E5E1D8' }}>可出貨、已印單、改單待重印（可操作：印單 / 黑貓收貨 / 重新印單 / 無法出貨）</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold" style={{ border: '1px solid #E5E1D8' }}>出貨預告</td>
                  <td className="px-3 py-2" style={{ border: '1px solid #E5E1D8' }}>未達出貨時間（唯讀，僅顯示「尚未到出貨時間」）</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold" style={{ border: '1px solid #E5E1D8' }}>出貨紀錄</td>
                  <td className="px-3 py-2" style={{ border: '1px solid #E5E1D8' }}>已出貨（、已到貨）</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold" style={{ border: '1px solid #E5E1D8' }}>所有訂單</td>
                  <td className="px-3 py-2" style={{ border: '1px solid #E5E1D8' }}>全部狀態皆可查（出貨日區間 / 關鍵字查詢）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  )
}
