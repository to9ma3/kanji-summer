/**
 * localStorage への読み書きを一元管理するモジュール。
 *
 * コンポーネントから直接 localStorage を触らせず、必ずここを経由させることで、
 * - 保存データのスキーマバージョン管理
 * - 壊れたデータからの復旧（アプリ全体を落とさない）
 * - 将来のデータ移行
 * を一箇所にまとめる。
 */

import { KANJI_LIST } from '../data/kanji'
import type {
  AchievementState,
  AppSettings,
  DailyHistory,
  ProgressMap,
  StorageState,
} from '../types'

export const STORAGE_KEY = 'kanji-summer:v1'
export const CURRENT_SCHEMA_VERSION = 1

function defaultSummerRange(): { summerStart: string; summerEnd: string } {
  const year = new Date().getFullYear()
  return {
    summerStart: `${year}-07-20`,
    summerEnd: `${year}-08-31`,
  }
}

export function createDefaultSettings(): AppSettings {
  const { summerStart, summerEnd } = defaultSummerRange()
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    nickname: '',
    dailyQuestionCount: 5,
    soundEnabled: false,
    reduceMotion: false,
    enabledKanjiIds: KANJI_LIST.map((k) => k.id),
    summerStart,
    summerEnd,
    includeHandwritingInRegularQuiz: false,
    parentPin: null,
    hasCompletedSetup: false,
    hasSeenInstallGuide: false,
    dailyGoal: 5,
  }
}

export function createDefaultState(): StorageState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: createDefaultSettings(),
    progress: {},
    dailyHistory: {},
    achievements: [],
    totalStars: 0,
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidSettings(value: unknown): value is AppSettings {
  if (!isPlainObject(value)) return false
  return (
    typeof value.nickname === 'string' &&
    (value.dailyQuestionCount === 5 ||
      value.dailyQuestionCount === 10 ||
      value.dailyQuestionCount === 20) &&
    typeof value.soundEnabled === 'boolean' &&
    typeof value.reduceMotion === 'boolean' &&
    Array.isArray(value.enabledKanjiIds) &&
    typeof value.summerStart === 'string' &&
    typeof value.summerEnd === 'string' &&
    typeof value.includeHandwritingInRegularQuiz === 'boolean' &&
    (value.parentPin === null || typeof value.parentPin === 'string') &&
    typeof value.hasCompletedSetup === 'boolean' &&
    typeof value.hasSeenInstallGuide === 'boolean' &&
    typeof value.dailyGoal === 'number'
  )
}

function isValidProgressMap(value: unknown): value is ProgressMap {
  if (!isPlainObject(value)) return false
  return Object.values(value).every((entry) => {
    if (!isPlainObject(entry)) return false
    return (
      typeof entry.kanjiId === 'string' &&
      typeof entry.attempts === 'number' &&
      typeof entry.correct === 'number' &&
      typeof entry.incorrect === 'number' &&
      typeof entry.masteryLevel === 'number'
    )
  })
}

function isValidDailyHistory(value: unknown): value is DailyHistory {
  if (!isPlainObject(value)) return false
  return Object.values(value).every((entry) => {
    if (!isPlainObject(entry)) return false
    return (
      typeof entry.date === 'string' &&
      typeof entry.attempts === 'number' &&
      typeof entry.correct === 'number' &&
      Array.isArray(entry.kanjiIds)
    )
  })
}

function isValidAchievements(value: unknown): value is AchievementState[] {
  if (!Array.isArray(value)) return false
  return value.every((entry) => isPlainObject(entry) && typeof entry.id === 'string')
}

/** 保存データが最低限の構造を満たしているかを検証する。壊れていれば false。 */
export function isValidStorageState(value: unknown): value is StorageState {
  if (!isPlainObject(value)) return false
  return (
    typeof value.schemaVersion === 'number' &&
    isValidSettings(value.settings) &&
    isValidProgressMap(value.progress) &&
    isValidDailyHistory(value.dailyHistory) &&
    isValidAchievements(value.achievements) &&
    typeof value.totalStars === 'number'
  )
}

/**
 * 読み込んだ生データを現在のスキーマバージョンへ移行する。
 * v1 は最初のバージョンのため、現状は形の検証のみ。将来 v2 以降が増えたら
 * ここに `if (state.schemaVersion < 2) { ... }` のような変換を追加していく。
 */
function migrate(raw: Record<string, unknown>): StorageState | null {
  const candidate: Record<string, unknown> = { ...raw, schemaVersion: CURRENT_SCHEMA_VERSION }

  // 未来のバージョンで保存されたデータは安全側に倒してデフォルトへフォールバックする
  if (typeof raw.schemaVersion === 'number' && raw.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return null
  }

  // 欠けているフィールドはデフォルト値で補う（部分的な破損からの復旧）
  const defaults = createDefaultState()
  const settings = isValidSettings(raw.settings)
    ? { ...defaults.settings, ...raw.settings }
    : defaults.settings
  candidate.settings = settings
  candidate.progress = isValidProgressMap(raw.progress) ? raw.progress : defaults.progress
  candidate.dailyHistory = isValidDailyHistory(raw.dailyHistory)
    ? raw.dailyHistory
    : defaults.dailyHistory
  candidate.achievements = isValidAchievements(raw.achievements)
    ? raw.achievements
    : defaults.achievements
  candidate.totalStars = typeof raw.totalStars === 'number' ? raw.totalStars : 0

  if (!isValidStorageState(candidate)) return null
  return candidate
}

/**
 * localStorage から状態を読み込む。存在しない・壊れている場合は安全にデフォルト状態を返す
 * （例外を投げてアプリ全体を落とすことはしない）。
 */
export function loadState(): StorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed: unknown = JSON.parse(raw)
    if (!isPlainObject(parsed)) return createDefaultState()
    const migrated = migrate(parsed)
    return migrated ?? createDefaultState()
  } catch {
    // JSON.parse 失敗や localStorage アクセス不可でもアプリを落とさない
    return createDefaultState()
  }
}

export type SaveResult = { ok: true } | { ok: false; error: string }

export function saveState(state: StorageState): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return { ok: true }
  } catch (error) {
    // 容量超過(QuotaExceededError)などでも呼び出し側がクラッシュしないようにする
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 何もできることがないため無視する
  }
}
