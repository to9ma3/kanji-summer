import { describe, expect, it } from 'vitest'
import type { QuizAnswerRecord, QuizQuestion } from '../types'
import { initialQuizSessionState, quizSessionReducer } from './quizSessionReducer'

const question: QuizQuestion = {
  id: 'q1',
  type: 'reading-choice',
  kanjiId: 'oyogu',
  prompt: '「水泳」の読み方は？',
  choices: ['すいえい', 'すいよう', 'みずえい', 'すいおよぎ'],
  correctAnswer: 'すいえい',
  explanation: '「水泳」は「すいえい」と読みます。',
}

describe('quizSessionReducer', () => {
  it('starts a new session with the given questions', () => {
    const next = quizSessionReducer(initialQuizSessionState, {
      type: 'start',
      payload: { mode: 'daily', questions: [question] },
    })
    expect(next.status).toBe('in-progress')
    expect(next.questions).toHaveLength(1)
    expect(next.currentIndex).toBe(0)
    expect(next.answers).toEqual([])
  })

  it('appends an answer record', () => {
    const started = quizSessionReducer(initialQuizSessionState, {
      type: 'start',
      payload: { mode: 'daily', questions: [question] },
    })
    const record: QuizAnswerRecord = {
      question,
      userAnswer: 'すいえい',
      correct: true,
      usedHint: false,
      starsEarned: 2,
      newlyMastered: false,
    }
    const next = quizSessionReducer(started, { type: 'answer', payload: record })
    expect(next.answers).toHaveLength(1)
    expect(next.answers[0]?.correct).toBe(true)
  })

  it('advances currentIndex', () => {
    const started = quizSessionReducer(initialQuizSessionState, {
      type: 'start',
      payload: { mode: 'daily', questions: [question, question] },
    })
    const next = quizSessionReducer(started, { type: 'next' })
    expect(next.currentIndex).toBe(1)
  })

  it('marks the session as finished', () => {
    const started = quizSessionReducer(initialQuizSessionState, {
      type: 'start',
      payload: { mode: 'daily', questions: [question] },
    })
    const next = quizSessionReducer(started, { type: 'finish' })
    expect(next.status).toBe('finished')
  })

  it('resets back to idle', () => {
    const started = quizSessionReducer(initialQuizSessionState, {
      type: 'start',
      payload: { mode: 'daily', questions: [question] },
    })
    const next = quizSessionReducer(started, { type: 'reset' })
    expect(next).toEqual(initialQuizSessionState)
  })
})
