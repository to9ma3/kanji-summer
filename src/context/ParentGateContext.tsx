/**
 * 保護者画面のロック状態（アプリのセッション内のみ有効。リロードすると再度ロックされる）。
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type ParentGateContextValue = {
  unlocked: boolean
  unlock: () => void
  lock: () => void
}

const ParentGateContext = createContext<ParentGateContextValue | null>(null)

export function ParentGateProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [unlocked, setUnlocked] = useState(false)
  const value = useMemo<ParentGateContextValue>(
    () => ({ unlocked, unlock: () => setUnlocked(true), lock: () => setUnlocked(false) }),
    [unlocked],
  )
  return <ParentGateContext.Provider value={value}>{children}</ParentGateContext.Provider>
}

export function useParentGate(): ParentGateContextValue {
  const ctx = useContext(ParentGateContext)
  if (!ctx) throw new Error('useParentGate must be used within a ParentGateProvider')
  return ctx
}
