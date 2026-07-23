import type { AiConfig, CallResult, JudgeResponse, Provider } from './types'

// ── Provider 可插拔呼叫層（F3 §3-1）──────────────────────────────
// 全部用原生 fetch、直接從瀏覽器打 → 本地即可測、無需自架後端。
// 對外統一：輸入 system + user 文字 → 輸出 { 原始文字, 解析後 JSON, 用量, 送出的 body }。
// ⚠️ 金鑰只從頁面輸入、存本機 localStorage，除了打對應 AI 服務不外傳；requestBody 內不含金鑰。

export const PROVIDER_LABEL: Record<Provider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
}

// 各家預設模型（皆可在頁面上改）：優先免費／低成本，對齊 F3「量大、壓成本」
export const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: 'gemini-flash-latest', // 別名，自動指向當前 flash（2.0-flash 已退役、2.5-flash 對新帳號封鎖）
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
}

// 從回覆文字抽出 JSON：容忍 ```json fences 與前後贅字，取第一個 {...} 平衡括號區塊。
function extractJson(text: string): { parsed?: JudgeResponse; parseError?: string } {
  const stripped = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  // 先直接試
  try {
    return { parsed: JSON.parse(stripped) as JudgeResponse }
  } catch {
    /* fall through */
  }
  // 再取第一個平衡的大括號區塊
  const start = stripped.indexOf('{')
  if (start >= 0) {
    let depth = 0
    for (let i = start; i < stripped.length; i++) {
      if (stripped[i] === '{') depth++
      else if (stripped[i] === '}') {
        depth--
        if (depth === 0) {
          const slice = stripped.slice(start, i + 1)
          try {
            return { parsed: JSON.parse(slice) as JudgeResponse }
          } catch (e) {
            return { parseError: `JSON 解析失敗：${(e as Error).message}` }
          }
        }
      }
    }
  }
  return { parseError: '回覆中找不到有效的 JSON 物件' }
}

interface RawCall {
  text: string
  usage?: string
  body: unknown
}

// 把 provider 的 HTTP 錯誤攤平成可讀訊息（含 status / details，Gemini 的 fieldViolations 會指出哪個欄位錯），
// 並夾帶「實際送出的 body」到 error 上，失敗時也能在結果頁核對送了什麼。
function apiError(
  data: { error?: { message?: string; status?: string; details?: unknown } },
  status: number,
  body: unknown
): Error & { requestBody?: string } {
  const g = data?.error
  const msg =
    (g?.message || `HTTP ${status}`) +
    (g?.status ? ` [${g.status}]` : '') +
    (g?.details ? '\ndetails: ' + JSON.stringify(g.details) : '')
  const err = new Error(msg) as Error & { requestBody?: string }
  err.requestBody = JSON.stringify(body, null, 2)
  return err
}

async function callGemini(cfg: AiConfig, system: string, user: string): Promise<RawCall> {
  const model = cfg.models.gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  // maxOutputTokens 拉高：防 JSON 被截斷。thinkingConfig 另外處理（見下）。
  const baseGen: Record<string, unknown> = {
    temperature: cfg.temperature,
    responseMimeType: 'application/json',
    maxOutputTokens: 8192,
  }
  const buildBody = (gen: Record<string, unknown>) => ({
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: gen,
  })
  const post = async (gen: Record<string, unknown>) => {
    const body = buildBody(gen)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKeys.gemini },
      body: JSON.stringify(body),
    })
    return { res, data: await res.json(), body }
  }

  // 支援思考的 flash（2.5/3）預設會「思考」、思考 token 會吃掉輸出額度導致 JSON 被截斷 → 帶 thinkingConfig 關掉。
  // 但不支援思考的 flash 版本會因這個欄位整包回 400 INVALID_ARGUMENT → 自動退回不帶 thinkingConfig 再打一次。
  let { res, data, body } = await post({ ...baseGen, thinkingConfig: { thinkingBudget: 0 } })
  if (res.status === 400) {
    ;({ res, data, body } = await post(baseGen))
  }
  if (!res.ok) throw apiError(data, res.status, body)

  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  const u = data?.usageMetadata
  const usage = u ? `prompt ${u.promptTokenCount ?? '?'} / output ${u.candidatesTokenCount ?? '?'} tokens` : undefined
  return { text, usage, body }
}

async function callOpenAI(cfg: AiConfig, system: string, user: string): Promise<RawCall> {
  const model = cfg.models.openai
  const body = {
    model,
    temperature: cfg.temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKeys.openai}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw apiError(data, res.status, body)
  const text: string = data?.choices?.[0]?.message?.content ?? ''
  const u = data?.usage
  const usage = u ? `prompt ${u.prompt_tokens} / output ${u.completion_tokens} tokens` : undefined
  return { text, usage, body }
}

async function callAnthropic(cfg: AiConfig, system: string, user: string): Promise<RawCall> {
  const model = cfg.models.anthropic
  const body = {
    model,
    max_tokens: 2048,
    temperature: cfg.temperature,
    system,
    messages: [{ role: 'user', content: user }],
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKeys.anthropic,
      'anthropic-version': '2023-06-01',
      // 允許瀏覽器直連（本地測試用）
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw apiError(data, res.status, body)
  const text: string =
    data?.content?.map((c: { text?: string }) => c.text ?? '').join('') ?? ''
  const u = data?.usage
  const usage = u ? `input ${u.input_tokens} / output ${u.output_tokens} tokens` : undefined
  return { text, usage, body }
}

const CALLERS: Record<Provider, (c: AiConfig, s: string, u: string) => Promise<RawCall>> = {
  gemini: callGemini,
  openai: callOpenAI,
  anthropic: callAnthropic,
}

export async function callAI(cfg: AiConfig, system: string, user: string): Promise<CallResult> {
  const provider = cfg.provider
  const model = cfg.models[provider]
  const t0 = performance.now()
  try {
    const raw = await CALLERS[provider](cfg, system, user)
    const ms = Math.round(performance.now() - t0)
    const { parsed, parseError } = extractJson(raw.text)
    return {
      ok: true,
      provider,
      model,
      ms,
      rawText: raw.text,
      parsed,
      parseError,
      usage: raw.usage,
      requestBody: JSON.stringify(raw.body, null, 2),
    }
  } catch (e) {
    const ms = Math.round(performance.now() - t0)
    const err = e as Error & { requestBody?: string }
    return {
      ok: false,
      provider,
      model,
      ms,
      rawText: '',
      error: err.message,
      requestBody: err.requestBody ?? '',
    }
  }
}
