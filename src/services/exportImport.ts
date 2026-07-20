/**
 * 学習データの JSON エクスポート・インポートを扱うモジュール。
 *
 * インポートされた JSON は必ず検証してから取り込み、不正な形式は拒否する
 * （ユーザー入力を無検証で信用しない）。
 */

import type { ExportData, StorageState } from '../types'
import { CURRENT_SCHEMA_VERSION, isValidStorageState } from './storage'

export function buildExportData(state: StorageState, exportedAt: string): ExportData {
  return {
    schemaVersion: state.schemaVersion,
    exportedAt,
    settings: state.settings,
    progress: state.progress,
    dailyHistory: state.dailyHistory,
    achievements: state.achievements,
    totalStars: state.totalStars,
  }
}

export function serializeExportData(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

export type ImportResult = { ok: true; data: ExportData } | { ok: false; error: string }

/** インポートしようとしている JSON 文字列を検証する。不正な形式は理由付きで拒否する。 */
export function parseImportData(jsonText: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return {
      ok: false,
      error: 'JSONとして読み取れませんでした。ファイルの中身を確認してください。',
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'データの形式が正しくありません。' }
  }

  const record = parsed as Record<string, unknown>
  if (typeof record.exportedAt !== 'string') {
    return { ok: false, error: 'エクスポート日時(exportedAt)が見つかりません。' }
  }

  // ExportData は StorageState と同じ中核フィールドを持つため、共通の検証関数を使う
  const candidate = { ...record, schemaVersion: record.schemaVersion ?? CURRENT_SCHEMA_VERSION }
  if (!isValidStorageState(candidate)) {
    return { ok: false, error: '学習データの内容が正しくありません。壊れている可能性があります。' }
  }

  return {
    ok: true,
    data: {
      schemaVersion: candidate.schemaVersion,
      exportedAt: record.exportedAt,
      settings: candidate.settings,
      progress: candidate.progress,
      dailyHistory: candidate.dailyHistory,
      achievements: candidate.achievements,
      totalStars: candidate.totalStars,
    },
  }
}

export function applyImportToState(current: StorageState, imported: ExportData): StorageState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: { ...current.settings, ...imported.settings, schemaVersion: CURRENT_SCHEMA_VERSION },
    progress: imported.progress,
    dailyHistory: imported.dailyHistory,
    achievements: imported.achievements,
    totalStars: imported.totalStars,
  }
}

/** ブラウザでファイルとしてダウンロードさせる（テスト環境では呼ばれない副作用関数）。 */
export function triggerJsonDownload(filename: string, jsonText: string): void {
  const blob = new Blob([jsonText], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
