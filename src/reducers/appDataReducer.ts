/**
 * 永続化される学習データ（settings / progress / dailyHistory / achievements / totalStars）の
 * 状態遷移をまとめたリデューサー。
 *
 * 「1セット分の解答結果を反映する」という重い計算は domain/progressCalculator.ts の
 * applyQuizSession が純粋関数として担当し、その結果（すでに計算済みの新しいスライス）を
 * ここでは state にそのまま反映するだけにしている。これにより、結果画面に必要な
 * 「新しくマスターした漢字」「新しく解除された実績」などの副次情報も呼び出し側で
 * 保持できる。
 */

import type {
  AchievementState,
  AppSettings,
  DailyHistory,
  ProgressMap,
  StorageState,
} from '../types'
import { createDefaultState } from '../services/storage'

export type AppDataAction =
  | { type: 'hydrate'; payload: StorageState }
  | { type: 'settings/update'; payload: Partial<AppSettings> }
  | {
      type: 'session/commit'
      payload: {
        progress: ProgressMap
        dailyHistory: DailyHistory
        totalStars: number
        achievements: AchievementState[]
      }
    }
  | { type: 'data/resetHistoryOnly' }
  | { type: 'data/resetAll' }
  | { type: 'data/import'; payload: StorageState }

export function appDataReducer(state: StorageState, action: AppDataAction): StorageState {
  switch (action.type) {
    case 'hydrate':
      return action.payload

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case 'session/commit':
      return {
        ...state,
        progress: action.payload.progress,
        dailyHistory: action.payload.dailyHistory,
        totalStars: action.payload.totalStars,
        achievements: action.payload.achievements,
      }

    case 'data/resetHistoryOnly':
      return {
        ...state,
        progress: {},
        dailyHistory: {},
        achievements: [],
        totalStars: 0,
      }

    case 'data/resetAll':
      return createDefaultState()

    case 'data/import':
      return action.payload

    default:
      return state
  }
}
