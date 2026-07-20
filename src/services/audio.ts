/**
 * 効果音サービス。
 *
 * 外部音源ファイルは使わず、Web Audio API で短い音をその場で生成する。
 * iOS の自動再生制限があるため、必ずユーザー操作（クリック等）のハンドラーの中から
 * 呼び出すこと。効果音は設定で明示的に ON にした場合のみ鳴らす（初期値は OFF）。
 */

type AudioContextLike = AudioContext

let sharedContext: AudioContextLike | null = null

function getAudioContext(): AudioContextLike | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!sharedContext) {
    sharedContext = new Ctor()
  }
  if (sharedContext.state === 'suspended') {
    void sharedContext.resume().catch(() => {
      /* 再開に失敗しても無視する（次のユーザー操作で再試行される） */
    })
  }
  return sharedContext
}

function playTone(frequency: number, durationMs: number, delayMs = 0, volume = 0.12): void {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    oscillator.connect(gain)
    gain.connect(ctx.destination)

    const startAt = ctx.currentTime + delayMs / 1000
    const stopAt = startAt + durationMs / 1000
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt)

    oscillator.start(startAt)
    oscillator.stop(stopAt + 0.02)
  } catch {
    // 音が鳴らせない環境でも学習の妨げにならないよう、静かに諦める
  }
}

export function playCorrectSound(enabled: boolean): void {
  if (!enabled) return
  playTone(880, 140, 0)
  playTone(1175, 160, 120)
}

export function playIncorrectSound(enabled: boolean): void {
  if (!enabled) return
  playTone(220, 220, 0, 0.09)
}

export function playCompleteSound(enabled: boolean): void {
  if (!enabled) return
  playTone(660, 120, 0)
  playTone(880, 120, 130)
  playTone(1046, 220, 260)
}
