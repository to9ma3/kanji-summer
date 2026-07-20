import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import { todayJst, formatDateForDisplay } from '../domain/dateUtils'
import { computeLearningStats } from '../domain/progressCalculator'
import { getKanjiById } from '../data/kanji'

export function ProgressPage(): React.JSX.Element {
  const { state } = useAppData()
  const { navigate, back } = useNavigation()
  const today = todayJst()
  const stats = computeLearningStats(state.dailyHistory, state.progress, today)

  const recentDays = Object.values(state.dailyHistory)
    .filter((d) => d.attempts > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7)

  const weakKanji = stats.weakKanjiIds
    .map((id) => getKanjiById(id))
    .filter((k): k is NonNullable<typeof k> => !!k)

  return (
    <div className="page">
      <div className="top-bar">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={back}>
          <span aria-hidden="true">←</span>
        </button>
        <h1 style={{ fontSize: 20 }}>学習きろく</h1>
        <span style={{ width: 44 }} />
      </div>

      <div className="menu-grid">
        <div className="card-flat stack">
          <span className="text-muted">学習日数</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>{stats.totalDaysStudied}日</span>
        </div>
        <div className="card-flat stack">
          <span className="text-muted">連続学習日数</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>{stats.currentStreak}日</span>
        </div>
        <div className="card-flat stack">
          <span className="text-muted">累計問題数</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>{stats.totalQuestionsAnswered}問</span>
        </div>
        <div className="card-flat stack">
          <span className="text-muted">正解率</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>{Math.round(stats.accuracy * 100)}%</span>
        </div>
        <div className="card-flat stack">
          <span className="text-muted">マスターした漢字</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>{stats.masteredKanjiIds.length}字</span>
        </div>
        <div className="card-flat stack">
          <span className="text-muted">星の合計</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>⭐ {state.totalStars}</span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => navigate('calendar')}
      >
        📅 夏休みカレンダーを見る
      </button>

      <section className="card stack" aria-label="苦手な漢字">
        <h2 style={{ fontSize: 16 }}>苦手な漢字</h2>
        {weakKanji.length === 0 ? (
          <p className="text-muted" style={{ margin: 0 }}>
            今のところ苦手な漢字はありません。よくがんばっています！
          </p>
        ) : (
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {weakKanji.map((k) => (
              <span key={k.id} className="badge badge-muted" style={{ fontSize: 18 }}>
                {k.kanji}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="card stack" aria-label="最近の学習">
        <h2 style={{ fontSize: 16 }}>最近の学習（直近7日）</h2>
        {recentDays.length === 0 ? (
          <p className="text-muted" style={{ margin: 0 }}>
            まだ学習記録がありません。
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {recentDays.map((day) => (
              <li
                key={day.date}
                className="row-between"
                style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}
              >
                <span>{formatDateForDisplay(day.date)}</span>
                <span className="text-muted">
                  {day.attempts}問中{day.correct}問正解・⭐{day.starsEarned}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ProgressPage
