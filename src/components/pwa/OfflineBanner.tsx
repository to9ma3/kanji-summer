import { usePwaStatus } from '../../context/PwaStatusContext'

export function OfflineBanner(): React.JSX.Element | null {
  const { isOnline } = usePwaStatus()
  if (isOnline) return null
  return (
    <div className="banner banner-offline" role="status" aria-live="polite">
      <span aria-hidden="true">📶</span>
      <span>
        今はオフラインです。これまでに学習したデータは保存されているので、そのまま続けられます。
      </span>
    </div>
  )
}

export default OfflineBanner
