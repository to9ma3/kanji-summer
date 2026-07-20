import { useRef, useState } from 'react'
import type { QuizQuestion } from '../../types'
import { HandwritingCanvas, type HandwritingCanvasHandle } from './HandwritingCanvas'

type HandwritingQuestionCardProps = {
  question: QuizQuestion
  onGraded: (correct: boolean) => void
}

/**
 * 書き取り問題カード。OCRや書き順の自動判定は行わず、
 * 自分で答えを確認してから「できた／もう一度」を選ぶ自己採点方式。
 *
 * 問題が変わるたびに内部状態をリセットする必要があるため、呼び出し側で
 * `key={question.id}` を指定してコンポーネントごと再マウントさせる前提の実装にしている
 * （useEffect でのリセットは avoid し、キーによる自然なリセットを使う）。
 */
export function HandwritingQuestionCard({
  question,
  onGraded,
}: HandwritingQuestionCardProps): React.JSX.Element {
  const canvasRef = useRef<HandwritingCanvasHandle>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showModel, setShowModel] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)

  return (
    <div className="card stack">
      <p className="question-prompt">{question.prompt}</p>
      <p className="text-muted text-center" style={{ margin: 0 }}>
        じぶんで「できた」「もう一度」をえらぶ、自己採点の問題だよ。
      </p>

      {showModel && question.handwritingTarget ? (
        <p className="question-kanji text-center" aria-live="polite">
          {question.handwritingTarget}
        </p>
      ) : null}

      <HandwritingCanvas
        ref={canvasRef}
        ariaLabel={`「${question.reading ?? ''}」を書くための手書きキャンバス。指、マウス、Apple Pencilで書けます。`}
        onDrawingChange={setHasDrawing}
      />

      <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => canvasRef.current?.undo()}
          disabled={!hasDrawing}
        >
          1画戻す
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => canvasRef.current?.clear()}
          disabled={!hasDrawing}
        >
          全消去
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setShowModel((v) => !v)}>
          {showModel ? 'お手本をかくす' : 'お手本を見る'}
        </button>
      </div>

      {!showAnswer ? (
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => setShowAnswer(true)}
        >
          答えを見る
        </button>
      ) : (
        <div className="stack" role="status" aria-live="polite">
          <p className="text-center" style={{ fontWeight: 700, fontSize: 18 }}>
            答え：{question.handwritingTarget}
            <span className="text-muted">（{question.reading}）</span>
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={() => onGraded(true)}>
              できた
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onGraded(false)}>
              もう一度
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HandwritingQuestionCard
