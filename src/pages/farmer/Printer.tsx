import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import BigButton from '../../components/BigButton'
import ConfirmDialog from '../../components/ConfirmDialog'
import { Picker } from '../../components/Picker'
import type { FarmerOutletCtx } from './FarmerLayout'

// 目前裝置：HP LaserJet M111w（A4 黑白雷射；Wi-Fi 2.4G / Wi-Fi Direct / USB；Mopria、AirPrint）
const PRINTER_NAME = 'HP LaserJet M111w'
const PRINTER_TYPE = 'A4 黑白雷射'
const CONN_METHODS = ['Wi-Fi', 'Wi-Fi Direct', 'USB'] as const
type ConnMethod = (typeof CONN_METHODS)[number]

// 附近可選的無線網路（Demo；實機由裝置掃描）
const WIFI_NETWORKS = ['GreenBox-2F', 'GreenBox-1F', 'TP-Link_5566', '農會辦公室']

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <div className="mb-3 text-base font-bold text-ink2">{title}</div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4" style={{ minHeight: 44 }}>
      <span className="text-lg text-ink">{label}</span>
      {children}
    </div>
  )
}

// 開關
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="relative inline-flex shrink-0 items-center rounded-full transition-colors"
      style={{ width: 56, height: 32, background: on ? '#1F6E43' : '#C9C4B8' }}
    >
      <span
        className="inline-block rounded-full bg-white"
        style={{ width: 26, height: 26, transform: on ? 'translateX(27px)' : 'translateX(3px)', transition: 'transform .15s' }}
      />
    </button>
  )
}

export default function Printer() {
  const { printerConnected, setPrinterConnected } = useOutletContext<FarmerOutletCtx>()
  const [conn, setConn] = useState<ConnMethod>('Wi-Fi')
  const [ssid, setSsid] = useState('GreenBox-2F')
  const [copies, setCopies] = useState(1)
  const [econo, setEcono] = useState(false)
  const [picker, setPicker] = useState(false)
  const [testSent, setTestSent] = useState(false)

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* 裝置 + 連線狀態 */}
      <Card title="印表機">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-bold text-ink">{PRINTER_NAME}</div>
            <div className="mt-0.5 text-base text-ink2">{PRINTER_TYPE}</div>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-base font-bold ${
              printerConnected ? 'bg-brand/10 text-brand' : 'bg-danger/10 text-danger'
            }`}
          >
            <span
              className="inline-block rounded-full"
              style={{ width: 10, height: 10, background: printerConnected ? '#1F6E43' : '#C0392B' }}
            />
            {printerConnected ? '已連線' : '未連線'}
          </span>
        </div>
      </Card>

      {/* 連線設定 */}
      <Card title="連線方式">
        <div className="flex gap-2">
          {CONN_METHODS.map((m) => {
            const active = conn === m
            return (
              <button
                key={m}
                onClick={() => setConn(m)}
                className={`flex-1 rounded border-2 text-base font-bold ${
                  active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'
                }`}
                style={{ minHeight: 52 }}
              >
                {m}
              </button>
            )
          })}
        </div>

        {/* 依連線方式顯示對應設定 */}
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          {conn === 'Wi-Fi' && (
            <>
              <Row label="無線網路">
                <button
                  onClick={() => setPicker(true)}
                  className="flex items-center gap-2 rounded border-2 border-line bg-white px-3 text-lg font-medium text-ink"
                  style={{ minHeight: 44 }}
                >
                  {ssid}
                  <span className="text-ink2">▾</span>
                </button>
              </Row>
              <Row label="IP 位址">
                <span className="text-lg font-bold text-ink">192.168.0.42</span>
              </Row>
            </>
          )}
          {conn === 'Wi-Fi Direct' && (
            <>
              <Row label="直連名稱">
                <span className="text-lg font-bold text-ink">DIRECT-M111w</span>
              </Row>
              <Row label="連線密碼">
                <span className="text-lg font-bold text-ink">1234 5678</span>
              </Row>
              <p className="pt-1 text-base text-ink2">請用平板的 Wi-Fi 連到上面這台，即可免路由器直接列印。</p>
            </>
          )}
          {conn === 'USB' && (
            <p className="text-base text-ink2">請用 USB 線連接平板與印表機，系統會自動偵測。</p>
          )}

          <div className="flex items-center justify-between gap-4 pt-2" style={{ minHeight: 44 }}>
            <span className="text-lg text-ink">連線狀態</span>
            <BigButton
              size="md"
              variant={printerConnected ? 'danger' : 'primary'}
              onClick={() => setPrinterConnected(!printerConnected)}
            >
              {printerConnected ? '中斷連線' : '重新連線'}
            </BigButton>
          </div>
        </div>
      </Card>

      {/* 列印設定 */}
      <Card title="列印設定">
        <div className="space-y-1">
          <Row label="紙張大小">
            <span className="text-lg font-bold text-ink">A4</span>
          </Row>
          <Row label="份數">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCopies((n) => Math.max(1, n - 1))}
                disabled={copies <= 1}
                className="rounded border-2 border-line bg-white text-2xl font-bold text-ink disabled:opacity-40"
                style={{ width: 44, height: 44 }}
                aria-label="減少份數"
              >
                −
              </button>
              <span className="w-8 text-center text-xl font-bold text-ink">{copies}</span>
              <button
                onClick={() => setCopies((n) => Math.min(9, n + 1))}
                className="rounded border-2 border-line bg-white text-2xl font-bold text-ink"
                style={{ width: 44, height: 44 }}
                aria-label="增加份數"
              >
                ＋
              </button>
            </div>
          </Row>
          <Row label="省碳模式（EconoMode）">
            <Toggle on={econo} onToggle={() => setEcono((v) => !v)} />
          </Row>
          {econo && <p className="text-base text-ink2">省碳模式較省碳粉，但字會較淡。</p>}
        </div>
      </Card>

      <BigButton className="w-full" disabled={!printerConnected} onClick={() => setTestSent(true)}>
        測試列印
      </BigButton>

      {picker && (
        <Picker
          title="選擇無線網路"
          options={WIFI_NETWORKS.map((n) => ({ label: n, value: n }))}
          value={ssid}
          onSelect={setSsid}
          onClose={() => setPicker(false)}
        />
      )}
      {testSent && (
        <ConfirmDialog
          title="測試列印"
          message={`已送出測試頁（${conn}、${copies} 份${econo ? '、省碳模式' : ''}），請至印表機確認。`}
          confirmText="我知道了"
          cancelText="關閉"
          onConfirm={() => setTestSent(false)}
          onCancel={() => setTestSent(false)}
        />
      )}
    </div>
  )
}
