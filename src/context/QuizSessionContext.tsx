import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type { ApplyQuizSessionResult } from '../domain/progressCalculator'
import { applyQuizSession } from '../domain/progressCalculator'
import { applyAnswerResult, createInitialProgress, isMastered } from '../domain/spacedRepetition'
import { generateHandwritingQuestions, generateQuiz } from '../domain/quizGenerator'
import { todayJst } from '../domain/dateUtils'
import { KANJI_LIST } from '../data/kanji'
import type { AchievementState, QuizAnswerRecord, QuizMode } from '../types'
import { starsForAnswer } from '../domain/progressCalculator'
import { useAppData } from './AppDataContext'
import {
  initialQuizSessionState,
  quizSessionReducer,
  type QuizSessionState,
} from '../reducers/quizSessionReducer'

type StartSessionParams = {
  mode: QuizMode
  count: number
}

type QuizSessionContextValue = {
  session: QuizSessionState
  lastResult: ApplyQuizSessionResult | null
  startSession: (params: StartSessionParams) => boolean
  startHandwritingSession: (count: number) => boolean
  submitAnswer: (userAnswer: string, usedHint: boolean) => QuizAnswerRecord
  goToNextQuestion: () => void
  finishSession: () => ApplyQuizSessionResult
  resetSession: () => void
}

const QuizSessionContext = createContext<QuizSessionContextValue | null>(null)

export function QuizSessionProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { state, dispatch: dispatchAppData } = useAppData()
  const [session, dispatch] = useReducer(quizSessionReducer, initialQuizSessionState)
  const [lastResult, setLastResult] = useState<ApplyQuizSessionResult | null>(null)

  const startSession = useCallback(
    (params: StartSessionParams): boolean => {
      const enabledIds = new Set(state.settings.enabledKanjiIds)
      const kanjiPool = KANJI_LIST.filter((k) => enabledIds.has(k.id))
      const today = todayJst()
      const questions = generateQuiz({
        kanjiPool: kanjiPool.length > 0 ? kanjiPool : KANJI_LIST,
        distractorPool: KANJI_LIST,
        progressMap: state.progress,
        count: params.count,
        mode: params.mode,
        today,
        includeHandwriting: state.settings.includeHandwritingInRegularQuiz,
      })
      if (questions.length === 0) return false
      setLastResult(null)
      dispatch({ type: 'start', payload: { mode: params.mode, questions } })
      return true
    },
    [
      state.settings.enabledKanjiIds,
      state.settings.includeHandwritingInRegularQuiz,
      state.progress,
    ],
  )

  const startHandwritingSession = useCallback(
    (count: number): boolean => {
      const enabledIds = new Set(state.settings.enabledKanjiIds)
      const kanjiPool = KANJI_LIST.filter((k) => enabledIds.has(k.id))
      const today = todayJst()
      const questions = generateHandwritingQuestions({
        kanjiPool: kanjiPool.length > 0 ? kanjiPool : KANJI_LIST,
        progressMap: state.progress,
        count,
        today,
      })
      if (questions.length === 0) return false
      setLastResult(null)
      dispatch({ type: 'start', payload: { mode: 'daily', questions } })
      return true
    },
    [state.settings.enabledKanjiIds, state.progress],
  )

  const submitAnswer = useCallback(
    (userAnswer: string, usedHint: boolean): QuizAnswerRecord => {
      const question = session.questions[session.currentIndex]
      if (!question) {
        throw new Error('submitAnswer called with no active question')
      }
      const correct = userAnswer === question.correctAnswer
      const before = state.progress[question.kanjiId] ?? createInitialProgress(question.kanjiId)
      const wasMastered = isMastered(before)
      const after = applyAnswerResult(before, { correct, usedHint, today: todayJst() })
      const record: QuizAnswerRecord = {
        question,
        userAnswer,
        correct,
        usedHint,
        starsEarned: starsForAnswer(correct, usedHint),
        newlyMastered: !wasMastered && isMastered(after),
      }
      dispatch({ type: 'answer', payload: record })
      return record
    },
    [session.questions, session.currentIndex, state.progress],
  )

  const goToNextQuestion = useCallback(() => {
    dispatch({ type: 'next' })
  }, [])

  const finishSession = useCallback((): ApplyQuizSessionResult => {
    const unlockedIds = new Set(state.achievements.filter((a) => a.unlockedAt).map((a) => a.id))
    const today = todayJst()
    const result = applyQuizSession({
      progress: state.progress,
      dailyHistory: state.dailyHistory,
      totalStars: state.totalStars,
      unlockedAchievementIds: unlockedIds,
      answers: session.answers.map((a) => ({
        kanjiId: a.question.kanjiId,
        correct: a.correct,
        usedHint: a.usedHint,
      })),
      today,
      dailyGoal: state.settings.dailyGoal,
    })

    const nowIso = new Date().toISOString()
    const achievements: AchievementState[] = [...state.achievements]
    for (const id of result.newlyUnlockedAchievementIds) {
      const idx = achievements.findIndex((a) => a.id === id)
      if (idx >= 0) {
        achievements[idx] = { id, unlockedAt: nowIso }
      } else {
        achievements.push({ id, unlockedAt: nowIso })
      }
    }

    dispatchAppData({
      type: 'session/commit',
      payload: {
        progress: result.progress,
        dailyHistory: result.dailyHistory,
        totalStars: result.totalStars,
        achievements,
      },
    })
    dispatch({ type: 'finish' })
    setLastResult(result)
    return result
  }, [
    state.progress,
    state.dailyHistory,
    state.totalStars,
    state.achievements,
    state.settings.dailyGoal,
    session.answers,
    dispatchAppData,
  ])

  const resetSession = useCallback(() => {
    setLastResult(null)
    dispatch({ type: 'reset' })
  }, [])

  const value = useMemo<QuizSessionContextValue>(
    () => ({
      session,
      lastResult,
      startSession,
      startHandwritingSession,
      submitAnswer,
      goToNextQuestion,
      finishSession,
      resetSession,
    }),
    [
      session,
      lastResult,
      startSession,
      startHandwritingSession,
      submitAnswer,
      goToNextQuestion,
      finishSession,
      resetSession,
    ],
  )

  return <QuizSessionContext.Provider value={value}>{children}</QuizSessionContext.Provider>
}

export function useQuizSession(): QuizSessionContextValue {
  const ctx = useContext(QuizSessionContext)
  if (!ctx) throw new Error('useQuizSession must be used within a QuizSessionProvider')
  return ctx
}
