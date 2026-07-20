import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { AppSettings, StorageState } from '../types'
import { loadState, saveState } from '../services/storage'
import { appDataReducer, type AppDataAction } from '../reducers/appDataReducer'

type AppDataContextValue = {
  state: StorageState
  dispatch: React.Dispatch<AppDataAction>
  updateSettings: (patch: Partial<AppSettings>) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

function init(): StorageState {
  return loadState()
}

export function AppDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(appDataReducer, undefined, init)

  useEffect(() => {
    saveState(state)
  }, [state])

  const updateSettings = useMemo(
    () => (patch: Partial<AppSettings>) => dispatch({ type: 'settings/update', payload: patch }),
    [],
  )

  const value = useMemo<AppDataContextValue>(
    () => ({ state, dispatch, updateSettings }),
    [state, updateSettings],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider')
  return ctx
}
