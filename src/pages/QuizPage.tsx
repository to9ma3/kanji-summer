import { useEffect, useRef, useState } from 'react'
import { useNavigation } from '../context/NavigationContext'
import { useQuizSession } from '../context/QuizSessionContext'
import { useAppData } from '../context/AppDataContext'
import { playCorrectSound, playIncorrectSound, playCompleteSound } from '../services/audio'
import ChoiceQuestionCard from '../components/quiz/ChoiceQuestionCard'
import FeedbackPanel from '../components/quiz/FeedbackPanel'
import HandwritingQuestionCard from '../components/handwriting/HandwritingQuestionCard'
import type { QuizAnswerRecord } from '../types'

const MODE_LABEL: Record<string, string> = {
  daily: '今日の問題',
  challenge: '10問チャレンジ',
  test: '20問テスト',
  weak: '苦手漢字',
}

export function QuizPage(): React.JSX.Element {
  const { current, navigate, back } = useNavigation()
  const { session, startSession, submitAnswer, goToNextQuestion, finishSession } = useQuizSession()
  const { state } = useAppData()
  const startedRef = useRef(false)
  const [startFailed, setStartFailed] = useState(false)
  const [pendingAnswer, setPendingAnswer] = useState<QuizAnswerRecord | null>(null)

  const mode = (current.params.mode ?? 'daily') as 'daily' | 'challenge' | 'test' | 'weak'
  const count = Number(current.params.count ?? state.settings.dailyGoal)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    const ok = startSession({ mode, count })
    // 生成に失敗した場合（苦手漢字が0件など）だけ、前向きな案内を表示するために状態を更新する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!ok) setStartFailed(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (startFailed) {
    return (
      <div className="page">
        <div className="card stack text-center">
          <span aria-hidden="true" style={{ fontSize: 40 }}>
            🌟
          </span>
          <h1>苦手な漢字はありません！</h1>
          <p>今のところ、苦手な漢字は見つかりませんでした。よくがんばっています。</p>
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

  const handleChoiceSelect = (choice: string): void => {
    if (pendingAnswer) return
    const record = submitAnswer(choice, false)
    setPendingAnswer(record)
    if (record.correct) playCorrectSound(state.settings.soundEnabled)
    else playIncorrectSound(state.settings.soundEnabled)
  }

  const handleHandwritingGraded = (correct: boolean): void => {
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
        <span className="text-muted">{MODE_LABEL[mode] ?? '問題'}</span>
        <span className="badge badge-muted">
          {session.currentIndex + 1} / {session.questions.length}
        </span>
      </div>

      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={session.currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={session.questions.length}
        aria-label="問題の進み具合"
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${((session.currentIndex + 1) / session.questions.length) * 100}%` }}
        />
      </div>

      {question.type === 'handwriting' ? (
        !pendingAnswer ? (
          <HandwritingQuestionCard
            key={question.id}
            question={question}
            onGraded={handleHandwritingGraded}
          />
        ) : null
      ) : (
        <ChoiceQuestionCard
          question={question}
          disabled={!!pendingAnswer}
          selectedAnswer={pendingAnswer?.userAnswer ?? null}
          onSelect={handleChoiceSelect}
        />
      )}

      {pendingAnswer ? (
        <FeedbackPanel
          correct={pendingAnswer.correct}
          question={pendingAnswer.question}
          starsEarned={pendingAnswer.starsEarned}
          onNext={handleNext}
          isLastQuestion={isLastQuestion}
        />
      ) : null}
    </div>
  )
}

export default QuizPage
