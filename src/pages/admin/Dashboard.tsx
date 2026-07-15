import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import StatusBadge from '../../components/StatusBadge'
import TempLayerTag from '../../components/TempLayerTag'
import { useStore } from '../../store'
import type { JudgeStatus, Order, ShipStatus } from '../../types'

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
}
const EMPTY: Query = { kw: '', from: '', to: '', ship: [], judge: [] }
// 進頁預設：出貨狀態只看「進行中 / 需處理」，隱藏 未付款 / 已出貨 / 已到貨 / 訂單失敗
const DEFAULT_QUERY: Query = {
  kw: '', from: '', to: '', judge: [],
  ship: ['未達出貨時間', '可出貨', '已印單', '改單待重印', '逾期未出', '無法出貨'],
}

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
  const { orders, farmers } = useStore()
  const navigate = useNavigate()
  const farmerName = (id: number) => farmers.find((f) => f.id === id)?.farm ?? `#${id}`

  const [form, setForm] = useState<Query>(DEFAULT_QUERY)
  const [applied, setApplied] = useState<Query>(DEFAULT_QUERY)

  const rows = useMemo(() => {
    const k = applied.kw.trim()
    return orders.filter((o) => {
      if (applied.ship.length && !applied.ship.includes(o.shipStatus)) return false
      if (applied.judge.length && !applied.judge.includes(o.judgeStatus)) return false
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

  return (
    <AdminLayout title="派單總覽">
      <div className="gox-list-head">
        <h2 style={{ margin: 0, fontSize: 18 }}>
          派單總覽 <span style={{ color: 'var(--gox-text-muted)', fontSize: 14, fontWeight: 400 }}>共 {rows.length} 筆</span>
        </h2>
      </div>

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
          <div className="gox-form-row" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
            <button className="gox-btn gox-btn-default" onClick={() => { setForm(EMPTY); setApplied(EMPTY) }}>清除</button>
            <button className="gox-btn gox-btn-primary" onClick={() => setApplied(form)}>查詢</button>
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="gox-card">
        <div className="gox-card-body is-table-padding">
          <table className="gox-table">
            <thead>
              <tr>
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
    </AdminLayout>
  )
}
