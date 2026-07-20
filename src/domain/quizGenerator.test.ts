import { describe, expect, it } from 'vitest'
import { KANJI_LIST } from '../data/kanji'
import type { ProgressMap } from '../types'
import { dakutenVariants, generateQuiz } from './quizGenerator'

// テストの再現性のため、シード付きの単純な疑似乱数を使う
function seededRng(seed: number): () => number {
  let value = seed
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648
    return value / 2147483648
  }
}

describe('generateQuiz', () => {
  const emptyProgress: ProgressMap = {}

  it('generates exactly `count` questions when enough kanji are available', () => {
    const questions = generateQuiz({
      kanjiPool: KANJI_LIST,
      progressMap: emptyProgress,
      count: 5,
      mode: 'daily',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(1),
    })
    expect(questions).toHaveLength(5)
  })

  it('always has exactly one correct answer included in the choices for multiple-choice questions', () => {
    const questions = generateQuiz({
      kanjiPool: KANJI_LIST,
      progressMap: emptyProgress,
      count: 20,
      mode: 'test',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(42),
    })
    for (const q of questions) {
      expect(q.choices).toContain(q.correctAnswer)
    }
  })

  it('never has duplicate choices within a single question', () => {
    const questions = generateQuiz({
      kanjiPool: KANJI_LIST,
      progressMap: emptyProgress,
      count: 20,
      mode: 'test',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(7),
    })
    for (const q of questions) {
      if (q.choices.length === 0) continue // 書き取り問題は選択肢を持たない
      expect(new Set(q.choices).size).toBe(q.choices.length)
    }
  })

  it('gives multiple-choice questions exactly 4 choices', () => {
    const questions = generateQuiz({
      kanjiPool: KANJI_LIST,
      progressMap: emptyProgress,
      count: 20,
      mode: 'test',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(9),
    })
    for (const q of questions) {
      expect(q.choices.length).toBe(4)
    }
  })

  it('does not repeat the same kanji within one set when enough kanji are available', () => {
    const questions = generateQuiz({
      kanjiPool: KANJI_LIST,
      progressMap: emptyProgress,
      count: 10,
      mode: 'challenge',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(3),
    })
    const kanjiIds = questions.map((q) => q.kanjiId)
    expect(new Set(kanjiIds).size).toBe(kanjiIds.length)
  })

  it('returns an empty array for weak mode when there are no weak kanji', () => {
    const questions = generateQuiz({
      kanjiPool: KANJI_LIST,
      progressMap: emptyProgress,
      count: 5,
      mode: 'weak',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(1),
    })
    expect(questions).toEqual([])
  })

  it('only selects from weak kanji in weak mode', () => {
    const weakKanji = KANJI_LIST[0]!
    const progressMap: ProgressMap = {
      [weakKanji.id]: {
        kanjiId: weakKanji.id,
        attempts: 3,
        correct: 0,
        incorrect: 3,
        hintCorrect: 0,
        streak: 0,
        masteryLevel: 0,
      },
    }
    const questions = generateQuiz({
      kanjiPool: KANJI_LIST,
      progressMap,
      count: 5,
      mode: 'weak',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(1),
    })
    expect(questions.length).toBeGreaterThan(0)
    for (const q of questions) {
      expect(q.kanjiId).toBe(weakKanji.id)
    }
  })

  it('returns an empty array when the kanji pool is empty', () => {
    const questions = generateQuiz({
      kanjiPool: [],
      progressMap: emptyProgress,
      count: 5,
      mode: 'daily',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(1),
    })
    expect(questions).toEqual([])
  })

  it('falls back safely and still returns questions when the pool is smaller than count', () => {
    const smallPool = KANJI_LIST.slice(0, 3)
    const questions = generateQuiz({
      kanjiPool: smallPool,
      progressMap: emptyProgress,
      count: 5,
      mode: 'daily',
      today: '2024-07-20',
      includeHandwriting: false,
      rng: seededRng(5),
    })
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.length).toBeLessThanOrEqual(5)
  })

  it('produces handwriting questions with a handwritingTarget and no auto-graded choices', () => {
    const questions = generateQuiz({
      kanjiPool: KANJI_LIST,
      progressMap: emptyProgress,
      count: 20,
      mode: 'test',
      today: '2024-07-20',
      includeHandwriting: true,
      rng: seededRng(11),
    })
    const handwritingQuestions = questions.filter((q) => q.type === 'handwriting')
    for (const q of handwritingQuestions) {
      expect(q.handwritingTarget).toBeTruthy()
      expect(q.choices).toEqual([])
    }
  })
})

describe('dakutenVariants', () => {
  it('produces plausible near-miss readings by toggling dakuten', () => {
    const variants = dakutenVariants('としょかん')
    expect(variants.length).toBeGreaterThan(0)
    expect(variants).not.toContain('としょかん')
    expect(variants).toContain('どしょかん')
  })

  it('returns an empty array for a reading with no togglable characters', () => {
    expect(dakutenVariants('')).toEqual([])
  })
})
