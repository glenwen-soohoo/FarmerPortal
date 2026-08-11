import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BigButton from '../../components/BigButton'
import { useAuth } from '../../auth'
import { ApiError } from '../../api/client'
import logo from '../../assets/logo-wudunong.png'

/**
 * 品牌綠平色滿版底，襯浮起白卡。
 *
 * 原本是四層漸層（135° 品牌色線性 + 左上柔光 radial + 右下壓深 radial + 右上一顆「純裝飾」大圓）。
 * 全部移除的理由有兩個，而且是同一件事的兩面：
 *  1. 語氣定調「工具檯」——這台平板是包裝台上的一件工具，一件工具的開機畫面不會有漸層打光。
 *  2. 「135° 品牌色線性漸層」是 AI 生成介面最典型的特徵之一，而去 AI 味是這輪的目標。
 *     反面參照清單上其餘九項本來就沒出現或已處理，這是最後一條。
 */

export default function Login() {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const submit = async () => {
    if (!account.trim() || !password.trim()) {
      setErr('帳號或密碼錯誤')
      return
    }
    setBusy(true)
    setErr('')
    try {
      await login(account.trim(), password)
      navigate('/farmer/shippable')
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '登入失敗，請稍後再試')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="farmer-scope relative flex min-h-dvh w-full items-center justify-center overflow-hidden p-6"
      style={{ background: 'var(--c-act)' }}
    >
      <div
        className="anim-pop relative w-full max-w-md rounded-card bg-white p-8"
        style={{ boxShadow: 'var(--l3)' }}
      >
        <img src={logo} alt="無毒農" className="mx-auto mb-3 h-auto" style={{ width: 168 }} />
        <div className="text-center text-2xl font-bold text-act">農友出貨平台</div>

        <label className="mt-8 block text-lg text-ink">
          手機帳號
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="mt-2 w-full rounded-full border border-edge px-5 text-2xl focus:border-act focus:outline-none"
            style={{ minHeight: 64 }}
            placeholder="請輸入手機號碼"
          />
        </label>

        <label className="mt-4 block text-lg text-ink">
          密碼
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="mt-2 w-full rounded-full border border-edge px-5 text-2xl focus:border-act focus:outline-none"
            style={{ minHeight: 64 }}
            placeholder="請輸入密碼"
          />
        </label>

        {err && <p className="mt-3 text-base text-urgent">{err}</p>}

        <BigButton className="mt-6 w-full" onClick={submit} disabled={busy}>
          {busy ? '登入中…' : '登入'}
        </BigButton>

        <div className="mt-6 border-t border-hairline pt-4 text-center text-sm text-ink-faint">
          無毒農 GreenBox · 出貨管理平台
        </div>
      </div>
    </div>
  )
}
