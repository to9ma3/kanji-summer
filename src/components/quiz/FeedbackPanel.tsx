import { getKanjiById } from '../../data/kanji'
import type { QuizQuestion } from '../../types'

type FeedbackPanelProps = {
  correct: boolean
  question: QuizQuestion
  starsEarned: number
  onNext: () => void
  isLastQuestion: boolean
}

export function FeedbackPanel({
  correct,
  question,
  starsEarned,
  onNext,
  isLastQuestion,
}: FeedbackPanelProps): React.JSX.Element {
  const kanji = getKanjiById(question.kanjiId)

  return (
    <div
      className={`feedback-panel animate-pop ${correct ? 'correct' : 'incorrect'}`}
      role="status"
      aria-live="polite"
    >
      <p className="feedback-title">
        {correct ? (
          <>
            <span aria-hidden="true">⭕</span> せいかい！
          </>
        ) : (
          <>
            <span aria-hidden="true">💦</span> おしい！
          </>
        )}
      </p>

      {!correct ? (
        <p style={{ margin: 0 }}>
          正しい答えは「{question.correctAnswer}」
          {question.reading && question.reading !== question.correctAnswer
            ? `（${question.reading}）`
            : ''}
          です。
        </p>
      ) : null}

      <p style={{ margin: 0, color: 'var(--color-ink)' }}>{question.explanation}</p>
      {!correct && kanji ? (
        <p style={{ margin: 0, color: 'var(--color-ink)' }}>ヒント：{kanji.hint}</p>
      ) : null}

      {starsEarned > 0 ? (
        <p className="row" style={{ margin: 0 }}>
          <span aria-hidden="true">⭐</span> {starsEarned}個ゲット！
        </p>
      ) : null}

      <button type="button" className="btn btn-primary btn-block" onClick={onNext}>
        {isLastQuestion ? 'けっかを見る' : '次へ'}
      </button>
    </div>
  )
}

export default FeedbackPanel
