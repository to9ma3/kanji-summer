import { describe, expect, it } from 'vitest'
import {
  applyAnswerResult,
  clampMasteryLevel,
  computeNextReviewAt,
  createInitialProgress,
  isMastered,
  isWeak,
  REVIEW_INTERVAL_DAYS,
} from './spacedRepetition'

describe('spacedRepetition', () => {
  it('clamps mastery level to 0-5', () => {
    expect(clampMasteryLevel(-3)).toBe(0)
    expect(clampMasteryLevel(8)).toBe(5)
    expect(clampMasteryLevel(2)).toBe(2)
  })

  it('never lets masteryLevel go below 0 or above 5 after repeated updates', () => {
    let progress = createInitialProgress('k1')
    for (let i = 0; i < 20; i += 1) {
      progress = applyAnswerResult(progress, {
        correct: true,
        usedHint: false,
        today: '2024-07-20',
      })
      expect(progress.masteryLevel).toBeGreaterThanOrEqual(0)
      expect(progress.masteryLevel).toBeLessThanOrEqual(5)
    }
    for (let i = 0; i < 20; i += 1) {
      progress = applyAnswerResult(progress, {
        correct: false,
        usedHint: false,
        today: '2024-07-20',
      })
      expect(progress.masteryLevel).toBeGreaterThanOrEqual(0)
      expect(progress.masteryLevel).toBeLessThanOrEqual(5)
    }
  })

  it('computes the correct review interval for each mastery level', () => {
    expect(computeNextReviewAt(0, '2024-07-20')).toBe('2024-07-20')
    expect(computeNextReviewAt(1, '2024-07-20')).toBe('2024-07-21')
    expect(computeNextReviewAt(2, '2024-07-20')).toBe('2024-07-23')
    expect(computeNextReviewAt(3, '2024-07-20')).toBe('2024-07-27')
    expect(computeNextReviewAt(4, '2024-07-20')).toBe('2024-08-03')
    expect(computeNextReviewAt(5, '2024-07-20')).toBe('2024-08-19')
  })

  it('has review intervals defined for every mastery level 0-5', () => {
    expect(Object.keys(REVIEW_INTERVAL_DAYS)).toHaveLength(6)
  })

  it('raises masteryLevel on a self-correct answer', () => {
    const progress = createInitialProgress('k1')
    const updated = applyAnswerResult(progress, {
      correct: true,
      usedHint: false,
      today: '2024-07-20',
    })
    expect(updated.masteryLevel).toBe(1)
    expect(updated.correct).toBe(1)
    expect(updated.streak).toBe(1)
  })

  it('raises incorrect count and lowers streak/mastery on a wrong answer', () => {
    let progress = createInitialProgress('k1')
    progress = applyAnswerResult(progress, { correct: true, usedHint: false, today: '2024-07-20' })
    progress = applyAnswerResult(progress, { correct: true, usedHint: false, today: '2024-07-20' })
    expect(progress.masteryLevel).toBe(2)
    const afterWrong = applyAnswerResult(progress, {
      correct: false,
      usedHint: false,
      today: '2024-07-20',
    })
    expect(afterWrong.incorrect).toBe(1)
    expect(afterWrong.streak).toBe(0)
    expect(afterWrong.masteryLevel).toBe(0) // 2 - 2 = 0
  })

  it('updates nextReviewAt after every answer', () => {
    const progress = createInitialProgress('k1')
    const updated = applyAnswerResult(progress, {
      correct: true,
      usedHint: false,
      today: '2024-07-20',
    })
    expect(updated.nextReviewAt).toBe('2024-07-21')
  })

  it('does not lower masteryLevel below 0', () => {
    let progress = createInitialProgress('k1')
    progress = applyAnswerResult(progress, { correct: false, usedHint: false, today: '2024-07-20' })
    expect(progress.masteryLevel).toBe(0)
  })

  describe('isWeak', () => {
    it('is false for a kanji that has never been studied', () => {
      expect(isWeak(createInitialProgress('k1'))).toBe(false)
    })

    it('is true when incorrect count is 2 or more', () => {
      let progress = createInitialProgress('k1')
      progress = applyAnswerResult(progress, {
        correct: false,
        usedHint: false,
        today: '2024-07-20',
      })
      progress = applyAnswerResult(progress, {
        correct: true,
        usedHint: false,
        today: '2024-07-20',
      })
      progress = applyAnswerResult(progress, {
        correct: false,
        usedHint: false,
        today: '2024-07-20',
      })
      expect(isWeak(progress)).toBe(true)
    })
  })

  describe('isMastered', () => {
    it('requires masteryLevel >= 4, enough attempts, and a recent streak', () => {
      let progress = createInitialProgress('k1')
      expect(isMastered(progress)).toBe(false)
      for (let i = 0; i < 4; i += 1) {
        progress = applyAnswerResult(progress, {
          correct: true,
          usedHint: false,
          today: '2024-07-20',
        })
      }
      expect(progress.masteryLevel).toBe(4)
      expect(progress.attempts).toBe(4)
      expect(progress.streak).toBe(4)
      expect(isMastered(progress)).toBe(true)
    })
  })
})
