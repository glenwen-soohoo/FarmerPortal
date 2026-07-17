import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { CallResult, MasterInput, MasterItem, Provider } from '../ai/types'
import { callAI } from '../ai/providers'
import { PROVIDER_LABEL } from '../ai/providers'
import { DEFAULT_SYSTEM_PROMPT, buildUserContent } from '../ai/prompt'
import { TEMPLATES, blankItem, blankMaster } from '../ai/templates'
import { useAiConfig } from '../ai/config'

const PROVIDERS: Provider[] = ['gemini', 'openai', 'anthropic']
const TEMPS: string[] = ['常溫', '冷藏', '冷凍']

// 信心 → 判定狀態映射（F3 §3-5）
function mapJudge(needsHuman: boolean, confidence: number, threshold: number) {
  if (needsHuman) return { label: 'AI判定失敗（需人工）', color: '#C0392B', bg: '#FDEBEC' }
  if (confidence < threshold) return { label: 'AI判定完成（低信心）', color: '#9A4A0E', bg: '#FBE9D9' }
  return { label: 'AI判定完成', color: '#18583A', bg: '#E7F1EA' }
}

// ── 小元件 ───────────────────────────────────────────────
function Section({ title, desc, children, right }: { title: string; desc?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(43,43,38,0.06)' }}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          {desc && <p className="mt-1 text-sm text-ink2">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink2">{label}</span>
      {children}
    </label>
  )
}

const inputCls = 'rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none'

function Collapse({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-line">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold text-ink">
        <span>{title}</span>
        <span className="text-ink2">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="border-t border-line p-4">{children}</div>}
    </div>
  )
}

export default function AiLab() {
  const [cfg, setCfg] = useAiConfig()
  const [master, setMaster] = useState<MasterInput>(TEMPLATES[0].data)
  const [system, setSystem] = useState(DEFAULT_SYSTEM_PROMPT)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CallResult | null>(null)

  const provider = cfg.provider
  const hasKey = !!cfg.apiKeys[provider]?.trim()

  const patchMaster = (p: Partial<MasterInput>) => setMaster((m) => ({ ...m, ...p }))
  const patchItem = (i: number, p: Partial<MasterItem>) =>
    setMaster((m) => ({ ...m, items: m.items.map((it, idx) => (idx === i ? { ...it, ...p } : it)) }))
  const addItem = () => setMaster((m) => ({ ...m, items: [...m.items, blankItem()] }))
  const removeItem = (i: number) => setMaster((m) => ({ ...m, items: m.items.filter((_, idx) => idx !== i) }))

  const run = async () => {
    setLoading(true)
    setResult(null)
    const r = await callAI(cfg, system, buildUserContent(master))
    setResult(r)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-mutedbg text-ink">
      {/* 頂列 */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-3" style={{ boxShadow: '0 2px 6px rgba(43,43,38,0.06)' }}>
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold text-ink">AI 判定測試台</h1>
          <span className="text-sm text-ink2">規劃階段 · 本地直呼 AI · 對照 F3 §3</span>
        </div>
        <Link to="/" className="rounded-lg border border-line px-4 py-1.5 text-sm font-medium text-ink2">← 回首頁</Link>
      </header>

      <div className="mx-auto max-w-5xl space-y-4 p-6">
        {/* 模型設定 */}
        <Section title="① 模型設定" desc="Provider 可插拔（F3 §3-1）。金鑰只存在本機瀏覽器 localStorage，不上傳、不進版控。">
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => setCfg({ provider: p })}
                className={`rounded-lg border px-4 py-2 text-sm font-bold ${provider === p ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink2'}`}
              >
                {PROVIDER_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="模型 model">
              <input className={inputCls} value={cfg.models[provider]} onChange={(e) => setCfg({ models: { ...cfg.models, [provider]: e.target.value } })} />
            </Field>
            <Field label={`API 金鑰（${PROVIDER_LABEL[provider]}）`}>
              <input type="password" className={inputCls} placeholder="貼上你的金鑰（只存本機）" value={cfg.apiKeys[provider]} onChange={(e) => setCfg({ apiKeys: { ...cfg.apiKeys, [provider]: e.target.value } })} />
            </Field>
            <Field label={`temperature（${cfg.temperature}）`}>
              <input type="range" min={0} max={1} step={0.1} value={cfg.temperature} onChange={(e) => setCfg({ temperature: Number(e.target.value) })} />
            </Field>
            <Field label={`低信心門檻（confidence < ${cfg.confidenceThreshold} → 低信心）`}>
              <input type="range" min={0} max={1} step={0.05} value={cfg.confidenceThreshold} onChange={(e) => setCfg({ confidenceThreshold: Number(e.target.value) })} />
            </Field>
          </div>
        </Section>

        {/* 母單輸入 */}
        <Section title="② 母單輸入" desc="選一個範本帶入後手動改；或清空從零建。rawRemark 是 AI 唯一的自由文字來源。">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.key} onClick={() => setMaster(t.data)} title={t.hint} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink hover:border-brand">
                {t.label}
              </button>
            ))}
            <button onClick={() => setMaster(blankMaster())} className="rounded-lg border border-dashed border-line bg-white px-3 py-1.5 text-sm text-ink2">清空</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="masterOrderId">
              <input className={inputCls} type="number" value={master.masterOrderId} onChange={(e) => patchMaster({ masterOrderId: Number(e.target.value) })} />
            </Field>
            <Field label="masterOrderNo">
              <input className={inputCls} value={master.masterOrderNo} onChange={(e) => patchMaster({ masterOrderNo: e.target.value })} />
            </Field>
            <Field label="orderDate">
              <input className={inputCls} type="date" value={master.orderDate} onChange={(e) => patchMaster({ orderDate: e.target.value })} />
            </Field>
            <Field label="carrierLeadDays（黑貓到貨天數）">
              <input className={inputCls} type="number" value={master.carrierLeadDays} onChange={(e) => patchMaster({ carrierLeadDays: Number(e.target.value) })} />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="rawRemark（客人原始備註 = Orders.Remarks）">
              <textarea className={`${inputCls} min-h-[80px] font-medium`} value={master.rawRemark} onChange={(e) => patchMaster({ rawRemark: e.target.value })} />
            </Field>
          </div>

          {/* 子單列表 */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">子單 items（{master.items.length}）</span>
              <button onClick={addItem} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand">+ 新增子單</button>
            </div>
            {master.items.map((it, i) => (
              <div key={i} className="rounded-lg border border-line bg-mutedbg p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-ink2">#{i + 1}</span>
                  {master.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-xs font-medium text-danger">移除</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Field label="orderId"><input className={inputCls} type="number" value={it.orderId} onChange={(e) => patchItem(i, { orderId: Number(e.target.value) })} /></Field>
                  <Field label="subOrderNo"><input className={inputCls} value={it.subOrderNo} onChange={(e) => patchItem(i, { subOrderNo: e.target.value })} /></Field>
                  <Field label="farm 農園"><input className={inputCls} value={it.farm} onChange={(e) => patchItem(i, { farm: e.target.value })} /></Field>
                  <Field label="tempLayer">
                    <select className={inputCls} value={it.tempLayer} onChange={(e) => patchItem(i, { tempLayer: e.target.value })}>
                      {TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="productName"><input className={inputCls} value={it.productName} onChange={(e) => patchItem(i, { productName: e.target.value })} /></Field>
                  <Field label="spec 規格"><input className={inputCls} value={it.spec} onChange={(e) => patchItem(i, { spec: e.target.value })} /></Field>
                  <Field label="qty"><input className={inputCls} type="number" value={it.qty} onChange={(e) => patchItem(i, { qty: Number(e.target.value) })} /></Field>
                  <Field label="defaultShipWindow 起～迄">
                    <div className="flex items-center gap-1">
                      <input className={`${inputCls} w-full`} value={it.defaultShipWindow[0]} onChange={(e) => patchItem(i, { defaultShipWindow: [e.target.value, it.defaultShipWindow[1]] })} />
                      <span className="text-ink2">~</span>
                      <input className={`${inputCls} w-full`} value={it.defaultShipWindow[1]} onChange={(e) => patchItem(i, { defaultShipWindow: [it.defaultShipWindow[0], e.target.value] })} />
                    </div>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* System Prompt */}
        <Section title="③ System Prompt" desc="預填自 F3 §3-4，可即時修改試 AI 反應。" right={
          <button onClick={() => setSystem(DEFAULT_SYSTEM_PROMPT)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink2">還原預設</button>
        }>
          <textarea className={`${inputCls} min-h-[220px] w-full font-mono text-xs leading-relaxed`} value={system} onChange={(e) => setSystem(e.target.value)} />
        </Section>

        {/* 送出 */}
        <div className="flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading || !hasKey || master.items.length === 0}
            className="rounded-card bg-brand px-6 py-3 text-base font-bold text-white disabled:opacity-40"
          >
            {loading ? '判定中…' : '送出給 AI 判定'}
          </button>
          {!hasKey && <span className="text-sm text-danger">請先在「① 模型設定」填入 {PROVIDER_LABEL[provider]} 的 API 金鑰</span>}
        </div>

        {/* 結果 */}
        {result && <ResultView result={result} master={master} system={system} threshold={cfg.confidenceThreshold} />}
      </div>
    </div>
  )
}

// ── 結果檢視 ───────────────────────────────────────────────
function ResultView({ result, master, system, threshold }: { result: CallResult; master: MasterInput; system: string; threshold: number }) {
  const itemOf = (orderId: number) => master.items.find((it) => it.orderId === orderId)
  const resultIds = new Set(result.parsed?.results.map((r) => r.orderId) ?? [])
  const missing = master.items.filter((it) => !resultIds.has(it.orderId))

  return (
    <Section title="④ 判定結果" desc={`${PROVIDER_LABEL[result.provider]} · ${result.model} · ${result.ms} ms${result.usage ? ' · ' + result.usage : ''}`}>
      {!result.ok && (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#D98080', background: '#FDEBEC', color: '#C0392B' }}>
          呼叫失敗：{result.error}
        </div>
      )}

      {result.ok && result.parseError && (
        <div className="mb-3 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#E0B872', background: '#FBE9D9', color: '#9A4A0E' }}>
          回覆非合法 JSON：{result.parseError}（見下方原始回覆）
        </div>
      )}

      {result.ok && result.parsed && (
        <div className="space-y-3">
          {result.parsed.results.map((r, idx) => {
            const it = itemOf(r.orderId)
            const j = mapJudge(r.needsHuman, r.confidence, threshold)
            return (
              <div key={idx} className="rounded-lg border border-line bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-ink2">
                    <span className="font-bold text-ink">{it ? `${it.farm} · ${it.productName}` : `orderId ${r.orderId}`}</span>
                    {it && <span className="ml-2">{it.spec} ×{it.qty}</span>}
                    <span className="ml-2 text-muted">#{r.subOrderNo || r.orderId}</span>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: j.color, background: j.bg }}>
                    {j.label} · {r.confidence}
                  </span>
                </div>
                {/* 出貨區間（AI 決定要不要平移 → 系統執行固定長度後移，F2 §2-5） */}
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-mutedbg px-3 py-2 text-sm">
                  <span className="text-xs font-medium text-ink2">出貨區間 shipWindow：</span>
                  <span className="font-bold text-ink">{r.shipWindow ? `${r.shipWindow[0]} – ${r.shipWindow[1]}` : '—'}</span>
                  {(r.shiftSteps ?? 0) > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: '#9A4A0E', background: '#FBE9D9' }}>已平移 {r.shiftSteps} 步</span>
                  )}
                  {it && <span className="text-muted">預設 {it.defaultShipWindow[0]}–{it.defaultShipWindow[1]}</span>}
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <ResultRow label="給農友 farmerRemark" value={r.farmerRemark} />
                  <ResultRow label="給司機 driverRemark" value={r.driverRemark} />
                  <ResultRow label="不可出貨日 blockedDates" value={r.blockedDates?.length ? r.blockedDates.join('、') : ''} />
                  <ResultRow label="指定出貨日 forcedShipDate" value={r.forcedShipDate || ''} />
                </div>
                <div className="mt-2 border-t border-line pt-2 text-sm">
                  <span className="text-xs font-medium text-ink2">理由 reason：</span>
                  <span className="text-ink">{r.reason || '—'}</span>
                </div>
              </div>
            )
          })}

          {missing.length > 0 && (
            <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#E0B872', background: '#FBE9D9', color: '#9A4A0E' }}>
              注意：有 {missing.length} 張子單沒有對應的判定結果：{missing.map((m) => m.orderId).join('、')}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Collapse title="原始回覆（rawText）">
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-ink2">{result.rawText || '（空）'}</pre>
        </Collapse>
        <Collapse title="送出的內容（system + user + provider body）">
          <div className="space-y-3 text-xs">
            <div>
              <div className="mb-1 font-bold text-ink2">System Prompt</div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-ink2">{system}</pre>
            </div>
            <div>
              <div className="mb-1 font-bold text-ink2">User（母單 JSON）</div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-ink2">{buildUserContent(master)}</pre>
            </div>
            {result.requestBody && (
              <div>
                <div className="mb-1 font-bold text-ink2">Provider 送出 body</div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words text-ink2">{result.requestBody}</pre>
              </div>
            )}
          </div>
        </Collapse>
      </div>
    </Section>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-ink2">{label}：</span>
      <span className={value ? 'text-ink' : 'text-muted'}>{value || '（空）'}</span>
    </div>
  )
}
