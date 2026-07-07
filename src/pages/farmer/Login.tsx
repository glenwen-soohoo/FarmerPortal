import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BigButton from '../../components/BigButton'

export default function Login() {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const navigate = useNavigate()

  const submit = () => {
    if (!account.trim() || !password.trim()) {
      setErr('帳號或密碼錯誤')
      return
    }
    navigate('/farmer/shippable')
  }

  return (
    <div className="farmer-scope flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md rounded-card bg-white p-8">
        <div className="text-center text-3xl font-bold text-brand">農友出貨平台</div>
        <p className="mb-8 mt-2 text-center text-base text-ink2">請輸入貓咪提供的手機帳號與密碼</p>

        <label className="block text-lg text-ink">
          手機帳號
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="mt-2 w-full rounded border border-line px-4 text-2xl"
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
            className="mt-2 w-full rounded border border-line px-4 text-2xl"
            style={{ minHeight: 64 }}
            placeholder="請輸入密碼"
          />
        </label>

        {err && <p className="mt-3 text-base text-danger">{err}</p>}

        <BigButton className="mt-6 w-full" onClick={submit}>
          登入
        </BigButton>
      </div>
    </div>
  )
}
