/**
 * 新訂單提醒:震動 + 固定專屬提示音。
 * - Android WebView 殼:優先走原生橋 window.FarmerNotify.newOrderAlert() → 殼用 SoundPool 播固定專屬音 + Vibrator 震動,
 *   不受 WebView 自動播放限制、音色全平板一致。
 * - 一般瀏覽器(dev / Playwright):fallback 用 Web Audio 合成同款「叮咚」+ navigator.vibrate。
 */

// 提醒開關偏好(localStorage;預設開)。只 gate 震動/聲音,不影響畫面提示條。
const PREF_KEY = 'fp.newOrderAlert'
export function isAlertEnabled(): boolean {
  return localStorage.getItem(PREF_KEY) !== '0'
}
export function setAlertEnabled(on: boolean): void {
  localStorage.setItem(PREF_KEY, on ? '1' : '0')
}

interface NotifyBridge {
  newOrderAlert?: () => void
}
function nativeBridge(): NotifyBridge | undefined {
  return (window as unknown as { FarmerNotify?: NotifyBridge }).FarmerNotify
}

// ── Web Audio fallback(僅一般瀏覽器用;殼有原生橋就不會走到這) ──
let audioCtx: AudioContext | null = null
function ensureCtx(): AudioContext | null {
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const AC = w.AudioContext ?? w.webkitAudioContext
    if (!AC) return null
    if (!audioCtx) audioCtx = new AC()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

/**
 * 首次使用者手勢(登入點按 / 任何觸控)時解鎖 AudioContext:瀏覽器自動播放政策要求先有手勢,
 * 之後推播才播得出聲。殼走原生橋不受此限,呼叫無害。掛一次即可(once)。
 */
export function initAudioUnlock(): void {
  const unlock = () => {
    ensureCtx()
  }
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

// 兩聲「叮咚」:高音→低音,sine + 柔和 envelope(與殼內建音、Artifact 試聽一致)。
function webAudioDing(): void {
  const ac = ensureCtx()
  if (!ac) return
  const tone = (freq: number, start: number, dur: number) => {
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    o.connect(g)
    g.connect(ac.destination)
    const t = ac.currentTime + start
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.start(t)
    o.stop(t + dur + 0.02)
  }
  tone(988, 0, 0.42) // 叮 B5
  tone(740, 0.16, 0.55) // 咚 F#5
}

/** 觸發一次新訂單提醒(震動 + 提示音)。殼原生橋優先,否則 Web Audio + navigator.vibrate。 */
export function fireNewOrderAlert(): void {
  const b = nativeBridge()
  if (b?.newOrderAlert) {
    b.newOrderAlert() // 殼:音 + 震一次搞定
    return
  }
  webAudioDing()
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    /* 不支援 Vibration API 略過 */
  }
}
