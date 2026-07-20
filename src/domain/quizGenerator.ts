/**
 * クイズ問題生成モジュール。
 *
 * 出題形式（読み方選択・漢字選択・熟語の読み・文の穴埋め・書き取り）ごとに
 * 個別のビルダー関数を持ち、以下を保証する：
 * - 正解は必ず1つ、選択肢は原則4つ
 * - 選択肢は重複しない
 * - 正解は必ず選択肢に含まれる
 * - 1セット内で同じ漢字・同じ問題を極力重複させない
 * - 生成に失敗した場合は安全に別の問題（別の形式・別の漢字）へ切り替える
 *
 * 出題する漢字の選び方（今日の5問など）は、期限が来た復習・苦手を50%、
 * まだ習得していない漢字を30%、ランダムな確認問題を20%を目安に選ぶ。
 */

import type { KanjiItem, ProgressMap, QuizMode, QuizQuestion, QuizQuestionType } from '../types'
import { isReviewDue, isUnstudied, isWeak } from './spacedRepetition'

type Rng = () => number

export type GenerateQuizParams = {
  /** 出題対象となる漢字（保護者設定で有効になっているもの）。 */
  kanjiPool: KanjiItem[]
  /** 誤答候補を作るための漢字プール。省略時は kanjiPool を使う。 */
  distractorPool?: KanjiItem[]
  progressMap: ProgressMap
  count: number
  mode: QuizMode
  /** JST の "YYYY-MM-DD"。 */
  today: string
  includeHandwriting: boolean
  /** テスト用に注入できる乱数生成器。省略時は Math.random。 */
  rng?: Rng
}

const MULTIPLE_CHOICE_TYPES: QuizQuestionType[] = [
  'reading-choice',
  'kanji-choice',
  'compound-reading',
  'fill-blank',
]

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j] as T
    copy[j] = tmp as T
  }
  return copy
}

function pickOne<T>(items: T[], rng: Rng): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(rng() * items.length)]
}

let idCounter = 0
function makeQuestionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  idCounter += 1
  return `q-${idCounter}-${Math.floor(Math.random() * 1_000_000)}`
}

// --- ひらがな濁点・半濁点のゆらぎを作るユーティリティ（熟語の読み問題の誤答候補用） ---

const DAKUTEN: Record<string, string> = {
  か: 'が',
  き: 'ぎ',
  く: 'ぐ',
  け: 'げ',
  こ: 'ご',
  さ: 'ざ',
  し: 'じ',
  す: 'ず',
  せ: 'ぜ',
  そ: 'ぞ',
  た: 'だ',
  ち: 'ぢ',
  つ: 'づ',
  て: 'で',
  と: 'ど',
  は: 'ば',
  ひ: 'び',
  ふ: 'ぶ',
  へ: 'べ',
  ほ: 'ぼ',
}
const HANDAKUTEN: Record<string, string> = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' }
const REVERSE_DAKUTEN: Record<string, string> = Object.fromEntries(
  Object.entries(DAKUTEN).map(([plain, voiced]) => [voiced, plain]),
)

/** 1文字だけ濁点・半濁点を切り替えた「もっともらしい誤答」の読みを生成する。 */
export function dakutenVariants(reading: string): string[] {
  const chars = [...reading]
  const singleEdits: { index: number; char: string }[] = []
  chars.forEach((c, index) => {
    if (DAKUTEN[c]) singleEdits.push({ index, char: DAKUTEN[c] })
    if (HANDAKUTEN[c]) singleEdits.push({ index, char: HANDAKUTEN[c] })
    if (REVERSE_DAKUTEN[c]) singleEdits.push({ index, char: REVERSE_DAKUTEN[c] })
  })

  const apply = (edit: { index: number; char: string }): string => {
    const next = [...chars]
    next[edit.index] = edit.char
    return next.join('')
  }

  const results = new Set<string>()
  for (const edit of singleEdits) {
    results.add(apply(edit))
  }
  for (let i = 0; i < singleEdits.length; i += 1) {
    for (let j = i + 1; j < singleEdits.length; j += 1) {
      const a = singleEdits[i]
      const b = singleEdits[j]
      if (!a || !b || a.index === b.index) continue
      const next = [...chars]
      next[a.index] = a.char
      next[b.index] = b.char
      results.add(next.join(''))
    }
  }
  results.delete(reading)
  return [...results]
}

type BuildContext = {
  kanji: KanjiItem
  pool: KanjiItem[]
  rng: Rng
}

function finalizeChoices(correct: string, distractors: string[]): string[] | null {
  const uniqueDistractors = [...new Set(distractors)].filter((d) => d !== correct)
  if (uniqueDistractors.length < 3) return null
  return [correct, ...uniqueDistractors.slice(0, 3)]
}

function buildReadingChoice({ kanji, pool, rng }: BuildContext): QuizQuestion | null {
  const word = pickOne(kanji.words, rng)
  if (!word) return null
  const correct = word.reading

  const otherReadings = new Set<string>()
  for (const other of pool) {
    if (other.id === kanji.id) continue
    for (const w of other.words) {
      if (w.reading !== correct) otherReadings.add(w.reading)
    }
  }

  const distractors = shuffle([...otherReadings], rng)
  const choices = finalizeChoices(correct, distractors)
  if (!choices) return null

  return {
    id: makeQuestionId(),
    type: 'reading-choice',
    kanjiId: kanji.id,
    prompt: `「${word.word}」の読み方は？`,
    choices: shuffle(choices, rng),
    correctAnswer: correct,
    explanation: `「${word.word}」は「${correct}」と読みます。`,
    reading: correct,
  }
}

function buildKanjiChoice({ kanji, pool, rng }: BuildContext): QuizQuestion | null {
  const readingSource =
    kanji.primaryReadings.find((r) => kanji.kunyomi.includes(r)) ?? kanji.primaryReadings[0]
  if (!readingSource) return null

  const otherKanji = pool.filter((k) => k.id !== kanji.id).map((k) => k.kanji)
  const distractors = shuffle(otherKanji, rng)
  const choices = finalizeChoices(kanji.kanji, distractors)
  if (!choices) return null

  return {
    id: makeQuestionId(),
    type: 'kanji-choice',
    kanjiId: kanji.id,
    prompt: `「${readingSource}」に合う漢字は？`,
    choices: shuffle(choices, rng),
    correctAnswer: kanji.kanji,
    explanation: `「${readingSource}」は「${kanji.kanji}」と書きます。`,
    reading: readingSource,
  }
}

function buildCompoundReading({ kanji, pool, rng }: BuildContext): QuizQuestion | null {
  const multiCharWords = kanji.words.filter((w) => [...w.word].length >= 2)
  const word = pickOne(multiCharWords.length > 0 ? multiCharWords : kanji.words, rng)
  if (!word) return null
  const correct = word.reading

  let distractors = shuffle(dakutenVariants(correct), rng)
  if (distractors.length < 3) {
    const sameLengthReadings = pool
      .filter((k) => k.id !== kanji.id)
      .flatMap((k) => k.words.map((w) => w.reading))
      .filter((r) => r !== correct && [...r].length === [...correct].length)
    distractors = [...distractors, ...shuffle([...new Set(sameLengthReadings)], rng)]
  }
  const choices = finalizeChoices(correct, distractors)
  if (!choices) return null

  return {
    id: makeQuestionId(),
    type: 'compound-reading',
    kanjiId: kanji.id,
    prompt: `「${word.word}」の「${kanji.kanji}」の読み方を含む、正しい読みは？`,
    choices: shuffle(choices, rng),
    correctAnswer: correct,
    explanation: `「${word.word}」は「${correct}」と読みます。`,
    reading: correct,
  }
}

function buildFillBlank({ kanji, pool, rng }: BuildContext): QuizQuestion | null {
  for (const sentence of shuffle(kanji.exampleSentences, rng)) {
    const matchingWords = kanji.words.filter((w) => sentence.text.includes(w.word))
    const word = pickOne(matchingWords, rng)
    if (!word) continue
    const blanked = sentence.text.replace(word.word, '（　　）')
    if (blanked === sentence.text) continue

    const distractorWords = pool
      .filter((k) => k.id !== kanji.id)
      .flatMap((k) => k.words.map((w) => w.word))
    const distractors = shuffle([...new Set(distractorWords)], rng)
    const choices = finalizeChoices(word.word, distractors)
    if (!choices) continue

    return {
      id: makeQuestionId(),
      type: 'fill-blank',
      kanjiId: kanji.id,
      prompt: blanked,
      choices: shuffle(choices, rng),
      correctAnswer: word.word,
      explanation: `正しい答えは「${word.word}」です。`,
      reading: word.reading,
    }
  }
  return null
}

export function buildHandwriting({ kanji, rng }: BuildContext): QuizQuestion | null {
  const word = pickOne(kanji.words, rng)
  if (!word) return null
  return {
    id: makeQuestionId(),
    type: 'handwriting',
    kanjiId: kanji.id,
    prompt: `「${word.reading}」を漢字で書いてみよう`,
    choices: [],
    correctAnswer: word.word,
    explanation: `お手本は「${word.word}」です。`,
    reading: word.reading,
    handwritingTarget: word.word,
  }
}

function buildByType(type: QuizQuestionType, ctx: BuildContext): QuizQuestion | null {
  switch (type) {
    case 'reading-choice':
      return buildReadingChoice(ctx)
    case 'kanji-choice':
      return buildKanjiChoice(ctx)
    case 'compound-reading':
      return buildCompoundReading(ctx)
    case 'fill-blank':
      return buildFillBlank(ctx)
    case 'handwriting':
      return buildHandwriting(ctx)
    default:
      return null
  }
}

export function dedupeById(items: KanjiItem[]): KanjiItem[] {
  const seen = new Set<string>()
  const result: KanjiItem[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }
  return result
}

export function padToCount(
  items: KanjiItem[],
  allPool: KanjiItem[],
  count: number,
  rng: Rng,
): KanjiItem[] {
  const result = [...items]
  const usedIds = new Set(result.map((k) => k.id))

  const remaining = shuffle(
    allPool.filter((k) => !usedIds.has(k.id)),
    rng,
  )
  for (const k of remaining) {
    if (result.length >= count) break
    result.push(k)
    usedIds.add(k.id)
  }

  // それでも足りない場合（有効な漢字が極端に少ない場合）は、やむを得ず重複を許可する
  if (result.length < count && allPool.length > 0) {
    let i = 0
    while (result.length < count && i < count * 3) {
      result.push(allPool[i % allPool.length] as KanjiItem)
      i += 1
    }
  }

  return result.slice(0, count)
}

function takeUnique(pool: KanjiItem[], n: number, usedIds: Set<string>, rng: Rng): KanjiItem[] {
  const candidates = shuffle(
    pool.filter((k) => !usedIds.has(k.id)),
    rng,
  )
  const taken = candidates.slice(0, Math.max(0, n))
  for (const k of taken) usedIds.add(k.id)
  return taken
}

/**
 * 「期限が来た復習・苦手」50%、「まだ習得していない漢字」30%、
 * 「ランダムな確認問題」20% の目安で出題漢字を選ぶ。
 * 対象数が少ない場合は allPool から柔軟に補う。
 */
export function selectWeightedKanji(
  duePool: KanjiItem[],
  newPool: KanjiItem[],
  allPool: KanjiItem[],
  count: number,
  rng: Rng,
): KanjiItem[] {
  const dueTarget = Math.round(count * 0.5)
  const newTarget = Math.round(count * 0.3)
  const randomTarget = Math.max(0, count - dueTarget - newTarget)

  const usedIds = new Set<string>()
  const selected: KanjiItem[] = []

  selected.push(...takeUnique(duePool, dueTarget, usedIds, rng))
  selected.push(...takeUnique(newPool, newTarget, usedIds, rng))
  selected.push(...takeUnique(allPool, randomTarget, usedIds, rng))

  if (selected.length < count) {
    selected.push(...takeUnique(allPool, count - selected.length, usedIds, rng))
  }

  return selected
}

/** 今日の5問・10問チャレンジ・20問テスト・苦手漢字 の各コース向けに問題を生成する。 */
export function generateQuiz(params: GenerateQuizParams): QuizQuestion[] {
  const { kanjiPool, progressMap, count, mode, today, includeHandwriting } = params
  const rng = params.rng ?? Math.random
  const distractorPool = params.distractorPool ?? kanjiPool

  if (kanjiPool.length === 0 || count <= 0) return []

  let candidateKanji: KanjiItem[]
  if (mode === 'weak') {
    candidateKanji = kanjiPool.filter((k) => isWeak(progressMap[k.id]))
    if (candidateKanji.length === 0) return []
    candidateKanji = dedupeById(shuffle(candidateKanji, rng))
  } else {
    const duePool = kanjiPool.filter(
      (k) => isReviewDue(progressMap[k.id], today) || isWeak(progressMap[k.id]),
    )
    const newPool = kanjiPool.filter((k) => isUnstudied(progressMap[k.id]))
    candidateKanji = selectWeightedKanji(duePool, newPool, kanjiPool, count, rng)
    candidateKanji = dedupeById(candidateKanji)
    candidateKanji = padToCount(candidateKanji, kanjiPool, Math.min(count, kanjiPool.length), rng)
  }

  const questions: QuizQuestion[] = []
  const usedKanjiIds = new Set<string>()
  let handwritingBudget = includeHandwriting ? Math.max(1, Math.round(count / 5)) : 0

  const tryBuild = (kanji: KanjiItem): QuizQuestion | null => {
    const ctx: BuildContext = { kanji, pool: distractorPool, rng }
    let typeOrder = shuffle(MULTIPLE_CHOICE_TYPES, rng)
    if (handwritingBudget > 0 && rng() < 0.3) {
      typeOrder = ['handwriting' as QuizQuestionType, ...typeOrder]
    }
    for (const type of typeOrder) {
      const built = buildByType(type, ctx)
      if (built) {
        if (built.type === 'handwriting') handwritingBudget -= 1
        return built
      }
    }
    return null
  }

  for (const kanji of candidateKanji) {
    if (questions.length >= count) break
    const built = tryBuild(kanji)
    if (built) {
      questions.push(built)
      usedKanjiIds.add(kanji.id)
    }
  }

  // 生成に失敗した漢字がある場合は、未使用の漢字で安全に埋め合わせる
  // （苦手漢字モードでは、埋め合わせ候補も苦手漢字プールに限定する）
  if (questions.length < count) {
    const fallbackPool = mode === 'weak' ? candidateKanji : kanjiPool
    const extras = shuffle(
      fallbackPool.filter((k) => !usedKanjiIds.has(k.id)),
      rng,
    )
    for (const kanji of extras) {
      if (questions.length >= count) break
      const built = tryBuild(kanji)
      if (built) {
        questions.push(built)
        usedKanjiIds.add(kanji.id)
      }
    }
  }

  return questions.slice(0, count)
}

export type GenerateHandwritingParams = {
  kanjiPool: KanjiItem[]
  progressMap: ProgressMap
  count: number
  today: string
  rng?: Rng
}

/** 「書き取り練習」コース専用に、すべて type: 'handwriting' の問題を生成する。 */
export function generateHandwritingQuestions(params: GenerateHandwritingParams): QuizQuestion[] {
  const { kanjiPool, progressMap, count, today } = params
  const rng = params.rng ?? Math.random
  if (kanjiPool.length === 0 || count <= 0) return []

  const duePool = kanjiPool.filter(
    (k) => isReviewDue(progressMap[k.id], today) || isWeak(progressMap[k.id]),
  )
  const newPool = kanjiPool.filter((k) => isUnstudied(progressMap[k.id]))

  let candidates = selectWeightedKanji(duePool, newPool, kanjiPool, count, rng)
  candidates = dedupeById(candidates)
  candidates = padToCount(candidates, kanjiPool, Math.min(count, kanjiPool.length), rng)

  const questions: QuizQuestion[] = []
  for (const kanji of candidates) {
    if (questions.length >= count) break
    const built = buildHandwriting({ kanji, pool: kanjiPool, rng })
    if (built) questions.push(built)
  }
  return questions
}
