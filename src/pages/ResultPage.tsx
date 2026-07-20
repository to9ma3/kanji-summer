import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import { useQuizSession } from '../context/QuizSessionContext'
import { getKanjiById } from '../data/kanji'
import { formatDateForDisplay } from '../domain/dateUtils'
import StarBadge from '../components/common/StarBadge'

export function ResultPage(): React.JSX.Element {
  const { navigate } = useNavigation()
  const { session, lastResult, resetSession } = useQuizSession()
  const { state } = useAppData()

  if (session.status !== 'finished' || session.answers.length === 0) {
    return (
      <div className="page">
        <p className="text-muted text-center">結果を読み込めませんでした。</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('home')}>
          ホームへ戻る
        </button>
      </div>
    )
  }

  const total = session.answers.length
  const correctCount = session.answers.filter((a) => a.correct).length
  const selfCorrectCount = session.answers.filter((a) => a.correct && !a.usedHint).length
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const wrongKanji = session.answers
    .filter((a) => !a.correct)
    .map((a) => getKanjiById(a.question.kanjiId))
    .filter((k): k is NonNullable<typeof k> => !!k)
  const newlyMasteredKanji = (lastResult?.newlyMasteredKanjiIds ?? [])
    .map((id) => getKanjiById(id))
    .filter((k): k is NonNullable<typeof k> => !!k)
  const starsEarned = lastResult?.starsEarnedThisSession ?? 0
  const isPerfect = total > 0 && correctCount === total

  const touchedKanjiIds = [...new Set(session.answers.map((a) => a.question.kanjiId))]
  const nextReviewDates = touchedKanjiIds
    .map((id) => state.progress[id]?.nextReviewAt)
    .filter((d): d is string => !!d)
    .sort()
  const soonestReview = nextReviewDates[0]

  const handleRetry = (): void => {
    const mode = session.mode ?? 'daily'
    const count = session.questions.length
    resetSession()
    navigate('quiz', { mode, count: String(count) })
  }

  return (
    <div className="page">
      <div className={isPerfect ? 'card stack text-center animate-pop' : 'card stack text-center'}>
        {isPerfect ? (
          <span aria-hidden="true" style={{ fontSize: 44 }}>
            🎉
          </span>
        ) : (
          <span aria-hidden="true" style={{ fontSize: 44 }}>
            🏁
          </span>
        )}
        <h1>{isPerfect ? 'ぜんもんせいかい！' : 'おつかれさま！'}</h1>
        <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
          {total}問中 {correctCount}問 正解（{accuracy}%）
        </p>
        <StarBadge count={starsEarned} label="今回獲得した星" />
      </div>

      <div className="card stack">
        <div className="row-between">
          <span>自力正解数</span>
          <span className="badge badge-good">{selfCorrectCount}問</span>
        </div>
        {soonestReview ? (
          <div className="row-between">
            <span>次回復習予定</span>
            <span className="badge badge-muted">{formatDateForDisplay(soonestReview)}</span>
          </div>
        ) : null}
      </div>

      {newlyMasteredKanji.length > 0 ? (
        <section className="card stack" aria-label="新しくマスターした漢字">
          <h2 style={{ fontSize: 16 }}>✨ 新しくマスターした漢字</h2>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {newlyMasteredKanji.map((k) => (
              <span key={k.id} className="badge badge-good" style={{ fontSize: 18 }}>
                {k.kanji}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {wrongKanji.length > 0 ? (
        <section className="card stack" aria-label="間違えた漢字">
          <h2 style={{ fontSize: 16 }}>もう少し練習する漢字</h2>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {wrongKanji.map((k) => (
              <span key={k.id} className="badge badge-muted" style={{ fontSize: 18 }}>
                {k.kanji}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="stack">
        <button type="button" className="btn btn-primary btn-hero btn-block" onClick={handleRetry}>
          もう一度
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => {
            resetSession()
            navigate('home')
          }}
        >
          ホームへ戻る
        </button>
      </div>
    </div>
  )
}

export default ResultPage
