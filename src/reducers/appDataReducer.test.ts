import { describe, expect, it } from 'vitest'
import { createDefaultState } from '../services/storage'
import { appDataReducer } from './appDataReducer'

describe('appDataReducer', () => {
  it('updates settings partially without touching other slices', () => {
    const state = createDefaultState()
    const next = appDataReducer(state, { type: 'settings/update', payload: { nickname: 'みお' } })
    expect(next.settings.nickname).toBe('みお')
    expect(next.settings.dailyQuestionCount).toBe(state.settings.dailyQuestionCount)
    expect(next.progress).toBe(state.progress)
  })

  it('commits a session result into progress/dailyHistory/totalStars/achievements', () => {
    const state = createDefaultState()
    const next = appDataReducer(state, {
      type: 'session/commit',
      payload: {
        progress: {
          k1: {
            kanjiId: 'k1',
            attempts: 1,
            correct: 1,
            incorrect: 0,
            hintCorrect: 0,
            streak: 1,
            masteryLevel: 1,
          },
        },
        dailyHistory: {},
        totalStars: 12,
        achievements: [{ id: 'first-step', unlockedAt: '2024-07-20T00:00:00.000Z' }],
      },
    })
    expect(next.progress.k1?.masteryLevel).toBe(1)
    expect(next.totalStars).toBe(12)
    expect(next.achievements).toHaveLength(1)
  })

  it('resets only history-related slices, keeping settings intact', () => {
    const state = createDefaultState()
    state.settings.nickname = 'けん'
    state.totalStars = 50
    const next = appDataReducer(state, { type: 'data/resetHistoryOnly' })
    expect(next.settings.nickname).toBe('けん')
    expect(next.totalStars).toBe(0)
    expect(next.progress).toEqual({})
  })

  it('resets everything to the default state', () => {
    const state = createDefaultState()
    state.settings.nickname = 'けん'
    const next = appDataReducer(state, { type: 'data/resetAll' })
    expect(next.settings.nickname).toBe('')
  })
})
