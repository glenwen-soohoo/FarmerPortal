import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import StatusBadge from '../../components/StatusBadge'
import TempLayerTag from '../../components/TempLayerTag'
import { useStore } from '../../store'
import type { BulkOrderType, JudgeStatus, Order, ShipStatus } from '../../types'

const SHIP_OPTIONS: ShipStatus[] = [
  '未付款', '未達出貨時間', '可出貨', '已印單', '改單待重印', '已出貨', '已到貨', '逾期未出', '無法出貨', '訂單失敗',
]
const JUDGE_OPTIONS: JudgeStatus[] = [
  '尚未判定', 'AI判定完成', 'AI判定完成(低信心)', 'AI判定失敗', '人工修正判定',
]

interface Query {
  kw: string
  from: string // YYYY-MM-DD（日曆）
  to: string
  ship: string[]
  judge: string[]
  bulk: BulkOrderType | 'all' // 企業匯單分類
}
const EMPTY: Query = { kw: '', from: '', to: '', ship: [], judge: [], bulk: 'all' }
// 進頁預設：出貨狀態只看「進行中 / 需處理」，隱藏 未付款 / 已出貨 / 已到貨 / 訂單失敗
const DEFAULT_QUERY: Query = {
  kw: '', from: '', to: '', judge: [], bulk: 'all',
  ship: ['未達出貨時間', '可出貨', '已印單', '改單待重印', '逾期未出', '無法出貨'],
}
// 企業匯單分類篩選：一般 / 7-11（bulkOrderType='統一711'）/ 企業送禮
const BULK_FILTER: { key: BulkOrderType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '一般', label: '一般' },
  { key: '統一711', label: '7-11' },
  { key: '企業送禮', label: '企業送禮' },
]
// YYYY-MM-DD → MM/DD（批次改單寫回 shipWindow / blockedDates 用；mock 統一 2026 年）
const fromISO = (iso: string) => { const [, m, d] = iso.split('-'); return m && d ? `${m}/${d}` : '' }

// order 的 MM/DD → 可比較的 YYYY-MM-DD（mock 統一 2026 年）
const norm = (mmdd?: string) => {
  if (!mmdd) return ''
  const [m, d] = mmdd.split('/')
  if (!m || !d) return ''
  return `2026-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}
const inRange = (day: string, from: string, to: string) => {
  if (!from && !to) return true
  if (!day) return false
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

// 複選 chips：最左「全部」(獨特色) → 分隔線 → 個別選項
function MultiChips({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const allActive = selected.length === 0 || selected.length === options.length
  const clickAll = () => onChange([]) // 全部＝清掉右邊個別選項（回到「顯示全部」）
  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <button
        onClick={clickAll}
        className={allActive ? 'gox-btn gox-btn-primary' : 'gox-btn gox-btn-default'}
        style={{ padding: '4px 14px', fontSize: 13 }}
      >
        全部
      </button>
      <span style={{ width: 1, alignSelf: 'stretch', margin: '2px 4px', background: 'var(--gox-card-border)' }} />
      {options.map((o) => {
        const on = selected.includes(o)
        return (
          <button
            key={o}
            onClick={() => toggle(o)}
            className="gox-btn"
            style={
              on
                ? { padding: '4px 12px', fontSize: 13, background: '#eaf3ec', borderColor: 'var(--gox-green)', color: 'var(--gox-green-hover)' }
                : { padding: '4px 12px', fontSize: 13, background: '#fff', borderColor: '#ccc', color: 'var(--gox-text)' }
            }
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const { orders, farmers, manualEdit } = useStore()
  const navigate = useNavigate()
  const farmerName = (id: number) => farmers.find((f) => f.id === id)?.farm ?? `#${id}`

  const [form, setForm] = useState<Query>(DEFAULT_QUERY)
  const [applied, setApplied] = useState<Query>(DEFAULT_QUERY)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showImport, setShowImport] = useState(false)
  const [showBatch, setShowBatch] = useState(false)
  // 批次修改欄位（留空＝該欄不動）
  const [bNote, setBNote] = useState('')
  const [bFrom, setBFrom] = useState('')
  const [bTo, setBTo] = useState('')
  const [bBlockFrom, setBBlockFrom] = useState('')
  const [bBlockTo, setBBlockTo] = useState('')
  const [msg, setMsg] = useState('')
  const flash = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(''), 2500) }

  const rows = useMemo(() => {
    const k = applied.kw.trim()
    return orders.filter((o) => {
      if (applied.ship.length && !applied.ship.includes(o.shipStatus)) return false
      if (applied.judge.length && !applied.judge.includes(o.judgeStatus)) return false
      if (applied.bulk !== 'all' && (o.bulkOrderType ?? '一般') !== applied.bulk) return false
      if (!inRange(norm(o.shipWindow?.[0]), applied.from, applied.to)) return false
      if (k) {
        const hay = `${o.orderNumber} ${farmerName(o.farmerId)} ${o.recipient} ${o.phone} ${o.productName} ${o.variety ?? ''} ${o.rawRemark} ${o.farmerRemark}`
        if (!hay.includes(k)) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, applied])

  const windowText = (o: Order) => (o.shipWindow ? `${o.shipWindow[0]}–${o.shipWindow[1]}` : '—')

  // 批次修改：只套用「有填」的欄位到所有勾選訂單（走 manualEdit，會記稽核＋標人工修正判定）
  const applyBatch = () => {
    if (bFrom && bTo && bFrom > bTo) { flash('預定出貨區間：起日不可晚於迄日'); return }
    if (bBlockFrom && bBlockTo && bBlockFrom > bBlockTo) { flash('不可出貨區間：起日不可晚於迄日'); return }
    const patch: Partial<Order> = {}
    if (bNote.trim()) patch.farmerRemark = bNote.trim()
    if (bFrom && bTo) patch.shipWindow = [fromISO(bFrom), fromISO(bTo)]
    if (bBlockFrom && bBlockTo) {
      const a = fromISO(bBlockFrom), b = fromISO(bBlockTo)
      patch.blockedDates = [a === b ? a : `${a}–${b}`]
    }
    if (Object.keys(patch).length === 0) { flash('沒有要修改的欄位（三項都留空）'); return }
    selected.forEach((id) => manualEdit(id, patch, '營運人員（批次）'))
    flash(`已批次修改 ${selected.size} 筆`)
    setSelected(new Set()); setShowBatch(false)
    setBNote(''); setBFrom(''); setBTo(''); setBBlockFrom(''); setBBlockTo('')
  }

  return (
    <AdminLayout title="派單總覽">
      <div className="gox-list-head" style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          派單總覽 <span style={{ color: 'var(--gox-text-muted)', fontSize: 14, fontWeight: 400 }}>共 {rows.length} 筆</span>
        </h2>
        <button className="gox-btn gox-btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowImport(true)}>企業匯單</button>
      </div>

      {msg && (
        <div style={{ position: 'fixed', top: 16, left: 0, right: 0, zIndex: 2000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div className="anim-slide-down" style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,.12)', padding: '10px 18px', fontSize: 14, color: 'var(--gox-text)', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--gox-success)', fontWeight: 700 }}>✓</span>{msg}
          </div>
        </div>
      )}

      {/* 篩選（輸入後按「查詢」才生效） */}
      <div className="gox-card">
        <div className="gox-card-body">
          <div className="gox-form-row">
            <label>關鍵字</label>
            <input
              className="gox-input"
              style={{ flex: 1, minWidth: 240 }}
              placeholder="訂單編號 / 農友 / 收件人 / 收件電話 / 商品 / 備註"
              value={form.kw}
              onChange={(e) => setForm({ ...form, kw: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && setApplied(form)}
            />
          </div>
          <div className="gox-form-row">
            <label>預定出貨區間</label>
            <input type="date" className="gox-input" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
            <span style={{ color: 'var(--gox-text-muted)' }}>～</span>
            <input type="date" className="gox-input" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </div>
          <div className="gox-form-row" style={{ alignItems: 'flex-start' }}>
            <label>出貨狀態</label>
            <MultiChips options={SHIP_OPTIONS} selected={form.ship} onChange={(ship) => setForm({ ...form, ship })} />
          </div>
          <div className="gox-form-row" style={{ alignItems: 'flex-start' }}>
            <label>判定狀態</label>
            <MultiChips options={JUDGE_OPTIONS} selected={form.judge} onChange={(judge) => setForm({ ...form, judge })} />
          </div>
          <div className="gox-form-row" style={{ alignItems: 'center' }}>
            <label>企業匯單</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BULK_FILTER.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setForm({ ...form, bulk: b.key })}
                  className={form.bulk === b.key ? 'gox-btn gox-btn-primary' : 'gox-btn gox-btn-default'}
                  style={{ padding: '4px 14px', fontSize: 13 }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className="gox-form-row" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
            <button className="gox-btn gox-btn-default" onClick={() => { setForm(EMPTY); setApplied(EMPTY) }}>清除</button>
            <button className="gox-btn gox-btn-primary" onClick={() => setApplied(form)}>查詢</button>
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="gox-card">
        <div className="gox-card-body is-table-padding">
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#eaf3ec', borderRadius: 6, marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>已選 {selected.size} 筆</span>
              <button className="gox-btn gox-btn-primary" style={{ padding: '4px 14px', fontSize: 13 }} onClick={() => setShowBatch(true)}>批次修改</button>
              <button className="gox-btn gox-btn-default" style={{ padding: '4px 14px', fontSize: 13 }} onClick={() => setSelected(new Set())}>取消選取</button>
            </div>
          )}
          <table className="gox-table">
            <thead>
              <tr>
                <th className="cell-center" style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((o) => selected.has(o.id))}
                    onChange={(e) => {
                      const next = new Set(selected)
                      if (e.target.checked) rows.forEach((o) => next.add(o.id))
                      else rows.forEach((o) => next.delete(o.id))
                      setSelected(next)
                    }}
                  />
                </th>
                <th>訂單 / 物流編號</th>
                <th>收件人 / 電話</th>
                <th>農友</th>
                <th>商品 / 規格</th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>派單狀態</span>
                    <a
                      className="gox-btn-op"
                      style={{ fontWeight: 400 }}
                      href="https://fmec.famiport.com.tw/FP_Entrance/QueryBox"
                      target="_blank"
                      rel="noreferrer"
                    >
                      貨態查詢
                    </a>
                  </div>
                </th>
                <th>預定出貨區間</th>
                <th>出貨判定</th>
                <th>給農友備註</th>
                <th>農友印單時間</th>
                <th className="cell-ops">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="cell-center">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={(e) => {
                        const next = new Set(selected)
                        if (e.target.checked) next.add(o.id)
                        else next.delete(o.id)
                        setSelected(next)
                      }}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div>{o.orderNumber}</div>
                    <div style={{ marginTop: 10 }}>
                      {o.trackingNos?.length ? (
                        o.trackingNos.map((t, i) => (
                          <div key={i} style={{ color: 'var(--gox-text-sub)' }}>{t}</div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--gox-text-muted)' }}>尚無物流編號</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>{o.recipient}</div>
                    <div style={{ color: 'var(--gox-text-muted)' }}>{o.phone}</div>
                  </td>
                  <td>{farmerName(o.farmerId)}</td>
                  <td>
                    <div>{o.variety || o.productName}</div>
                    <div style={{ color: 'var(--gox-text-muted)' }}>{o.spec} ×{o.qty}</div>
                    <div style={{ marginTop: 2 }}><TempLayerTag layer={o.tempLayer} small /></div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <StatusBadge status={o.judgeStatus} />
                      <StatusBadge status={o.shipStatus} />
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{windowText(o)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {(!o.blockedDates?.length && !o.forcedShipDate) ? (
                      <span style={{ color: 'var(--gox-text-muted)' }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {o.blockedDates?.length ? (
                          <div style={{ color: 'var(--gox-danger)' }}>
                            <div style={{ fontSize: 10, opacity: 0.85 }}>不可出貨日</div>
                            {o.blockedDates.map((d, i) => <div key={i}>{d}</div>)}
                          </div>
                        ) : null}
                        {o.forcedShipDate ? (
                          <div style={{ color: 'var(--gox-success)' }}>
                            <div style={{ fontSize: 10, opacity: 0.85 }}>指定出貨日</div>
                            <div>{o.forcedShipDate}</div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: 220, color: o.farmerRemark ? 'var(--gox-text)' : 'var(--gox-text-muted)' }}>{o.farmerRemark || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap', color: o.printedAt ? 'var(--gox-text)' : 'var(--gox-text-muted)' }}>
                    {o.printedAt
                      ? (() => { const [d, t] = o.printedAt.split(' '); return <>{d}<br />{t}</> })()
                      : '尚未印單'}
                  </td>
                  <td className="cell-ops">
                    <button className="gox-btn-op" onClick={() => navigate(`/admin/orders/${o.id}`)}>詳情 / 改單</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--gox-text-muted)' }}>沒有符合條件的訂單</div>
          )}
        </div>
      </div>

      {/* 企業匯單匯入 */}
      {showImport && (
        <div className="gox-modal-overlay" onClick={() => setShowImport(false)}>
          <div className="gox-modal-box" style={{ minWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h4>企業匯單匯入</h4>
            <p style={{ color: 'var(--gox-text-muted)', fontSize: 13, margin: '4px 0 12px' }}>
              下載範本，填好企業訂單後上傳；系統會轉成農友出貨平台訂單（示範環境不實際匯入）。
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="gox-btn gox-btn-default" onClick={() => flash('已下載匯單範本（示範）')}>下載範本</button>
              <label className="gox-btn gox-btn-primary" style={{ cursor: 'pointer' }}>
                上傳檔案
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { flash(`已選擇「${f.name}」（示範，未實際匯入）`); setShowImport(false) } }}
                />
              </label>
            </div>
            <div className="gox-modal-actions">
              <button className="gox-btn gox-btn-default" onClick={() => setShowImport(false)}>關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* 批次修改（給農友備註 / 預定出貨區間 / 不可出貨區間） */}
      {showBatch && (
        <div className="gox-modal-overlay" onClick={() => setShowBatch(false)}>
          <div className="gox-modal-box" style={{ minWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h4>批次修改　<span style={{ color: 'var(--gox-text-muted)', fontWeight: 400, fontSize: 14 }}>已選 {selected.size} 筆</span></h4>
            <p style={{ color: 'var(--gox-text-muted)', fontSize: 13, margin: '4px 0 12px' }}>只會套用「有填」的欄位；留空的欄位維持原值。套用即記入稽核並標「人工修正判定」。</p>
            <div className="gox-form-row" style={{ alignItems: 'flex-start' }}>
              <label>給農友備註</label>
              <textarea className="gox-textarea" style={{ flex: 1, minWidth: 200 }} value={bNote} onChange={(e) => setBNote(e.target.value)} placeholder="留空＝不改" />
            </div>
            <div className="gox-form-row">
              <label>預定出貨區間</label>
              <input type="date" className="gox-input" value={bFrom} onChange={(e) => setBFrom(e.target.value)} />
              <span style={{ color: 'var(--gox-text-muted)' }}>～</span>
              <input type="date" className="gox-input" value={bTo} onChange={(e) => setBTo(e.target.value)} />
            </div>
            <div className="gox-form-row">
              <label>不可出貨區間</label>
              <input type="date" className="gox-input" value={bBlockFrom} onChange={(e) => setBBlockFrom(e.target.value)} />
              <span style={{ color: 'var(--gox-text-muted)' }}>～</span>
              <input type="date" className="gox-input" value={bBlockTo} onChange={(e) => setBBlockTo(e.target.value)} />
            </div>
            <div className="gox-modal-actions">
              <button className="gox-btn gox-btn-default" onClick={() => setShowBatch(false)}>取消</button>
              <button className="gox-btn gox-btn-primary" onClick={applyBatch}>套用到 {selected.size} 筆</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
