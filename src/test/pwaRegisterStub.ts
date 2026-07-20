/**
 * テスト実行時に `virtual:pwa-register/react` の代わりに使うスタブ。
 * vite-plugin-pwa が生成する仮想モジュールは production ビルド時のみ意味を持つため、
 * Vitest 実行時はここで無害な実装に差し替える（vite.config.ts の test.alias 参照）。
 */
import { useState } from 'react'

export function useRegisterSW(): {
  needRefresh: [boolean, (value: boolean) => void]
  offlineReady: [boolean, (value: boolean) => void]
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
} {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  return {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker: async () => {},
  }
}
