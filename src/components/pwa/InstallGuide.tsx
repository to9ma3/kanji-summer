import { useState } from 'react'
import { useAppData } from '../../context/AppDataContext'

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  const matchesDisplayMode = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  return matchesDisplayMode || nav.standalone === true
}

/** iOS Safari で、まだホーム画面に追加していない場合だけ表示する案内。 */
export function InstallGuide(): React.JSX.Element | null {
  const { updateSettings } = useAppData()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || isStandaloneDisplay() || !isIosDevice()) return null

  return (
    <section className="card stack" aria-labelledby="install-guide-heading">
      <h2 id="install-guide-heading">📲 ホーム画面に追加しよう</h2>
      <p>ホーム画面に追加すると、アプリのようにすぐ開けるようになるよ。</p>
      <ol className="stack" style={{ paddingLeft: 20, margin: 0 }}>
        <li>Safari下の共有ボタン（□に↑）を押す</li>
        <li>「ホーム画面に追加」を選ぶ</li>
        <li>「追加」を押す</li>
      </ol>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          setDismissed(true)
          updateSettings({ hasSeenInstallGuide: true })
        }}
      >
        わかった
      </button>
    </section>
  )
}

export default InstallGuide
