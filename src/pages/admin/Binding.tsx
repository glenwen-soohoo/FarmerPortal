import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { useStore } from '../../store'

export default function Binding() {
  const { products, farmers, bindProduct } = useStore()
  const [onlyDirect, setOnlyDirect] = useState(true)
  const [onlyUnbound, setOnlyUnbound] = useState(false)

  const rows = products.filter((p) => (!onlyDirect || p.isTransform) && (!onlyUnbound || !p.boundFarmerId))

  return (
    <AdminLayout title="商品綁定">
      <div className="gox-list-head">
        <h2 style={{ margin: 0, fontSize: 18 }}>商品 ↔ 農友綁定維護</h2>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={onlyDirect} onChange={(e) => setOnlyDirect(e.target.checked)} />
            只看產地直送
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={onlyUnbound} onChange={(e) => setOnlyUnbound(e.target.checked)} />
            只看未綁定
          </label>
        </div>
      </div>

      <div className="gox-card">
        <div className="gox-card-body is-table-padding">
          <table className="gox-table">
            <thead>
              <tr>
                <th>商品</th>
                <th>規格</th>
                <th className="cell-center">直送</th>
                <th>綁定農友</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.spec}</td>
                  <td className="cell-center">{p.isTransform ? '是' : '—'}</td>
                  <td>
                    {p.boundFarmerId ? (
                      farmers.find((f) => f.id === p.boundFarmerId)?.farm
                    ) : (
                      <span className="gox-tag is-danger">未綁定</span>
                    )}
                  </td>
                  <td>
                    <select
                      className="gox-select"
                      value={p.boundFarmerId ?? ''}
                      onChange={(e) => bindProduct(p.id, e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <option value="">未綁定</option>
                      {farmers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.farm}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
