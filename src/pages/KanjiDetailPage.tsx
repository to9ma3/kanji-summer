import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import { getKanjiById } from '../data/kanji'
import { formatDateForDisplay } from '../domain/dateUtils'
import { isMastered, isWeak } from '../domain/spacedRepetition'

export function KanjiDetailPage(): React.JSX.Element {
  const { current, back } = useNavigation()
  const { state } = useAppData()
  const kanjiId = current.params.kanjiId
  const kanji = kanjiId ? getKanjiById(kanjiId) : undefined

  if (!kanji) {
    return (
      <div className="page">
        <p className="text-muted text-center">漢字が見つかりませんでした。</p>
        <button type="button" className="btn btn-primary" onClick={back}>
          戻る
        </button>
      </div>
    )
  }

  const progress = state.progress[kanji.id]
  const accuracy =
    progress && progress.attempts > 0
      ? Math.round((progress.correct / progress.attempts) * 100)
      : null
  const mastered = isMastered(progress)
  const weak = isWeak(progress)

  return (
    <div className="page">
      <div className="top-bar">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={back}>
          <span aria-hidden="true">←</span>
        </button>
        <h1 style={{ fontSize: 20 }}>漢字の詳細</h1>
        <span style={{ width: 44 }} />
      </div>

      <div className="card stack text-center">
        <p className="question-kanji" style={{ fontSize: 64 }}>
          {kanji.kanji}
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          {mastered ? <span className="badge badge-good">マスター済み</span> : null}
          {!mastered && weak ? (
            <span
              className="badge badge-bad"
              style={{ background: 'var(--color-bad-bg)', color: 'var(--color-bad)' }}
            >
              苦手
            </span>
          ) : null}
        </div>
      </div>

      <section className="card stack" aria-label="読み方">
        <h2 style={{ fontSize: 16 }}>読み方</h2>
        {kanji.onyomi.length > 0 ? (
          <p style={{ margin: 0 }}>音読み：{kanji.onyomi.join('、')}</p>
        ) : null}
        {kanji.kunyomi.length > 0 ? (
          <p style={{ margin: 0 }}>訓読み：{kanji.kunyomi.join('、')}</p>
        ) : null}
      </section>

      <section className="card stack" aria-label="単語">
        <h2 style={{ fontSize: 16 }}>単語</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {kanji.words.map((w) => (
            <li key={w.word}>
              {w.word}（{w.reading}）{w.meaning ? ` … ${w.meaning}` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack" aria-label="例文">
        <h2 style={{ fontSize: 16 }}>例文</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {kanji.exampleSentences.map((s) => (
            <li key={s.text}>{s.text}</li>
          ))}
        </ul>
      </section>

      <section className="card stack" aria-label="ヒント">
        <h2 style={{ fontSize: 16 }}>ヒント</h2>
        <p style={{ margin: 0 }}>{kanji.hint}</p>
      </section>

      {progress && progress.attempts > 0 ? (
        <section className="card stack" aria-label="学習状況">
          <h2 style={{ fontSize: 16 }}>学習状況</h2>
          <div className="row-between">
            <span>解答回数</span>
            <span>{progress.attempts}回</span>
          </div>
          <div className="row-between">
            <span>正解率</span>
            <span>{accuracy}%</span>
          </div>
          <div className="row-between">
            <span>習熟レベル</span>
            <span>{progress.masteryLevel} / 5</span>
          </div>
          {progress.nextReviewAt ? (
            <div className="row-between">
              <span>次回復習予定</span>
              <span>{formatDateForDisplay(progress.nextReviewAt)}</span>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="text-muted text-center">まだ学習していません。</p>
      )}
    </div>
  )
}

export default KanjiDetailPage
