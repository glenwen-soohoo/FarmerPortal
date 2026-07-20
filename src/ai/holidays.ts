// 國定假日表：來源 gb-order-api（GET /api/holiday/{year}），與正式環境 HolidayCalendarHelp 同源。
// ⚠️ 本地瀏覽器直打 Azure 會被 CORS 擋 → 走 Vite dev proxy（vite.config server.proxy）打同源 /api/holiday/{year}。
//    正式環境的 AI 判定在後端跑、server-to-server 呼叫、無 CORS，不需要 proxy。
// 實測（2026）：API 回傳 120 筆 = 104 個六日（remark 空）+ 16 個國定假日（有名稱）。此處只留「國定假日」餵 AI，
// 六日不逐筆列（prompt 已知週日不出貨、量也大）。

export interface NationalHoliday {
  date: string // MM/DD
  name: string
}
export interface HolidayData {
  year: number
  nationalHolidays: NationalHoliday[] // 非六日的國定假日（有名稱）
  total: number // API 總筆數（含六日）
  weekendCount: number // 其中六日筆數
}

interface RawHoliday {
  datetime: string
  remark?: string
}

export async function fetchHolidays(year: number): Promise<HolidayData> {
  const res = await fetch(`/api/holiday/${year}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as { success?: boolean; data?: RawHoliday[] }
  if (!json.success || !Array.isArray(json.data)) throw new Error('回傳格式非預期（缺 success / data）')

  const nationalHolidays: NationalHoliday[] = []
  let weekendCount = 0
  for (const it of json.data) {
    const s = it.datetime // "2026-02-16T00:00:00"
    const y = Number(s.slice(0, 4))
    const m = Number(s.slice(5, 7))
    const d = Number(s.slice(8, 10))
    const dow = new Date(y, m - 1, d).getDay() // 0=日, 6=六
    if (dow === 0 || dow === 6) {
      weekendCount++
      continue
    }
    nationalHolidays.push({ date: `${s.slice(5, 7)}/${s.slice(8, 10)}`, name: it.remark?.trim() || '(未命名)' })
  }
  return { year, nationalHolidays, total: json.data.length, weekendCount }
}

// 把國定假日整理成餵給 AI 的文字區塊（附在母單 JSON 後）
export function holidayPromptBlock(h: HolidayData): string {
  const lines = h.nationalHolidays.map((x) => `- ${x.date} ${x.name}`).join('\n')
  return (
    `【本年度（${h.year}）國定假日對照】（供你把「節慶／連假」換算成實際日期；此清單已排除一般六日週末，六日一律視為非工作日）\n` +
    lines
  )
}
