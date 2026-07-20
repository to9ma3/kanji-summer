import { useEffect, useRef, useState } from 'react'
import { useNavigation } from '../context/NavigationContext'
import { useQuizSession } from '../context/QuizSessionContext'
import { useAppData } from '../context/AppDataContext'
import { playCompleteSound, playCorrectSound, playIncorrectSound } from '../services/audio'
import HandwritingQuestionCard from '../components/handwriting/HandwritingQuestionCard'
import type { QuizAnswerRecord } from '../types'

const HANDWRITING_SET_SIZE = 5

export function HandwritingPage(): React.JSX.Element {
  const { navigate, back } = useNavigation()
  const { session, startHandwritingSession, submitAnswer, goToNextQuestion, finishSession } =
    useQuizSession()
  const { state } = useAppData()
  const startedRef = useRef(false)
  const [startFailed, setStartFailed] = useState(false)
  const [pendingAnswer, setPendingAnswer] = useState<QuizAnswerRecord | null>(null)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    const ok = startHandwritingSession(HANDWRITING_SET_SIZE)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!ok) setStartFailed(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (startFailed) {
    return (
      <div className="page">
        <div className="card stack text-center">
          <h1>書き取り練習</h1>
          <p>出題できる漢字が見つかりませんでした。保護者設定で出題漢字を確認してください。</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('home')}>
            ホームへ戻る
          </button>
        </div>
      </div>
    )
  }

  if (session.status !== 'in-progress' || session.questions.length === 0) {
    return (
      <div className="page">
        <p className="text-center text-muted">問題を用意しています…</p>
      </div>
    )
  }

  const question = session.questions[session.currentIndex]
  if (!question) {
    return (
      <div className="page">
        <p className="text-center text-muted">問題を用意しています…</p>
      </div>
    )
  }
  const isLastQuestion = session.currentIndex === session.questions.length - 1

  const handleGraded = (correct: boolean): void => {
    if (pendingAnswer) return
    const record = submitAnswer(correct ? question.correctAnswer : '', false)
    setPendingAnswer(record)
    if (record.correct) playCorrectSound(state.settings.soundEnabled)
    else playIncorrectSound(state.settings.soundEnabled)
  }

  const handleNext = (): void => {
    setPendingAnswer(null)
    if (isLastQuestion) {
      finishSession()
      playCompleteSound(state.settings.soundEnabled)
      navigate('result')
    } else {
      goToNextQuestion()
    }
  }

  return (
    <div className="page">
      <div className="top-bar">
        <button type="button" className="icon-btn" aria-label="やめて戻る" onClick={back}>
          <span aria-hidden="true">✕</span>
        </button>
        <span className="text-muted">書き取り練習</span>
        <span className="badge badge-muted">
          {session.currentIndex + 1} / {session.questions.length}
        </span>
      </div>

      {!pendingAnswer ? (
        <HandwritingQuestionCard key={question.id} question={question} onGraded={handleGraded} />
      ) : (
        <div
          className={`feedback-panel animate-pop ${pendingAnswer.correct ? 'correct' : 'incorrect'}`}
          role="status"
          aria-live="polite"
        >
          <p className="feedback-title">
            {pendingAnswer.correct ? (
              <>
                <span aria-hidden="true">⭕</span> よくできました！
              </>
            ) : (
              <>
                <span aria-hidden="true">💪</span> また練習しよう！
              </>
            )}
          </p>
          {pendingAnswer.starsEarned > 0 ? (
            <p className="row" style={{ margin: 0 }}>
              <span aria-hidden="true">⭐</span> {pendingAnswer.starsEarned}個ゲット！
            </p>
          ) : null}
          <button type="button" className="btn btn-primary btn-block" onClick={handleNext}>
            {isLastQuestion ? 'けっかを見る' : '次へ'}
          </button>
        </div>
      )}
    </div>
  )
}

export default HandwritingPage
