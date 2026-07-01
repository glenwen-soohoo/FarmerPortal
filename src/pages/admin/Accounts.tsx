import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { useStore } from '../../store'
import type { Farmer } from '../../types'

const STATUS_TAG: Record<Farmer['status'], string> = {
  已開通: 'is-success',
  未開通: 'is-warning',
  已停用: 'is-danger',
}

export default function Accounts() {
  const { farmers, setAccountStatus } = useStore()
  const [detail, setDetail] = useState<Farmer | null>(null)
  const [confirmDisable, setConfirmDisable] = useState<Farmer | null>(null)
  const [msg, setMsg] = useState('')

  const flash = (m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg(''), 2500)
  }

  // 依狀態決定按鈕：開通/停用互斥；未開通無「重設密碼」
  const Actions = ({ f }: { f: Farmer }) => (
    <>
      {f.status === '未開通' && (
        <button className="gox-btn-op" onClick={() => { setAccountStatus(f.id, '已開通'); flash(`已開通「${f.farm}」（示意：發送初始密碼簡訊）`) }}>開通</button>
      )}
      {f.status === '已開通' && (
        <>
          <button className="gox-btn-op" onClick={() => setConfirmDisable(f)}>停用</button>
          <button className="gox-btn-op" onClick={() => flash(`已發送重設密碼連結給「${f.farm}」（示意）`)}>重設密碼</button>
        </>
      )}
      {f.status === '已停用' && (
        <button className="gox-btn-op" onClick={() => { setAccountStatus(f.id, '已開通'); flash(`已重新啟用「${f.farm}」`) }}>重新啟用</button>
      )}
    </>
  )

  return (
    <AdminLayout title="農友帳號管理">
      <div className="gox-list-head">
        <h2 style={{ margin: 0, fontSize: 18 }}>
          農友帳號管理 <span style={{ color: 'var(--gox-text-muted)', fontSize: 14, fontWeight: 400 }}>共 {farmers.length} 筆</span>
        </h2>
        {msg && <span style={{ color: 'var(--gox-success)', fontSize: 13 }}>{msg}</span>}
      </div>

      <div className="gox-mockup-notice">
        <span className="gox-mockup-strong">master 在 Enzo</span>：農友主檔資料唯讀，本頁只做本系統的開通 / 停用 / 重設密碼；密碼欄與重設密碼需 Enzo 端配合。
      </div>

      <div className="gox-card">
        <div className="gox-card-body is-table-padding">
          <table className="gox-table">
            <thead>
              <tr>
                <th>農場 / 品牌</th>
                <th>帳號(手機)</th>
                <th>產地</th>
                <th>狀態</th>
                <th>最後登入</th>
                <th className="cell-ops">操作</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f.id}>
                  <td>{f.farm}</td>
                  <td>{f.phone}</td>
                  <td>{f.origin ?? '—'}</td>
                  <td><span className={`gox-tag ${STATUS_TAG[f.status]}`}>{f.status}</span></td>
                  <td>{f.lastLogin ?? '從未登入'}</td>
                  <td className="cell-ops">
                    <button className="gox-btn-op" onClick={() => setDetail(f)}>詳情</button>
                    <Actions f={f} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 詳細資料彈窗（唯讀） */}
      {detail && (
        <div className="gox-modal-overlay" onClick={() => setDetail(null)}>
          <div className="gox-modal-box" onClick={(e) => e.stopPropagation()}>
            <h4>{detail.farm}　<span className={`gox-tag ${STATUS_TAG[detail.status]}`} style={{ verticalAlign: 'middle' }}>{detail.status}</span></h4>
            <table className="gox-table">
              <tbody>
                <tr><th style={{ width: 96 }}>聯絡人</th><td>{detail.name}</td></tr>
                <tr><th>品牌</th><td>{detail.brand ?? '—'}</td></tr>
                <tr><th>手機</th><td>{detail.phone}</td></tr>
                <tr><th>產地</th><td>{detail.origin ?? '—'}</td></tr>
                <tr><th>認證</th><td>{detail.cert ?? '—'}</td></tr>
                <tr><th>銀行帳戶</th><td>{detail.bank ?? '—'}</td></tr>
                <tr><th>LINE ID</th><td>{detail.lineId ?? '—'}</td></tr>
                <tr><th>最後登入</th><td>{detail.lastLogin ?? '從未登入'}</td></tr>
              </tbody>
            </table>
            <div className="gox-modal-actions">
              <span style={{ marginRight: 'auto' }}><Actions f={detail} /></span>
              <button className="gox-btn gox-btn-default" onClick={() => setDetail(null)}>關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* 停用二次確認 */}
      {confirmDisable && (
        <div className="gox-modal-overlay" onClick={() => setConfirmDisable(null)}>
          <div className="gox-modal-box" style={{ minWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h4>確認停用</h4>
            <p>確定要停用「{confirmDisable.farm}」的帳號？停用後農友將無法登入。</p>
            <div className="gox-modal-actions">
              <button className="gox-btn gox-btn-default" onClick={() => setConfirmDisable(null)}>取消</button>
              <button className="gox-btn gox-btn-danger" onClick={() => { setAccountStatus(confirmDisable.id, '已停用'); flash(`已停用「${confirmDisable.farm}」`); setConfirmDisable(null) }}>確定停用</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
