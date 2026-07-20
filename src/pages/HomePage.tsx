import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import { todayJst, formatDateForDisplay } from '../domain/dateUtils'
import { computeCurrentStreak, computeWeakKanjiIds } from '../domain/progressCalculator'
import StarBadge from '../components/common/StarBadge'
import InstallGuide from '../components/pwa/InstallGuide'

export function HomePage(): React.JSX.Element {
  const { state } = useAppData()
  const { navigate } = useNavigation()
  const today = todayJst()
  const todayRecord = state.dailyHistory[today]
  const streak = computeCurrentStreak(state.dailyHistory, today)
  const weakCount = computeWeakKanjiIds(state.progress).length
  const goal = state.settings.dailyGoal

  const todayAttempts = todayRecord?.attempts ?? 0
  const todayStatusText =
    todayAttempts === 0
      ? 'まだ学習していません'
      : todayAttempts >= goal
        ? `今日の目標(${goal}問)を達成しました！`
        : `${todayAttempts}問 / ${goal}問`

  return (
    <div className="page">
      <header className="stack">
        <div className="row-between">
          <div>
            <h1>夏休み漢字たんけん</h1>
            <p className="text-muted" style={{ margin: 0 }}>
              小学3年生・1学期
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="保護者設定を開く"
            onClick={() => navigate('parent')}
          >
            <span aria-hidden="true">⚙️</span>
          </button>
        </div>
      </header>

      <section className="card row-between" aria-label="今日の状況">
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>{state.settings.nickname} さん、こんにちは！</p>
          <p className="text-muted" style={{ margin: 0 }}>
            {formatDateForDisplay(today)}
          </p>
        </div>
        <StarBadge count={state.totalStars} label="獲得した星" />
      </section>

      <section className="card stack" aria-label="今日の学習状況">
        <div className="row-between">
          <span>今日の学習</span>
          <span className="badge badge-good">{todayStatusText}</span>
        </div>
        <div className="row-between">
          <span>連続学習日数</span>
          <span className="badge badge-muted" aria-label={`連続${streak}日`}>
            🔥 {streak}日
          </span>
        </div>
      </section>

      <button
        type="button"
        className="btn btn-primary btn-hero btn-block"
        onClick={() => navigate('quiz', { mode: 'daily', count: String(goal) })}
      >
        📖 今日の{goal}問をはじめる
      </button>

      <nav className="menu-grid" aria-label="学習メニュー">
        <button type="button" className="menu-tile" onClick={() => navigate('courseSelect')}>
          <span className="menu-tile-icon" aria-hidden="true">
            🗺️
          </span>
          <span className="menu-tile-label">コースを選ぶ</span>
          <span className="menu-tile-sub">10問チャレンジなど</span>
        </button>
        <button
          type="button"
          className="menu-tile"
          onClick={() => navigate('quiz', { mode: 'weak', count: '10' })}
        >
          <span className="menu-tile-icon" aria-hidden="true">
            🎯
          </span>
          <span className="menu-tile-label">苦手漢字</span>
          <span className="menu-tile-sub">
            {weakCount > 0 ? `${weakCount}字あります` : '今はありません'}
          </span>
        </button>
        <button type="button" className="menu-tile" onClick={() => navigate('handwriting')}>
          <span className="menu-tile-icon" aria-hidden="true">
            ✏️
          </span>
          <span className="menu-tile-label">書き取り練習</span>
        </button>
        <button type="button" className="menu-tile" onClick={() => navigate('progress')}>
          <span className="menu-tile-icon" aria-hidden="true">
            📊
          </span>
          <span className="menu-tile-label">学習きろく</span>
        </button>
        <button type="button" className="menu-tile" onClick={() => navigate('kanjiList')}>
          <span className="menu-tile-icon" aria-hidden="true">
            📚
          </span>
          <span className="menu-tile-label">漢字一覧</span>
        </button>
        <button type="button" className="menu-tile" onClick={() => navigate('achievements')}>
          <span className="menu-tile-icon" aria-hidden="true">
            🏆
          </span>
          <span className="menu-tile-label">ごほうび・実績</span>
        </button>
      </nav>

      <InstallGuide />
    </div>
  )
}

export default HomePage
