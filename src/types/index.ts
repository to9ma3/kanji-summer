/**
 * アプリ全体で使う型定義。
 *
 * 保存データ（AppSettings / KanjiProgress / DailyHistory / AchievementState など）は
 * すべて schemaVersion を持ち、将来のデータ移行に備える。
 */

export type KanjiWord = {
  word: string
  reading: string
  meaning?: string
}

export type ExampleSentence = {
  text: string
  reading?: string
}

export type KanjiItem = {
  id: string
  kanji: string
  onyomi: string[]
  kunyomi: string[]
  primaryReadings: string[]
  words: KanjiWord[]
  exampleSentences: ExampleSentence[]
  hint: string
  group: number
  enabledByDefault: boolean
}

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5

export type KanjiProgress = {
  kanjiId: string
  attempts: number
  correct: number
  incorrect: number
  hintCorrect: number
  streak: number
  masteryLevel: MasteryLevel
  /** JST の日付文字列 (YYYY-MM-DD)。まだ解答したことがなければ undefined。 */
  lastAnsweredAt?: string
  /** JST の日付文字列 (YYYY-MM-DD)。次に復習が来る予定日。 */
  nextReviewAt?: string
}

export type ProgressMap = Record<string, KanjiProgress>

export type DailyQuestionCount = 5 | 10 | 20

export type AppSettings = {
  schemaVersion: number
  nickname: string
  dailyQuestionCount: DailyQuestionCount
  soundEnabled: boolean
  reduceMotion: boolean
  enabledKanjiIds: string[]
  summerStart: string
  summerEnd: string
  includeHandwritingInRegularQuiz: boolean
  parentPin: string | null
  hasCompletedSetup: boolean
  hasSeenInstallGuide: boolean
  dailyGoal: number
}

export type DailyRecord = {
  date: string
  attempts: number
  correct: number
  starsEarned: number
  kanjiIds: string[]
  goalMet: boolean
  allCorrect: boolean
}

export type DailyHistory = Record<string, DailyRecord>

export type AchievementId =
  | 'first-step'
  | 'explore-5'
  | 'explore-10'
  | 'streak-7'
  | 'challenge-100'
  | 'master-10'
  | 'master-50'
  | 'master-95'

export type AchievementDefinition = {
  id: AchievementId
  title: string
  description: string
}

export type AchievementState = {
  id: AchievementId
  unlockedAt: string | null
}

export type QuizQuestionType =
  'reading-choice' | 'kanji-choice' | 'compound-reading' | 'fill-blank' | 'handwriting'

export type QuizMode = 'daily' | 'challenge' | 'test' | 'weak'

export type QuizQuestion = {
  id: string
  type: QuizQuestionType
  kanjiId: string
  prompt: string
  choices: string[]
  correctAnswer: string
  explanation: string
  reading?: string
  /** 書き取り問題でお手本として表示する文字列。type === 'handwriting' の時のみ利用。 */
  handwritingTarget?: string
}

export type QuizAnswerRecord = {
  question: QuizQuestion
  userAnswer: string
  correct: boolean
  usedHint: boolean
  starsEarned: number
  newlyMastered: boolean
}

export type StorageState = {
  schemaVersion: number
  settings: AppSettings
  progress: ProgressMap
  dailyHistory: DailyHistory
  achievements: AchievementState[]
  totalStars: number
}

export type ExportData = {
  schemaVersion: number
  exportedAt: string
  settings: AppSettings
  progress: ProgressMap
  dailyHistory: DailyHistory
  achievements: AchievementState[]
  totalStars: number
}
