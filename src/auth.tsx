import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { seedFarmers } from './mocks/farmers'

/**
 * 【DEMO 專屬】mock 認證層。
 *
 * 正式版 auth.tsx 走後端 /api/auth/login 取 JWT、存 localStorage。本 demo 沒有後端：
 * - 預設即為已登入（token 為非 null 常數），deep-link 直接進 /farmer/* 不被擋。
 * - login() 接受任何輸入、立即 resolve；logout() 清 token → 路由守門把畫面帶回登入頁。
 * - farmer 由「目前 mock 農友」（currentFarmerId 對應 seedFarmers）即時衍生成 AuthFarmer 形狀。
 * - 另外對外露出 currentFarmerId / setCurrentFarmerId 供 store 讀取與（開發面板）切換農友；
 *   工程師版農友端只解構 { token, farmer, login, logout }，多出來的欄位不影響其編譯。
 */

export interface AuthFarmer {
  id: number
  name: string
  mobile: string
  canSelfPrint: boolean
  earlyShipAllowed: boolean
}

interface Auth {
  token: string | null
  farmer: AuthFarmer | null
  login: (mobile: string, password: string) => Promise<void>
  logout: () => void
  // demo 擴充：目前登入農友切換（store 與 DevPanel 用）
  currentFarmerId: number
  setCurrentFarmerId: (id: number) => void
}

const DEMO_TOKEN = 'demo-token'
const DEFAULT_FARMER_ID = 6 // 冠軍文旦園（已開通）

const Ctx = createContext<Auth | null>(null)

function toAuthFarmer(id: number): AuthFarmer | null {
  const f = seedFarmers.find((x) => x.id === id)
  if (!f) return null
  return {
    id: f.id,
    name: f.farm, // AuthFarmer.name＝農園名（對齊工程師版語意）
    mobile: f.phone,
    canSelfPrint: true,
    earlyShipAllowed: f.earlyShipAllowed ?? false,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(DEMO_TOKEN)
  const [currentFarmerId, setCurrentFarmerId] = useState(DEFAULT_FARMER_ID)

  const value = useMemo<Auth>(
    () => ({
      token,
      farmer: toAuthFarmer(currentFarmerId),
      login: async () => {
        // 接受任何帳密，立即登入。
        setToken(DEMO_TOKEN)
      },
      logout: () => setToken(null),
      currentFarmerId,
      setCurrentFarmerId,
    }),
    [token, currentFarmerId]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
