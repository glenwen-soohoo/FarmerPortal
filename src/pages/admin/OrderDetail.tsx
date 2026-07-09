import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import StatusBadge from '../../components/StatusBadge'
import TempLayerTag from '../../components/TempLayerTag'
import { useStore } from '../../store'
import type { Order, ShipStatus } from '../../types'

const SHIP_OPTIONS: ShipStatus[] = [
  '未付款', '未達出貨時間', '可出貨', '已印單', '改單待重印', '已出貨', '已到貨', '逾期未出', '無法出貨', '訂單失敗',
]
const FIELD_LABEL: Record<string, string> = {
  variety: '清洗品種名', shipWindow: '預定出貨區間', blockedDates: '不可出貨日',
  forcedShipDate: '指定出貨日', remoteAgentCode: '偏遠客代',
  farmerRemark: '給農友備註', driverRemark: '出貨備註(司機)', rawRemark: '原始主單備註', shipStatus: '出貨狀態', judgeStatus: '判定狀態',
}

// MM/DD ↔ YYYY-MM-DD（mock 統一 2026 年，供 <input type=date> 用）
const toISO = (mmdd?: string) => {
  if (!mmdd) return ''
  const [m, d] = mmdd.split('/')
  if (!m || !d) return ''
  return `2026-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
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

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orders, farmers, manualEdit } = useStore()
  const o = orders.find((x) => x.id === id)

  const [variety, setVariety] = useState(o?.variety ?? '')
  const [winFrom, setWinFrom] = useState(toISO(o?.shipWindow?.[0]))
  const [winTo, setWinTo] = useState(toISO(o?.shipWindow?.[1]))
  const [blocked, setBlocked] = useState<BItem[]>(parseBlocked(o?.blockedDates))
  const [note, setNote] = useState(o?.farmerRemark ?? '')
  const [driverRemark, setDriverRemark] = useState(o?.driverRemark ?? '')
  const [shipStatus, setShipStatus] = useState<ShipStatus>(o?.shipStatus ?? '未達出貨時間')
  const [forcedShip, setForcedShip] = useState(toISO(o?.forcedShipDate))
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  // 原始主單備註：就地編輯（左卡，非放右側改單）
  const [rawEditing, setRawEditing] = useState(false)
  const [rawRemark, setRawRemark] = useState(o?.rawRemark ?? '')

  if (!o) {
    return (
      <AdminLayout title="訂單詳情">
        <div className="gox-card"><div className="gox-card-body" style={{ color: 'var(--gox-text-muted)' }}>找不到此訂單。</div></div>
      </AdminLayout>
    )
  }

  const farm = farmers.find((f) => f.id === o.farmerId)?.farm

  const setB = (i: number, patch: Partial<BItem>) => setBlocked((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeB = (i: number) => setBlocked((prev) => prev.filter((_, idx) => idx !== i))
  const addSingle = () => setBlocked((prev) => [...prev, { kind: 'single', a: '', b: '' }])
  const addRange = () => setBlocked((prev) => [...prev, { kind: 'range', a: '', b: '' }])

  const save = () => {
    if (winFrom && winTo && winFrom > winTo) { setErr('預定出貨區間：起日不可晚於迄日'); return }
    const badRange = blocked.find((it) => it.kind === 'range' && it.a && it.b && it.a > it.b)
    if (badRange) { setErr('不可出貨日區間：起日不可晚於迄日'); return }
    setErr('')
    const patch: Partial<Order> = {
      variety,
      farmerRemark: note,
      driverRemark,
      blockedDates: serializeBlocked(blocked),
      shipStatus,
      forcedShipDate: forcedShip ? fromISO(forcedShip) : '',
    }
    if (winFrom && winTo) patch.shipWindow = [fromISO(winFrom), fromISO(winTo)]
    manualEdit(o.id, patch, '營運人員')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const saveRaw = () => {
    manualEdit(o.id, { rawRemark }, '營運人員')
    setRawEditing(false)
  }

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0' }}>
      <div style={{ width: 104, flexShrink: 0, color: 'var(--gox-text-muted)' }}>{label}</div>
      <div style={{ flex: 1 }}>{value}</div>
    </div>
  )

  return (
    <AdminLayout title="訂單詳情">
      <button className="gox-btn-op" style={{ marginBottom: 12 }} onClick={() => navigate('/admin/dashboard')}>← 回派單總覽</button>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        {/* 左：訂單資訊（欄位順序見規劃 §4） */}
        <div className="gox-card">
          <div className="gox-card-title">訂單資訊 · {o.orderNumber}</div>
          <div className="gox-card-body">
            <Field
              label="物流單號"
              value={
                o.trackingNos?.length
                  ? <div>{o.trackingNos.map((t, i) => <div key={i}>{t}</div>)}</div>
                  : <span style={{ color: 'var(--gox-text-muted)' }}>尚無物流編號</span>
              }
            />
            <Field label="判定狀態" value={<StatusBadge status={o.judgeStatus} />} />
            <Field label="出貨狀態" value={<StatusBadge status={o.shipStatus} />} />
            <Field label="收件人" value={`${o.recipient}　${o.phone}`} />
            <Field
              label="收件地址"
              value={
                <span>
                  {o.address}
                  {o.remoteAgentCode && (
                    <span className="gox-tag is-warning" style={{ marginLeft: 8 }}>偏遠客代 {o.remoteAgentCode}</span>
                  )}
                </span>
              }
            />
            <Field label="農友" value={farm} />
            <Field label="商品" value={`${o.productName}　${o.spec}　×${o.qty}`} />
            <Field label="溫層" value={<TempLayerTag layer={o.tempLayer} />} />
            <Field label="預定出貨區間" value={o.shipWindow ? `${o.shipWindow[0]}–${o.shipWindow[1]}` : '—'} />
            <Field
              label="不可出貨日"
              value={o.blockedDates?.length ? <span style={{ color: 'var(--gox-danger)' }}>{o.blockedDates.join('、')}</span> : '—'}
            />
            <Field
              label="指定出貨日"
              value={o.forcedShipDate ? <span style={{ color: 'var(--gox-success)' }}>{o.forcedShipDate}</span> : '—'}
            />
            <Field label="農友印單日" value={o.printedAt || <span style={{ color: 'var(--gox-text-muted)' }}>尚未印單</span>} />
            {o.failReason && <Field label="無法出貨原因" value={o.failReason} />}
            <Field label="給農友備註" value={o.farmerRemark || <span style={{ color: 'var(--gox-text-muted)' }}>（AI 未產生，建議改單補上）</span>} />
            <Field label="出貨備註(司機)" value={o.driverRemark || <span style={{ color: 'var(--gox-text-muted)' }}>—</span>} />

            <div style={{ margin: '8px 0', borderTop: '1px solid var(--gox-card-border)' }} />

            {/* 原始主單備註：就地編輯 */}
            <div style={{ display: 'flex', gap: 12, padding: '6px 0' }}>
              <div style={{ width: 104, flexShrink: 0, color: 'var(--gox-text-muted)' }}>原始主單備註</div>
              <div style={{ flex: 1 }}>
                {!rawEditing ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ flex: 1, color: 'var(--gox-text-sub)' }}>{o.rawRemark || '—'}</span>
                    <button className="gox-btn-op" onClick={() => { setRawRemark(o.rawRemark); setRawEditing(true) }}>編輯</button>
                  </div>
                ) : (
                  <div>
                    <textarea className="gox-textarea" style={{ width: '100%' }} value={rawRemark} onChange={(e) => setRawRemark(e.target.value)} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                      <button className="gox-btn gox-btn-default" onClick={() => setRawEditing(false)}>取消</button>
                      <button className="gox-btn gox-btn-primary" onClick={saveRaw}>儲存</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右：手動改單（不含原始主單備註） */}
        <div className="gox-card">
          <div className="gox-card-title">手動改單</div>
          <div className="gox-card-body">
            <div className="gox-hint" style={{ marginBottom: 12 }}>
              覆寫 AI 判定；儲存後判定狀態自動標「人工修正判定」，之後排程不再覆蓋，並留下稽核。
            </div>

            <div className="gox-form-row">
              <label>清洗品種名</label>
              <input className="gox-input" style={{ flex: 1, minWidth: 160 }} value={variety} onChange={(e) => setVariety(e.target.value)} />
            </div>

            {/* 預定出貨區間：日曆、一行 */}
            <div className="gox-form-row" style={{ flexWrap: 'nowrap' }}>
              <label>預定出貨區間</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                <input type="date" className="gox-input" style={{ flex: 1, minWidth: 0 }} value={winFrom} onChange={(e) => setWinFrom(e.target.value)} />
                <span style={{ color: 'var(--gox-text-muted)' }}>～</span>
                <input type="date" className="gox-input" style={{ flex: 1, minWidth: 0 }} value={winTo} onChange={(e) => setWinTo(e.target.value)} />
              </div>
            </div>

            {/* 不可出貨日：新增單日 / 新增區間，皆日曆 */}
            <div className="gox-form-row" style={{ alignItems: 'flex-start' }}>
              <label>不可出貨日</label>
              <div style={{ flex: 1, minWidth: 0 }}>
                {blocked.length === 0 && <div className="gox-hint" style={{ marginBottom: 6 }}>無</div>}
                {blocked.map((it, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span className="gox-tag" style={{ flexShrink: 0 }}>{it.kind === 'single' ? '單日' : '區間'}</span>
                    <input type="date" className="gox-input" style={{ flex: 1, minWidth: 0 }} value={it.a} onChange={(e) => setB(i, { a: e.target.value })} />
                    {it.kind === 'range' && (
                      <>
                        <span style={{ color: 'var(--gox-text-muted)' }}>～</span>
                        <input type="date" className="gox-input" style={{ flex: 1, minWidth: 0 }} value={it.b} onChange={(e) => setB(i, { b: e.target.value })} />
                      </>
                    )}
                    <button className="gox-btn gox-btn-default" style={{ padding: '4px 10px', flexShrink: 0 }} onClick={() => removeB(i)}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button className="gox-btn gox-btn-default" style={{ padding: '4px 12px', fontSize: 13 }} onClick={addSingle}>＋ 新增單日</button>
                  <button className="gox-btn gox-btn-default" style={{ padding: '4px 12px', fontSize: 13 }} onClick={addRange}>＋ 新增區間</button>
                </div>
              </div>
            </div>

            <div className="gox-form-row">
              <label>指定出貨日</label>
              <input type="date" className="gox-input" value={forcedShip} onChange={(e) => setForcedShip(e.target.value)} />
              {forcedShip && (
                <button className="gox-btn gox-btn-default" style={{ padding: '4px 10px' }} onClick={() => setForcedShip('')}>清除</button>
              )}
            </div>

            <div className="gox-form-row">
              <label>給農友備註</label>
              <input className="gox-input" style={{ flex: 1, minWidth: 160 }} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="gox-form-row" style={{ alignItems: 'flex-start' }}>
              <label>出貨備註(司機)</label>
              <textarea className="gox-textarea" style={{ flex: 1, minWidth: 160 }} placeholder="給黑貓司機的配送備註（如：大門進、電聯管理室）" value={driverRemark} onChange={(e) => setDriverRemark(e.target.value)} />
            </div>

            <div className="gox-form-row">
              <label>出貨狀態</label>
              <select className="gox-select" value={shipStatus} onChange={(e) => setShipStatus(e.target.value as ShipStatus)}>
                {SHIP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {err && <div style={{ color: 'var(--gox-danger)', fontSize: 13, marginBottom: 8 }}>{err}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="gox-btn gox-btn-primary" onClick={save}>儲存改單</button>
              {saved && <span style={{ color: 'var(--gox-success)', fontSize: 13 }}>已儲存 ✓（判定狀態已標人工修正）</span>}
            </div>

            {/* 稽核 */}
            <div style={{ marginTop: 20, fontWeight: 600 }}>稽核紀錄</div>
            {o.auditLog && o.auditLog.length > 0 ? (
              <table className="gox-table" style={{ marginTop: 8 }}>
                <thead>
                  <tr><th>時間</th><th>改單者</th><th>欄位</th><th>原值 → 新值</th></tr>
                </thead>
                <tbody>
                  {o.auditLog.map((a, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{a.at}</td>
                      <td>{a.by}</td>
                      <td>{FIELD_LABEL[a.field] ?? a.field}</td>
                      <td><span style={{ color: 'var(--gox-text-muted)' }}>{a.from}</span> → <strong>{a.to}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="gox-hint" style={{ marginTop: 6 }}>尚無改單紀錄</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
