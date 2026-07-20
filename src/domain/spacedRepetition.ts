/**
 * 軽量な間隔反復（スペースドリピティション）アルゴリズム。
 *
 * masteryLevel (0〜5) に応じて次回復習日を決め、正解・不正解・ヒント使用の
 * 結果に応じて masteryLevel を更新する。ロジックはこのモジュールに閉じ込め、
 * UI やストレージ層から独立してテストできるようにする。
 */

import type { KanjiProgress, MasteryLevel } from '../types'
import { addDays } from './dateUtils'

/** masteryLevel ごとの目安復習間隔（日数）。 */
export const REVIEW_INTERVAL_DAYS: Record<MasteryLevel, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
}

export function clampMasteryLevel(level: number): MasteryLevel {
  const clamped = Math.min(5, Math.max(0, Math.round(level)))
  return clamped as MasteryLevel
}

export function createInitialProgress(kanjiId: string): KanjiProgress {
  return {
    kanjiId,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    hintCorrect: 0,
    streak: 0,
    masteryLevel: 0,
  }
}

export function computeNextReviewAt(masteryLevel: MasteryLevel, fromDate: string): string {
  return addDays(fromDate, REVIEW_INTERVAL_DAYS[masteryLevel])
}

export type AnswerResult = {
  correct: boolean
  usedHint: boolean
  /** JST の "YYYY-MM-DD"。省略時は呼び出し側で必ず指定すること（テスト容易性のため）。 */
  today: string
}

/**
 * 解答結果を反映した新しい KanjiProgress を返す（元のオブジェクトは変更しない）。
 *
 * 更新ルール：
 * - 自力正解：masteryLevel を1上げる
 * - ヒントあり正解：masteryLevel が 0 のときだけ 1 へ上げる（それ以外は維持）
 * - 不正解：masteryLevel が 2 以上なら 2 下げる、それ未満なら 1 下げる
 * - masteryLevel は 0〜5 に収める
 */
export function applyAnswerResult(progress: KanjiProgress, result: AnswerResult): KanjiProgress {
  const { correct, usedHint, today } = result
  const attempts = progress.attempts + 1

  let masteryLevel = progress.masteryLevel
  let correctCount = progress.correct
  let incorrectCount = progress.incorrect
  let hintCorrect = progress.hintCorrect
  let streak = progress.streak

  if (correct) {
    correctCount += 1
    streak += 1
    if (usedHint) {
      hintCorrect += 1
      masteryLevel = clampMasteryLevel(masteryLevel === 0 ? 1 : masteryLevel)
    } else {
      masteryLevel = clampMasteryLevel(masteryLevel + 1)
    }
  } else {
    incorrectCount += 1
    streak = 0
    masteryLevel = clampMasteryLevel(masteryLevel - (masteryLevel >= 2 ? 2 : 1))
  }

  return {
    ...progress,
    attempts,
    correct: correctCount,
    incorrect: incorrectCount,
    hintCorrect,
    streak,
    masteryLevel,
    lastAnsweredAt: today,
    nextReviewAt: computeNextReviewAt(masteryLevel, today),
  }
}

/** 期限が来た復習対象かどうか（今日以前が予定日）。 */
export function isReviewDue(progress: KanjiProgress | undefined, today: string): boolean {
  if (!progress || !progress.nextReviewAt) return false
  return progress.nextReviewAt <= today
}

/** まだ一度も学習していないかどうか。 */
export function isUnstudied(progress: KanjiProgress | undefined): boolean {
  return !progress || progress.attempts === 0
}

/**
 * 苦手判定の目安：
 * - incorrect が 2 回以上
 * - 正解率が 70% 未満
 * - 直近の解答が不正解（streak が 0 で incorrect がある）
 * - masteryLevel が低い（1 以下）
 */
export function isWeak(progress: KanjiProgress | undefined): boolean {
  if (!progress || progress.attempts === 0) return false
  const accuracy = progress.correct / progress.attempts
  const recentlyIncorrect = progress.streak === 0 && progress.incorrect > 0
  return (
    progress.incorrect >= 2 || accuracy < 0.7 || recentlyIncorrect || progress.masteryLevel <= 1
  )
}

/**
 * マスター判定の目安：
 * - masteryLevel が 4 以上
 * - 一定回数（3回）以上回答している
 * - 直近の正解が続いている（streak が 2 以上）
 */
export function isMastered(progress: KanjiProgress | undefined): boolean {
  if (!progress) return false
  return progress.masteryLevel >= 4 && progress.attempts >= 3 && progress.streak >= 2
}
