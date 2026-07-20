import { beforeEach, describe, expect, it } from 'vitest'
import {
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  createDefaultState,
  isValidStorageState,
  loadState,
  saveState,
} from './storage'

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the default state when nothing has been saved yet', () => {
    const state = loadState()
    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(state.settings.hasCompletedSetup).toBe(false)
    expect(state.settings.enabledKanjiIds).toHaveLength(95)
  })

  it('writes and reads back state (round-trip)', () => {
    const state = createDefaultState()
    state.settings.nickname = 'たろう'
    state.totalStars = 42
    saveState(state)

    const loaded = loadState()
    expect(loaded.settings.nickname).toBe('たろう')
    expect(loaded.totalStars).toBe(42)
  })

  it('recovers safely from corrupted (non-JSON) data instead of crashing', () => {
    localStorage.setItem(STORAGE_KEY, '{ this is not valid json')
    const state = loadState()
    expect(state).toEqual(createDefaultState())
  })

  it('recovers safely from structurally invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }))
    const state = loadState()
    expect(isValidStorageState(state)).toBe(true)
  })

  it('recovers safely from a JSON array (wrong top-level shape)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 2, 3]))
    const state = loadState()
    expect(state).toEqual(createDefaultState())
  })

  it('migrates data missing newer fields by filling in defaults', () => {
    const legacyLike = {
      schemaVersion: 1,
      settings: {
        nickname: 'はなこ',
        dailyQuestionCount: 10,
        soundEnabled: true,
        reduceMotion: false,
        enabledKanjiIds: ['poem'],
        summerStart: '2024-07-20',
        summerEnd: '2024-08-31',
        includeHandwritingInRegularQuiz: false,
        parentPin: null,
        hasCompletedSetup: true,
        hasSeenInstallGuide: true,
        dailyGoal: 10,
      },
      progress: {},
      dailyHistory: {},
      achievements: [],
      totalStars: 5,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyLike))
    const state = loadState()
    expect(state.settings.nickname).toBe('はなこ')
    expect(state.settings.dailyQuestionCount).toBe(10)
  })

  it('falls back to defaults when schemaVersion is from an unknown future version', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...createDefaultState(), schemaVersion: 999 }),
    )
    const state = loadState()
    expect(state).toEqual(createDefaultState())
  })

  it('isValidStorageState rejects obviously malformed data', () => {
    expect(isValidStorageState(null)).toBe(false)
    expect(isValidStorageState('a string')).toBe(false)
    expect(isValidStorageState({})).toBe(false)
  })
})
