import { usePwaStatus } from '../../context/PwaStatusContext'

export function UpdateBanner(): React.JSX.Element | null {
  const { needRefresh, offlineReady, updateApp, dismissOfflineReady } = usePwaStatus()

  if (needRefresh) {
    return (
      <div className="banner banner-update" role="status" aria-live="polite">
        <span>
          <span aria-hidden="true">🔄</span> 新しいバージョンが利用できます。
        </span>
        <button type="button" className="btn btn-secondary" onClick={() => void updateApp()}>
          更新する
        </button>
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="banner banner-update" role="status" aria-live="polite">
        <span>
          <span aria-hidden="true">✅</span> オフラインでも使えるようになりました。
        </span>
        <button type="button" className="btn btn-ghost" onClick={dismissOfflineReady}>
          閉じる
        </button>
      </div>
    )
  }

  return null
}

export default UpdateBanner
