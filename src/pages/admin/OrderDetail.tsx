import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import StatusBadge, { ReprintHistoryTags } from '../../components/StatusBadge'
import TempLayerTag from '../../components/TempLayerTag'
import { useStore } from '../../store'
import type { Order } from '../../types'

const FIELD_LABEL: Record<string, string> = {
  variety: '清洗品種名', blockedDates: '不可出貨日', forcedShipDate: '指定出貨日',
  farmerRemark: '出貨提醒', driverRemark: '配送提醒', judgeStatus: '判定狀態',
  shipStatus: '出貨狀態', shipWindow: '預定出貨區間',
}

// MM/DD ↔ YYYY-MM-DD（demo 假資料統一 2026 年，供 <input type=date> 顯示用）
const toISO = (mmdd?: string | null) => {
  if (!mmdd) return ''
  const [m, d] = mmdd.split('/')
  return m && d ? `2026-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ''
}
const fromISO = (iso: string) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${m}/${d}`
}

type BItem = { kind: 'single' | 'range'; a: string; b: string } // a,b = ISO
const parseBlocked = (arr?: string[]): BItem[] =>
  (arr ?? []).map((s) => {
    if (s.includes('–')) {
      const [a, b] = s.split('–')
      return { kind: 'range', a: toISO(a.trim()), b: toISO(b.trim()) }
    }
    return { kind: 'single', a: toISO(s.trim()), b: '' }
  })
const serializeBlocked = (items: BItem[]): string[] =>
  items.reduce<string[]>((acc, it) => {
    if (it.kind === 'single' && it.a) acc.push(fromISO(it.a))
    else if (it.kind === 'range' && it.a && it.b) acc.push(`${fromISO(it.a)}–${fromISO(it.b)}`)
    return acc
  }, [])

const trimmed = (s?: string | null) => (s ?? '').trim()
const fmtAuditValue = (v?: string | null) => (v == null || v === '' ? '—' : v)

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0' }}>
      <div style={{ width: 104, flexShrink: 0, color: 'var(--gox-text-muted)' }}>{label}</div>
      <div style={{ flex: 1 }}>{value}</div>
    </div>
  )
}

const TIP_WIDTH = 320

/**
 * 「?」點開／滑過才顯示的說明浮層。畫面只留輸入當下要知道的短規則，機制與背景收進這裡。
 * 浮層 portal 到 document.body 並用 position:fixed —— `.gox-card` 有 overflow:hidden，
 * 一般絕對定位浮層會被裁掉；跳出 DOM 層級是唯一乾淨做法。
 */
function Tip({ text }: { text: ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const pinned = useRef(false)

  const place = () => {
    const r = btn.current?.getBoundingClientRect()
    if (!r) return
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - TIP_WIDTH - 12)) })
  }

  useEffect(() => {
    if (!pos) return
    const close = () => { pinned.current = false; setPos(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [pos])

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={`gox-tip${pos ? ' is-open' : ''}`}
        aria-label="說明"
        onMouseEnter={place}
        onMouseLeave={() => { if (!pinned.current) setPos(null) }}
        onFocus={place}
        onBlur={() => { if (!pinned.current) setPos(null) }}
        onClick={() => { if (pinned.current) { pinned.current = false; setPos(null) } else { pinned.current = true; place() } }}
      >
        ?
      </button>
      {pos &&
        createPortal(
          <div className="gox-tip-pop" role="tooltip" style={{ top: pos.top, left: pos.left }}>{text}</div>,
          document.body,
        )}
    </>
  )
}

// 表單一列。label 綁 htmlFor（點標籤能 focus 輸入框）；「?」放欄位名旁邊。
function Row({
  id, label, sub, tip, top, children,
}: {
  id?: string
  label: string
  sub?: ReactNode
  tip?: ReactNode
  top?: boolean
  children: ReactNode
}) {
  return (
    <div className="gox-form-row" style={top ? { alignItems: 'flex-start' } : undefined}>
      <span className="gox-form-labelwrap">
        {id ? <label htmlFor={id}>{label}</label> : <span className="gox-form-label">{label}</span>}
        {tip && <Tip text={tip} />}
      </span>
      <div className="gox-form-col">
        {children}
        {sub && <div className="gox-form-sub">{sub}</div>}
      </div>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orders, farmers, manualEdit, cancelOrder, reactivateOrder, requestReprint, arriveOrder } = useStore()
  const o = orders.find((x) => x.id === id)

  // 改單表單：判定層欄位與出貨時間同一張表單、一顆儲存鈕，送出時各自判斷有沒有動過。
  const [variety, setVariety] = useState(o?.variety ?? '')
  const [blocked, setBlocked] = useState<BItem[]>(parseBlocked(o?.blockedDates))
  const [note, setNote] = useState(o?.farmerRemark ?? '')
  const [driverRemark, setDriverRemark] = useState(o?.driverRemark ?? '')
  const [forcedShip, setForcedShip] = useState(toISO(o?.forcedShipDate))
  const [winStart, setWinStart] = useState(toISO(o?.shipWindow?.[0]))
  const [winEnd, setWinEnd] = useState(toISO(o?.shipWindow?.[1] ?? ''))
  const [err, setErr] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [noChange, setNoChange] = useState(false)

  // 出貨軸人工動作
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmReprint, setConfirmReprint] = useState(false)
  const [reprintNote, setReprintNote] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonOther, setCancelReasonOther] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  if (!o) {
    return (
      <AdminLayout title="訂單詳情">
        <button className="gox-btn-op" style={{ marginBottom: 12 }} onClick={() => navigate('/admin/dashboard')}>← 回派單總覽</button>
        <div className="gox-card"><div className="gox-card-body" style={{ color: 'var(--gox-danger)' }}>找不到此訂單。</div></div>
      </AdminLayout>
    )
  }

  const farmName = farmers.find((f) => f.id === o.farmerId)?.farm ?? `#${o.farmerId}`

  const setB = (i: number, patch: Partial<BItem>) => setBlocked((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeB = (i: number) => setBlocked((prev) => prev.filter((_, idx) => idx !== i))
  const addSingle = () => setBlocked((prev) => [...prev, { kind: 'single', a: '', b: '' }])
  const addRange = () => setBlocked((prev) => [...prev, { kind: 'range', a: '', b: '' }])

  // 出貨日已成事實就不給改
  const windowLocked = ['已出貨', '已到貨', '取消'].includes(o.shipStatus)

  const canCancel = !['取消', '已出貨', '已到貨'].includes(o.shipStatus)
  const canReactivate = ['取消', '無法出貨', '改單待重印'].includes(o.shipStatus)
  const canReprint = o.shipStatus === '已印單'
  const canMarkArrived = o.shipStatus !== '已到貨' // 除「已到貨」外隨時可強制切已到貨（印單貼錯等可能跳過已出貨）
  const hasStatusAction = canCancel || canReactivate || canReprint || canMarkArrived

  // 判定層有沒有動過（正規化比對）
  const correctionDirty =
    trimmed(variety) !== trimmed(o.variety) ||
    trimmed(note) !== trimmed(o.farmerRemark) ||
    trimmed(driverRemark) !== trimmed(o.driverRemark) ||
    (forcedShip ? fromISO(forcedShip) : '') !== (o.forcedShipDate ?? '') ||
    serializeBlocked(blocked).join('|') !== serializeBlocked(parseBlocked(o.blockedDates)).join('|')

  // 出貨時間有沒有動過
  const windowDirty = winStart !== toISO(o.shipWindow?.[0]) || winEnd !== toISO(o.shipWindow?.[1] ?? '')

  const onSave = () => {
    const badRange = blocked.find((it) => it.kind === 'range' && it.a && it.b && it.a > it.b)
    if (badRange) { setErr('不可出貨日區間：起日不可晚於迄日'); return }
    if (windowDirty && !winStart) { setErr('請填出貨起日'); return }
    if (windowDirty && winEnd && winEnd < winStart) { setErr('最後出貨日不可早於出貨起日'); return }
    if (!correctionDirty && !windowDirty) {
      setErr(''); setNoChange(true)
      window.setTimeout(() => setNoChange(false), 2500)
      return
    }
    // 任何改單欄位（含預定出貨區間）都屬人工判定 → 一律走 manualEdit，標「人工修正判定」+ 記稽核
    const patch: Partial<Order> = {}
    if (correctionDirty) {
      patch.variety = variety
      patch.farmerRemark = note
      patch.driverRemark = driverRemark
      patch.blockedDates = serializeBlocked(blocked)
      patch.forcedShipDate = forcedShip ? fromISO(forcedShip) : ''
    }
    if (windowDirty) patch.shipWindow = [fromISO(winStart), winEnd ? fromISO(winEnd) : null]
    manualEdit(o.id, patch, '營運人員')
    setErr('')
    setOkMsg('已儲存 ✓；判定狀態已標人工修正')
    window.setTimeout(() => setOkMsg(''), 6000)
  }

  const doCancel = () => {
    const reason = (cancelReason === '其他' ? cancelReasonOther.trim() : cancelReason) || undefined
    cancelOrder(o.id, reason)
    setConfirmCancel(false)
    setStatusMsg('已取消 ✓')
    window.setTimeout(() => setStatusMsg(''), 2500)
  }
  const doReactivate = () => {
    reactivateOrder(o.id)
    setStatusMsg('已復原 ✓')
    window.setTimeout(() => setStatusMsg(''), 2500)
  }
  const doArrive = () => {
    arriveOrder(o.id)
    setStatusMsg('已標記已到貨 ✓')
    window.setTimeout(() => setStatusMsg(''), 2500)
  }
  // 標記改單待重印：備註有改先存改單（走 manualEdit，正確標人工修正+稽核），再切狀態。
  const doReprint = () => {
    if (reprintNote.trim() !== note.trim()) {
      manualEdit(o.id, { farmerRemark: reprintNote.trim() }, '營運人員')
      setNote(reprintNote.trim())
    }
    requestReprint(o.id)
    setConfirmReprint(false)
    setStatusMsg('已標記改單待重印 ✓')
    window.setTimeout(() => setStatusMsg(''), 2500)
  }

  const CANCEL_REASONS = ['客人取消', '缺貨／無法供貨', '重複下單', '改單重下']

  return (
    <AdminLayout title="訂單詳情">
      <button className="gox-btn-op" style={{ marginBottom: 12 }} onClick={() => navigate('/admin/dashboard')}>← 回派單總覽</button>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', alignItems: 'start' }}>
        {/* 左：改不了的事實（主站資料 + 系統推導）+ AI 判定 + 稽核 */}
        <div>
          <div className="gox-card">
            <div className="gox-card-title">訂單資訊 · {o.orderNumber}</div>
            <div className="gox-card-body">
              <Field
                label="物流單號"
                value={
                  o.trackingNos?.length
                    ? <div>{o.trackingNos.map((t, i) => <div key={i}>{t}</div>)}</div>
                    : <span style={{ color: 'var(--gox-text-muted)' }}>尚無物流單號</span>
                }
              />
              <Field
                label="出貨狀態"
                value={
                  <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    <StatusBadge status={o.shipStatus} />
                    <ReprintHistoryTags order={o} />
                  </span>
                }
              />
              <Field label="收件人" value={`${o.recipient}　${o.phone ?? ''}`} />
              <Field label="收件地址" value={o.address ?? '—'} />
              <Field label="農友" value={farmName} />
              <Field label="商品" value={`${o.productName}　${o.spec ?? ''}　×${o.qty}`} />
              <Field label="清洗品種名" value={o.variety || <span style={{ color: 'var(--gox-text-muted)' }}>—</span>} />
              <Field label="溫層" value={<TempLayerTag layer={o.tempLayer} />} />
              <Field
                label="企業匯單"
                value={o.bulkOrderType === '企業送禮' && o.enterpriseName ? `${o.bulkOrderType}　${o.enterpriseName}` : (o.bulkOrderType ?? '一般')}
              />
              <Field label="訂單金額" value={o.orderAmount != null ? o.orderAmount.toLocaleString('zh-TW') : '—'} />
              <Field label="農友列印時間" value={o.printedAt || <span style={{ color: 'var(--gox-text-muted)' }}>尚未列印</span>} />
              {o.failReason && <Field label="無法出貨原因" value={o.failReason} />}
              {o.cancelReason && <Field label="取消原因" value={o.cancelReason} />}
              <Field label="客服備註" value={o.csRemark || <span style={{ color: 'var(--gox-text-muted)' }}>—</span>} />

              <p className="gox-form-group">AI 判定</p>
              <Field label="判定狀態" value={<StatusBadge status={o.judgeStatus} />} />
              <Field
                label="信心"
                value={o.confidence == null ? <span style={{ color: 'var(--gox-text-muted)' }}>—</span> : `${Math.round(o.confidence * 100)}%`}
              />
              <Field label="判定理由" value={o.judgeReason || <span style={{ color: 'var(--gox-text-muted)' }}>—</span>} />
              <Field label="客人原始備註" value={<span style={{ color: 'var(--gox-text-sub)' }}>{o.rawRemark || '—'}</span>} />

              <p className="gox-form-group">
                稽核紀錄
                {(o.auditLog?.length ?? 0) > 0 && (
                  <span style={{ fontWeight: 400, color: 'var(--gox-text-muted)' }}>{o.auditLog!.length} 筆</span>
                )}
              </p>
              {o.auditLog && o.auditLog.length > 0 ? (
                <div className="gox-log-scroll">
                  <table className="gox-table">
                    <thead>
                      <tr><th>時間</th><th>改單者</th><th>欄位</th><th>原值</th><th>新值</th></tr>
                    </thead>
                    <tbody>
                      {o.auditLog.map((a, i) => (
                        <tr key={i}>
                          <td style={{ whiteSpace: 'nowrap' }}>{a.at}</td>
                          <td>{a.by}</td>
                          <td>{FIELD_LABEL[a.field] ?? a.field}</td>
                          <td style={{ color: 'var(--gox-text-muted)' }}>{fmtAuditValue(a.from)}</td>
                          <td><strong>{fmtAuditValue(a.to)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <span className="gox-hint">尚無異動紀錄</span>
              )}
            </div>
          </div>
        </div>

        {/* 右：可以動的東西。一張卡只有一顆儲存鈕；出貨狀態是點了就生效、不受儲存管。 */}
        <div>
          <div className="gox-card">
            <div className="gox-card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>人工改單</span>
              <Tip
                text={
                  <>
                    此處無法修改地址、價格等資訊，需在主站修改。<br />
                    在此改任何欄位都會把判定標成「人工修正判定」，之後 AI 不再覆蓋這張單。
                  </>
                }
              />
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                {noChange && <span style={{ color: 'var(--gox-text-muted)', fontSize: 13, fontWeight: 400 }}>尚未變更</span>}
                <button className="gox-btn gox-btn-primary" onClick={onSave}>儲存</button>
              </span>
            </div>
            <div className="gox-card-body">
              <p className="gox-form-group">出貨時間</p>

              {windowLocked ? (
                <div className="gox-hint" style={{ marginBottom: 12 }}>此單已{o.shipStatus}，出貨時間不可再改。</div>
              ) : (
                <>
                  <Row
                    label="預定出貨區間"
                    tip={
                      <>
                        AI 判斷時會根據「指定出貨日」及「不可出貨日」自動平移，區間長度不變。<br />
                        儲存會一併寫回主站的出貨日。
                      </>
                    }
                    sub={winEnd ? undefined : '迄日留空＝不會逾期'}
                  >
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input className="gox-input" type="date" aria-label="出貨起日" value={winStart} onChange={(e) => setWinStart(e.target.value)} />
                      <span style={{ color: 'var(--gox-text-muted)' }}>～</span>
                      <input className="gox-input" type="date" aria-label="最後出貨日" value={winEnd} onChange={(e) => setWinEnd(e.target.value)} />
                      {winEnd && <button className="gox-btn gox-btn-default gox-btn-sm" onClick={() => setWinEnd('')}>清除</button>}
                    </span>
                  </Row>
                  <Row id="forced-ship" label="指定出貨日" tip="僅能指定一日。">
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input id="forced-ship" type="date" className="gox-input" value={forcedShip} onChange={(e) => setForcedShip(e.target.value)} />
                      {forcedShip && <button className="gox-btn gox-btn-default gox-btn-sm" onClick={() => setForcedShip('')}>清除</button>}
                    </span>
                  </Row>

                  <Row label="不可出貨日" top tip="填客人不能收貨的日子。六日與國定假日系統自動避開，可填可不填。">
                    {blocked.length === 0 && <div className="gox-hint" style={{ marginBottom: 6 }}>無</div>}
                    {blocked.map((it, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span className="gox-tag" style={{ flexShrink: 0 }}>{it.kind === 'single' ? '單日' : '區間'}</span>
                        <input
                          type="date" className="gox-input" style={{ flex: 1, minWidth: 0 }}
                          aria-label={it.kind === 'single' ? `不可出貨日 ${i + 1}` : `不可出貨區間 ${i + 1} 起日`}
                          value={it.a} onChange={(e) => setB(i, { a: e.target.value })}
                        />
                        {it.kind === 'range' && (
                          <>
                            <span style={{ color: 'var(--gox-text-muted)' }}>～</span>
                            <input
                              type="date" className="gox-input" style={{ flex: 1, minWidth: 0 }}
                              aria-label={`不可出貨區間 ${i + 1} 迄日`}
                              value={it.b} onChange={(e) => setB(i, { b: e.target.value })}
                            />
                          </>
                        )}
                        <button className="gox-btn gox-btn-default" style={{ padding: '4px 10px', flexShrink: 0 }} aria-label={`移除第 ${i + 1} 筆不可出貨日`} onClick={() => removeB(i)}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button className="gox-btn gox-btn-default gox-btn-sm" onClick={addSingle}>＋ 新增單日</button>
                      <button className="gox-btn gox-btn-default gox-btn-sm" onClick={addRange}>＋ 新增區間</button>
                    </div>
                  </Row>
                </>
              )}

              <p className="gox-form-group">出貨說明</p>

              <Row id="variety" label="清洗品種名">
                <input id="variety" className="gox-input" style={{ width: '100%' }} value={variety} onChange={(e) => setVariety(e.target.value)} />
              </Row>
              <Row id="farmer-remark" label="出貨提醒">
                <input id="farmer-remark" className="gox-input" style={{ width: '100%' }} placeholder="農友看得到，如：貼名片" value={note} onChange={(e) => setNote(e.target.value)} />
              </Row>
              <Row id="driver-remark" label="配送提醒" top>
                <textarea id="driver-remark" className="gox-textarea" style={{ width: '100%' }} placeholder="給黑貓司機，如：大門進、電聯管理室" value={driverRemark} onChange={(e) => setDriverRemark(e.target.value)} />
              </Row>

              {err && <div role="alert" style={{ color: 'var(--gox-danger)', fontSize: 13, marginTop: 8 }}>{err}</div>}
              {okMsg && <div role="status" style={{ color: 'var(--gox-success)', fontSize: 13, marginTop: 8 }}>{okMsg}</div>}
            </div>
          </div>

          {/* 出貨狀態獨立成一張卡（放人工改單下方）：守衛式動作、按下立即生效、不受儲存管 */}
          <div className="gox-card" style={{ marginTop: 16 }}>
            <div className="gox-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>出貨狀態</span>
              <Tip
                text={
                  <>
                    狀態由系統推導，人工只能做下列動作；按下立即生效、不需儲存。<br />
                    農友已印單才會出現「標記改單待重印」，重印狀態會向黑貓要取新的物流單號。
                  </>
                }
              />
              <StatusBadge status={o.shipStatus} />
              {o.shipStatus === '取消' && o.cancelReason && (
                <span style={{ color: 'var(--gox-text-muted)', fontSize: 13, fontWeight: 400 }}>（{o.cancelReason}）</span>
              )}
            </div>
            <div className="gox-card-body">
              {hasStatusAction ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {canCancel && (
                    <button className="gox-btn gox-btn-danger gox-btn-sm" onClick={() => { setCancelReason(''); setCancelReasonOther(''); setConfirmCancel(true) }}>取消此訂單</button>
                  )}
                  {canReactivate && (
                    <button className="gox-btn gox-btn-default gox-btn-sm" onClick={doReactivate}>
                      {o.shipStatus === '取消' ? '復原取消' : o.shipStatus === '改單待重印' ? '取消待重印' : '復原（重新可出貨）'}
                    </button>
                  )}
                  {canReprint && (
                    <button className="gox-btn gox-btn-default gox-btn-sm" onClick={() => { setReprintNote(note); setConfirmReprint(true) }}>標記改單待重印</button>
                  )}
                  {canMarkArrived && (
                    <button className="gox-btn gox-btn-default gox-btn-sm" onClick={doArrive}>標記已到貨</button>
                  )}
                  {statusMsg && <span role="status" style={{ color: 'var(--gox-success)', fontSize: 13 }}>{statusMsg}</span>}
                </div>
              ) : (
                <div className="gox-hint">
                  此單已到貨，沒有可用的人工動作。
                  {statusMsg && <span role="status" style={{ color: 'var(--gox-success)', fontSize: 13, marginLeft: 8 }}>{statusMsg}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 取消訂單：帶原因 */}
      {confirmCancel && (
        <div className="gox-modal-overlay" onClick={() => setConfirmCancel(false)}>
          <div className="gox-modal-box" style={{ minWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h4>確認取消訂單</h4>
            <p>
              確定取消訂單「{o.orderNumber}」？
              {o.printedAt ? '此單已印過，取消後農友端會提示撕單。' : '此單尚未印單。'}
              取消後可用「復原取消」還原。
            </p>
            <div className="gox-form-row" style={{ marginTop: 8, alignItems: 'flex-start' }}>
              <label htmlFor="cancel-reason">取消原因</label>
              <div style={{ flex: 1, minWidth: 160 }}>
                <select id="cancel-reason" className="gox-input" style={{ width: '100%' }} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                  <option value="">（請選擇）</option>
                  {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  <option value="其他">其他（自填）</option>
                </select>
                {cancelReason === '其他' && (
                  <input className="gox-input" style={{ width: '100%', marginTop: 6 }} aria-label="自填取消原因" placeholder="請輸入取消原因" value={cancelReasonOther} onChange={(e) => setCancelReasonOther(e.target.value)} />
                )}
              </div>
            </div>
            <div className="gox-modal-actions">
              <button className="gox-btn gox-btn-default" onClick={() => setConfirmCancel(false)}>取消</button>
              <button className="gox-btn gox-btn-danger" onClick={doCancel}>確定取消訂單</button>
            </div>
          </div>
        </div>
      )}

      {/* 標記改單待重印 */}
      {confirmReprint && (
        <div className="gox-modal-overlay" onClick={() => setConfirmReprint(false)}>
          <div className="gox-modal-box" style={{ minWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h4>標記改單待重印</h4>
            <p>
              此單「{o.orderNumber}」已印過。標記後農友端會顯示「已更新，請重印」，農友重印時會向黑貓<strong>重新取號</strong>（舊號作廢）。
              若因改地址，請先在主站改好收件資料。
            </p>
            <div className="gox-form-row" style={{ marginTop: 8, alignItems: 'flex-start' }}>
              <label htmlFor="reprint-note">出貨提醒</label>
              <textarea id="reprint-note" className="gox-textarea" style={{ flex: 1, minWidth: 160 }} placeholder="改單原因/提醒（會顯示在農友出貨提醒，選填）" value={reprintNote} onChange={(e) => setReprintNote(e.target.value)} />
            </div>
            <div className="gox-modal-actions">
              <button className="gox-btn gox-btn-default" onClick={() => setConfirmReprint(false)}>取消</button>
              <button className="gox-btn gox-btn-primary" onClick={doReprint}>確定標記</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
