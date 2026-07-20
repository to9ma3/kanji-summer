/**
 * 星の計算・実績判定・学習統計の集計を行うモジュール。
 *
 * ストレージやコンポーネントから独立させることで、ユニットテストしやすくしている。
 */

import type { AchievementId, DailyHistory, ProgressMap } from '../types'
import { addDays } from './dateUtils'
import { applyAnswerResult, createInitialProgress, isMastered, isWeak } from './spacedRepetition'

/** 1問あたりの獲得スター数。自力正解:2 / ヒントあり正解:1 / 不正解:0。 */
export function starsForAnswer(correct: boolean, usedHint: boolean): number {
  if (!correct) return 0
  return usedHint ? 1 : 2
}

/** セット完了時のボーナス。完了で+3、全問正解でさらに+5。 */
export function starsForSetCompletion(totalCount: number, correctCount: number): number {
  if (totalCount <= 0) return 0
  let bonus = 3
  if (correctCount === totalCount) bonus += 5
  return bonus
}

export type AchievementStats = {
  totalDaysStudied: number
  currentStreak: number
  totalQuestionsAnswered: number
  masteredCount: number
}

const ACHIEVEMENT_RULES: { id: AchievementId; isMet: (stats: AchievementStats) => boolean }[] = [
  { id: 'first-step', isMet: (s) => s.totalDaysStudied >= 1 },
  { id: 'explore-5', isMet: (s) => s.totalDaysStudied >= 5 },
  { id: 'explore-10', isMet: (s) => s.totalDaysStudied >= 10 },
  { id: 'streak-7', isMet: (s) => s.currentStreak >= 7 },
  { id: 'challenge-100', isMet: (s) => s.totalQuestionsAnswered >= 100 },
  { id: 'master-10', isMet: (s) => s.masteredCount >= 10 },
  { id: 'master-50', isMet: (s) => s.masteredCount >= 50 },
  { id: 'master-95', isMet: (s) => s.masteredCount >= 95 },
]

/**
 * 新たに解除された実績IDの一覧を返す。すでに解除済み（unlockedIds に含まれる）実績は
 * 二重に通知しないようここで除外する。
 */
export function evaluateAchievements(
  stats: AchievementStats,
  unlockedIds: ReadonlySet<AchievementId>,
): AchievementId[] {
  return ACHIEVEMENT_RULES.filter((rule) => rule.isMet(stats) && !unlockedIds.has(rule.id)).map(
    (rule) => rule.id,
  )
}

/** 今日を含め、連続で学習している日数。今日まだ学習していなければ昨日を起点に数える。 */
export function computeCurrentStreak(dailyHistory: DailyHistory, today: string): number {
  let streak = 0
  const todayRecord = dailyHistory[today]
  let cursor = todayRecord && todayRecord.attempts > 0 ? today : addDays(today, -1)

  // 安全のため最大2年分でループを打ち切る
  for (let i = 0; i < 730; i += 1) {
    const record = dailyHistory[cursor]
    if (!record || record.attempts === 0) break
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function computeTotalDaysStudied(dailyHistory: DailyHistory): number {
  return Object.values(dailyHistory).filter((record) => record.attempts > 0).length
}

export function computeTotalQuestionsAnswered(dailyHistory: DailyHistory): number {
  return Object.values(dailyHistory).reduce((sum, record) => sum + record.attempts, 0)
}

export function computeTotalCorrect(dailyHistory: DailyHistory): number {
  return Object.values(dailyHistory).reduce((sum, record) => sum + record.correct, 0)
}

export function computeAccuracy(dailyHistory: DailyHistory): number {
  const attempts = computeTotalQuestionsAnswered(dailyHistory)
  if (attempts === 0) return 0
  return computeTotalCorrect(dailyHistory) / attempts
}

export function computeMasteredKanjiIds(progressMap: ProgressMap): string[] {
  return Object.values(progressMap)
    .filter((p) => isMastered(p))
    .map((p) => p.kanjiId)
}

export function computeWeakKanjiIds(progressMap: ProgressMap): string[] {
  return Object.values(progressMap)
    .filter((p) => isWeak(p))
    .map((p) => p.kanjiId)
}

export type LearningStats = {
  totalDaysStudied: number
  currentStreak: number
  totalQuestionsAnswered: number
  totalCorrect: number
  accuracy: number
  masteredKanjiIds: string[]
  weakKanjiIds: string[]
}

export function computeLearningStats(
  dailyHistory: DailyHistory,
  progressMap: ProgressMap,
  today: string,
): LearningStats {
  return {
    totalDaysStudied: computeTotalDaysStudied(dailyHistory),
    currentStreak: computeCurrentStreak(dailyHistory, today),
    totalQuestionsAnswered: computeTotalQuestionsAnswered(dailyHistory),
    totalCorrect: computeTotalCorrect(dailyHistory),
    accuracy: computeAccuracy(dailyHistory),
    masteredKanjiIds: computeMasteredKanjiIds(progressMap),
    weakKanjiIds: computeWeakKanjiIds(progressMap),
  }
}

export type SessionAnswerInput = {
  kanjiId: string
  correct: boolean
  usedHint: boolean
}

export type ApplyQuizSessionParams = {
  progress: ProgressMap
  dailyHistory: DailyHistory
  totalStars: number
  unlockedAchievementIds: ReadonlySet<AchievementId>
  answers: SessionAnswerInput[]
  today: string
  dailyGoal: number
}

export type ApplyQuizSessionResult = {
  progress: ProgressMap
  dailyHistory: DailyHistory
  totalStars: number
  starsEarnedThisSession: number
  newlyMasteredKanjiIds: string[]
  newlyUnlockedAchievementIds: AchievementId[]
}

/**
 * 1セット分の解答結果を、既存の progress / dailyHistory / totalStars に反映する。
 *
 * 副作用を持たない純粋関数にすることで、UI やストレージから独立してテストできる。
 * - 自力正解:2 / ヒントあり正解:1 / 不正解:0 スターを付与
 * - セット完了ボーナス+3、全問正解ボーナス+5
 * - 新しくマスターした漢字・新しく解除された実績を検出する
 */
export function applyQuizSession(params: ApplyQuizSessionParams): ApplyQuizSessionResult {
  const { progress, dailyHistory, totalStars, unlockedAchievementIds, answers, today, dailyGoal } =
    params

  const nextProgress: ProgressMap = { ...progress }
  const newlyMasteredKanjiIds: string[] = []
  let sessionStars = 0
  let correctCount = 0

  for (const answer of answers) {
    const before = nextProgress[answer.kanjiId] ?? createInitialProgress(answer.kanjiId)
    const wasMastered = isMastered(before)
    const after = applyAnswerResult(before, {
      correct: answer.correct,
      usedHint: answer.usedHint,
      today,
    })
    nextProgress[answer.kanjiId] = after
    if (!wasMastered && isMastered(after)) {
      newlyMasteredKanjiIds.push(answer.kanjiId)
    }
    sessionStars += starsForAnswer(answer.correct, answer.usedHint)
    if (answer.correct) correctCount += 1
  }

  sessionStars += starsForSetCompletion(answers.length, correctCount)

  const existingRecord = dailyHistory[today]
  const mergedKanjiIds = new Set(existingRecord?.kanjiIds ?? [])
  for (const answer of answers) mergedKanjiIds.add(answer.kanjiId)

  const attempts = (existingRecord?.attempts ?? 0) + answers.length
  const correct = (existingRecord?.correct ?? 0) + correctCount
  const starsEarned = (existingRecord?.starsEarned ?? 0) + sessionStars

  const nextDailyHistory: DailyHistory = {
    ...dailyHistory,
    [today]: {
      date: today,
      attempts,
      correct,
      starsEarned,
      kanjiIds: [...mergedKanjiIds],
      goalMet: attempts >= dailyGoal,
      allCorrect: attempts > 0 && correct === attempts,
    },
  }

  const stats: AchievementStats = {
    totalDaysStudied: computeTotalDaysStudied(nextDailyHistory),
    currentStreak: computeCurrentStreak(nextDailyHistory, today),
    totalQuestionsAnswered: computeTotalQuestionsAnswered(nextDailyHistory),
    masteredCount: computeMasteredKanjiIds(nextProgress).length,
  }
  const newlyUnlockedAchievementIds = evaluateAchievements(stats, unlockedAchievementIds)

  return {
    progress: nextProgress,
    dailyHistory: nextDailyHistory,
    totalStars: totalStars + sessionStars,
    starsEarnedThisSession: sessionStars,
    newlyMasteredKanjiIds,
    newlyUnlockedAchievementIds,
  }
}
