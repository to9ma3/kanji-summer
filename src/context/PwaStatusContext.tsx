/**
 * オフライン状態と「新しいバージョンが利用可能」の通知を扱うコンテキスト。
 * Service Worker の登録・更新検知には vite-plugin-pwa の React 用フックを使う。
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

type PwaStatusContextValue = {
  isOnline: boolean
  needRefresh: boolean
  offlineReady: boolean
  updateApp: () => Promise<void>
  dismissOfflineReady: () => void
}

const PwaStatusContext = createContext<PwaStatusContextValue | null>(null)

export function PwaStatusProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  })

  const value = useMemo<PwaStatusContextValue>(
    () => ({
      isOnline,
      needRefresh,
      offlineReady,
      updateApp: () => updateServiceWorker(true),
      dismissOfflineReady: () => {
        setOfflineReady(false)
        setNeedRefresh(false)
      },
    }),
    [isOnline, needRefresh, offlineReady, updateServiceWorker, setOfflineReady, setNeedRefresh],
  )

  return <PwaStatusContext.Provider value={value}>{children}</PwaStatusContext.Provider>
}

export function usePwaStatus(): PwaStatusContextValue {
  const ctx = useContext(PwaStatusContext)
  if (!ctx) throw new Error('usePwaStatus must be used within a PwaStatusProvider')
  return ctx
}
