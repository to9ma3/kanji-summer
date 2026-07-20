/**
 * 出題中のクイズセット（今日の5問・10問チャレンジ・20問テスト・苦手漢字）の
 * 一時的な（永続化しない）状態を管理するリデューサー。
 */
import type { QuizAnswerRecord, QuizMode, QuizQuestion } from '../types'

export type QuizSessionStatus = 'idle' | 'in-progress' | 'finished'

export type QuizSessionState = {
  status: QuizSessionStatus
  mode: QuizMode | null
  questions: QuizQuestion[]
  currentIndex: number
  answers: QuizAnswerRecord[]
}

export const initialQuizSessionState: QuizSessionState = {
  status: 'idle',
  mode: null,
  questions: [],
  currentIndex: 0,
  answers: [],
}

export type QuizSessionAction =
  | { type: 'start'; payload: { mode: QuizMode; questions: QuizQuestion[] } }
  | { type: 'answer'; payload: QuizAnswerRecord }
  | { type: 'next' }
  | { type: 'finish' }
  | { type: 'reset' }

export function quizSessionReducer(
  state: QuizSessionState,
  action: QuizSessionAction,
): QuizSessionState {
  switch (action.type) {
    case 'start':
      return {
        status: 'in-progress',
        mode: action.payload.mode,
        questions: action.payload.questions,
        currentIndex: 0,
        answers: [],
      }
    case 'answer':
      return { ...state, answers: [...state.answers, action.payload] }
    case 'next':
      return { ...state, currentIndex: state.currentIndex + 1 }
    case 'finish':
      return { ...state, status: 'finished' }
    case 'reset':
      return initialQuizSessionState
    default:
      return state
  }
}
