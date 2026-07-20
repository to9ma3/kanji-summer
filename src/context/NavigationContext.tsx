/**
 * React Router を使わず、アプリ内 state で画面遷移を管理する（GitHub Pages の
 * SPA 404 問題を避けるため）。スタック構造にして「戻る」を自然に扱えるようにしている。
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type ScreenName =
  | 'setup'
  | 'home'
  | 'courseSelect'
  | 'quiz'
  | 'result'
  | 'handwriting'
  | 'kanjiList'
  | 'kanjiDetail'
  | 'progress'
  | 'calendar'
  | 'achievements'
  | 'parent'
  | 'dataManagement'

export type ScreenParams = Record<string, string | undefined>

export type ScreenEntry = { screen: ScreenName; params: ScreenParams }

type NavigationContextValue = {
  current: ScreenEntry
  stack: ScreenEntry[]
  navigate: (screen: ScreenName, params?: ScreenParams) => void
  replace: (screen: ScreenName, params?: ScreenParams) => void
  back: () => void
  canGoBack: boolean
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({
  initialScreen,
  children,
}: {
  initialScreen: ScreenName
  children: ReactNode
}): React.JSX.Element {
  const [stack, setStack] = useState<ScreenEntry[]>([{ screen: initialScreen, params: {} }])

  const navigate = useCallback((screen: ScreenName, params: ScreenParams = {}) => {
    setStack((prev) => [...prev, { screen, params }])
    window.scrollTo(0, 0)
  }, [])

  const replace = useCallback((screen: ScreenName, params: ScreenParams = {}) => {
    setStack((prev) => [...prev.slice(0, -1), { screen, params }])
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
    window.scrollTo(0, 0)
  }, [])

  const value = useMemo<NavigationContextValue>(() => {
    const current = stack[stack.length - 1] ?? { screen: initialScreen, params: {} }
    return { current, stack, navigate, replace, back, canGoBack: stack.length > 1 }
  }, [stack, initialScreen, navigate, replace, back])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within a NavigationProvider')
  return ctx
}
