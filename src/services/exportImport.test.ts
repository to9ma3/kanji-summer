import { describe, expect, it } from 'vitest'
import { createDefaultState } from './storage'
import {
  applyImportToState,
  buildExportData,
  parseImportData,
  serializeExportData,
} from './exportImport'

describe('exportImport service', () => {
  it('builds export data containing all required fields', () => {
    const state = createDefaultState()
    const data = buildExportData(state, '2024-07-20T00:00:00.000Z')
    expect(data.schemaVersion).toBeDefined()
    expect(data.exportedAt).toBe('2024-07-20T00:00:00.000Z')
    expect(data.settings).toBeDefined()
    expect(data.progress).toBeDefined()
    expect(data.dailyHistory).toBeDefined()
    expect(data.achievements).toBeDefined()
    expect(typeof data.totalStars).toBe('number')
  })

  it('round-trips through serialize -> parse successfully', () => {
    const state = createDefaultState()
    state.settings.nickname = 'ゆうき'
    state.totalStars = 10
    const exported = buildExportData(state, '2024-07-20T00:00:00.000Z')
    const json = serializeExportData(exported)

    const result = parseImportData(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.nickname).toBe('ゆうき')
      expect(result.data.totalStars).toBe(10)
    }
  })

  it('rejects invalid JSON text', () => {
    const result = parseImportData('{ not valid json ')
    expect(result.ok).toBe(false)
  })

  it('rejects JSON that is not an object', () => {
    const result = parseImportData(JSON.stringify([1, 2, 3]))
    expect(result.ok).toBe(false)
  })

  it('rejects an object missing exportedAt', () => {
    const result = parseImportData(JSON.stringify({ settings: {} }))
    expect(result.ok).toBe(false)
  })

  it('rejects an object with structurally invalid settings', () => {
    const result = parseImportData(
      JSON.stringify({ exportedAt: '2024-07-20T00:00:00.000Z', settings: { nickname: 123 } }),
    )
    expect(result.ok).toBe(false)
  })

  it('applyImportToState replaces progress/history/achievements/stars', () => {
    const current = createDefaultState()
    const exported = buildExportData(createDefaultState(), '2024-07-20T00:00:00.000Z')
    exported.totalStars = 99
    const next = applyImportToState(current, exported)
    expect(next.totalStars).toBe(99)
  })
})
