import { describe, expect, it } from 'vitest'
import type { DailyHistory, ProgressMap } from '../types'
import { createInitialProgress } from './spacedRepetition'
import {
  applyQuizSession,
  computeCurrentStreak,
  computeTotalDaysStudied,
  evaluateAchievements,
  starsForAnswer,
  starsForSetCompletion,
} from './progressCalculator'

function makeDailyHistory(overrides: DailyHistory): DailyHistory {
  return overrides
}

describe('starsForAnswer', () => {
  it('gives 2 stars for a self-correct answer', () => {
    expect(starsForAnswer(true, false)).toBe(2)
  })
  it('gives 1 star for a hint-assisted correct answer', () => {
    expect(starsForAnswer(true, true)).toBe(1)
  })
  it('gives 0 stars for an incorrect answer', () => {
    expect(starsForAnswer(false, false)).toBe(0)
    expect(starsForAnswer(false, true)).toBe(0)
  })
})

describe('starsForSetCompletion', () => {
  it('gives a completion bonus of 3', () => {
    expect(starsForSetCompletion(5, 3)).toBe(3)
  })
  it('gives an extra 5 bonus stars for a perfect set', () => {
    expect(starsForSetCompletion(5, 5)).toBe(8)
  })
  it('gives 0 for an empty set', () => {
    expect(starsForSetCompletion(0, 0)).toBe(0)
  })
})

describe('computeCurrentStreak', () => {
  it('is 0 when there is no history', () => {
    expect(computeCurrentStreak({}, '2024-07-20')).toBe(0)
  })

  it('counts consecutive days including today', () => {
    const history = makeDailyHistory({
      '2024-07-18': {
        date: '2024-07-18',
        attempts: 5,
        correct: 5,
        starsEarned: 10,
        kanjiIds: [],
        goalMet: true,
        allCorrect: true,
      },
      '2024-07-19': {
        date: '2024-07-19',
        attempts: 5,
        correct: 4,
        starsEarned: 8,
        kanjiIds: [],
        goalMet: true,
        allCorrect: false,
      },
      '2024-07-20': {
        date: '2024-07-20',
        attempts: 5,
        correct: 5,
        starsEarned: 10,
        kanjiIds: [],
        goalMet: true,
        allCorrect: true,
      },
    })
    expect(computeCurrentStreak(history, '2024-07-20')).toBe(3)
  })

  it('keeps counting from yesterday if today has not been studied yet', () => {
    const history = makeDailyHistory({
      '2024-07-19': {
        date: '2024-07-19',
        attempts: 5,
        correct: 5,
        starsEarned: 10,
        kanjiIds: [],
        goalMet: true,
        allCorrect: true,
      },
    })
    expect(computeCurrentStreak(history, '2024-07-20')).toBe(1)
  })

  it('breaks the streak on a gap day', () => {
    const history = makeDailyHistory({
      '2024-07-17': {
        date: '2024-07-17',
        attempts: 5,
        correct: 5,
        starsEarned: 10,
        kanjiIds: [],
        goalMet: true,
        allCorrect: true,
      },
      '2024-07-19': {
        date: '2024-07-19',
        attempts: 5,
        correct: 5,
        starsEarned: 10,
        kanjiIds: [],
        goalMet: true,
        allCorrect: true,
      },
      '2024-07-20': {
        date: '2024-07-20',
        attempts: 5,
        correct: 5,
        starsEarned: 10,
        kanjiIds: [],
        goalMet: true,
        allCorrect: true,
      },
    })
    expect(computeCurrentStreak(history, '2024-07-20')).toBe(2)
  })
})

describe('computeTotalDaysStudied', () => {
  it('counts only days with at least one attempt', () => {
    const history = makeDailyHistory({
      '2024-07-19': {
        date: '2024-07-19',
        attempts: 0,
        correct: 0,
        starsEarned: 0,
        kanjiIds: [],
        goalMet: false,
        allCorrect: false,
      },
      '2024-07-20': {
        date: '2024-07-20',
        attempts: 5,
        correct: 5,
        starsEarned: 10,
        kanjiIds: [],
        goalMet: true,
        allCorrect: true,
      },
    })
    expect(computeTotalDaysStudied(history)).toBe(1)
  })
})

describe('evaluateAchievements', () => {
  it('does not report already-unlocked achievements again (no duplicate unlocking)', () => {
    const stats = {
      totalDaysStudied: 5,
      currentStreak: 5,
      totalQuestionsAnswered: 20,
      masteredCount: 0,
    }
    const unlocked = new Set<'first-step' | 'explore-5'>(['first-step'])
    const newly = evaluateAchievements(stats, unlocked)
    expect(newly).toContain('explore-5')
    expect(newly).not.toContain('first-step')
  })

  it('unlocks multiple achievements at once when thresholds are crossed together', () => {
    const stats = {
      totalDaysStudied: 10,
      currentStreak: 7,
      totalQuestionsAnswered: 100,
      masteredCount: 95,
    }
    const newly = evaluateAchievements(stats, new Set())
    expect(newly).toEqual(
      expect.arrayContaining([
        'first-step',
        'explore-5',
        'explore-10',
        'streak-7',
        'challenge-100',
        'master-95',
      ]),
    )
  })

  it('unlocks nothing when no thresholds are met', () => {
    const stats = {
      totalDaysStudied: 0,
      currentStreak: 0,
      totalQuestionsAnswered: 0,
      masteredCount: 0,
    }
    expect(evaluateAchievements(stats, new Set())).toEqual([])
  })
})

describe('applyQuizSession', () => {
  it('updates progress, dailyHistory and totalStars for a fully-correct set', () => {
    const result = applyQuizSession({
      progress: {},
      dailyHistory: {},
      totalStars: 0,
      unlockedAchievementIds: new Set(),
      answers: [
        { kanjiId: 'k1', correct: true, usedHint: false },
        { kanjiId: 'k2', correct: true, usedHint: false },
      ],
      today: '2024-07-20',
      dailyGoal: 5,
    })
    expect(result.progress.k1?.masteryLevel).toBe(1)
    expect(result.progress.k2?.masteryLevel).toBe(1)
    // 自力正解2問 = 4スター + 完了ボーナス3 + 全問正解ボーナス5 = 12
    expect(result.starsEarnedThisSession).toBe(12)
    expect(result.totalStars).toBe(12)
    expect(result.dailyHistory['2024-07-20']?.attempts).toBe(2)
    expect(result.dailyHistory['2024-07-20']?.allCorrect).toBe(true)
  })

  it('marks goalMet false when attempts are below the daily goal', () => {
    const result = applyQuizSession({
      progress: {},
      dailyHistory: {},
      totalStars: 0,
      unlockedAchievementIds: new Set(),
      answers: [{ kanjiId: 'k1', correct: true, usedHint: false }],
      today: '2024-07-20',
      dailyGoal: 5,
    })
    expect(result.dailyHistory['2024-07-20']?.goalMet).toBe(false)
  })

  it('detects newly mastered kanji', () => {
    const progress: ProgressMap = {
      k1: {
        kanjiId: 'k1',
        attempts: 3,
        correct: 3,
        incorrect: 0,
        hintCorrect: 0,
        streak: 3,
        masteryLevel: 3,
      },
    }
    const result = applyQuizSession({
      progress,
      dailyHistory: {},
      totalStars: 0,
      unlockedAchievementIds: new Set(),
      answers: [{ kanjiId: 'k1', correct: true, usedHint: false }],
      today: '2024-07-20',
      dailyGoal: 5,
    })
    expect(result.newlyMasteredKanjiIds).toEqual(['k1'])
  })

  it('unlocks the first-step achievement on the very first session', () => {
    const result = applyQuizSession({
      progress: {},
      dailyHistory: {},
      totalStars: 0,
      unlockedAchievementIds: new Set(),
      answers: [{ kanjiId: 'k1', correct: true, usedHint: false }],
      today: '2024-07-20',
      dailyGoal: 5,
    })
    expect(result.newlyUnlockedAchievementIds).toContain('first-step')
  })

  it('accumulates onto an existing dailyHistory record for the same day', () => {
    const dailyHistory: DailyHistory = {
      '2024-07-20': {
        date: '2024-07-20',
        attempts: 3,
        correct: 2,
        starsEarned: 4,
        kanjiIds: ['k9'],
        goalMet: false,
        allCorrect: false,
      },
    }
    const result = applyQuizSession({
      progress: {},
      dailyHistory,
      totalStars: 4,
      unlockedAchievementIds: new Set(),
      answers: [{ kanjiId: 'k1', correct: true, usedHint: false }],
      today: '2024-07-20',
      dailyGoal: 4,
    })
    const record = result.dailyHistory['2024-07-20']
    expect(record?.attempts).toBe(4)
    expect(record?.correct).toBe(3)
    expect(record?.kanjiIds.sort()).toEqual(['k1', 'k9'])
    expect(record?.goalMet).toBe(true)
  })
})

describe('createInitialProgress helper sanity (used by progress map tests elsewhere)', () => {
  it('creates a zeroed-out progress record', () => {
    const progress: ProgressMap = { k1: createInitialProgress('k1') }
    expect(progress.k1?.attempts).toBe(0)
    expect(progress.k1?.masteryLevel).toBe(0)
  })
})
