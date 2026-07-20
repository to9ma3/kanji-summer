import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'

export function CourseSelectPage(): React.JSX.Element {
  const { state } = useAppData()
  const { navigate, back } = useNavigation()
  const goal = state.settings.dailyGoal

  return (
    <div className="page">
      <div className="top-bar">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={back}>
          <span aria-hidden="true">←</span>
        </button>
        <h1 style={{ fontSize: 20 }}>コースを選ぶ</h1>
        <span style={{ width: 44 }} />
      </div>

      <div className="stack">
        <button
          type="button"
          className="card row-between"
          onClick={() => navigate('quiz', { mode: 'daily', count: String(goal) })}
        >
          <span className="row">
            <span aria-hidden="true" style={{ fontSize: 26 }}>
              📖
            </span>
            <span>
              <div style={{ fontWeight: 700 }}>今日の{goal}問</div>
              <div className="text-muted">苦手な漢字を優先して出題します</div>
            </span>
          </span>
        </button>

        <button
          type="button"
          className="card row-between"
          onClick={() => navigate('quiz', { mode: 'challenge', count: '10' })}
        >
          <span className="row">
            <span aria-hidden="true" style={{ fontSize: 26 }}>
              🚀
            </span>
            <span>
              <div style={{ fontWeight: 700 }}>10問チャレンジ</div>
              <div className="text-muted">少し多めに学習します</div>
            </span>
          </span>
        </button>

        <button
          type="button"
          className="card row-between"
          onClick={() => navigate('quiz', { mode: 'test', count: '20' })}
        >
          <span className="row">
            <span aria-hidden="true" style={{ fontSize: 26 }}>
              📝
            </span>
            <span>
              <div style={{ fontWeight: 700 }}>20問テスト</div>
              <div className="text-muted">まとめ学習。結果をくわしく見られます</div>
            </span>
          </span>
        </button>

        <button
          type="button"
          className="card row-between"
          onClick={() => navigate('quiz', { mode: 'weak', count: '10' })}
        >
          <span className="row">
            <span aria-hidden="true" style={{ fontSize: 26 }}>
              🎯
            </span>
            <span>
              <div style={{ fontWeight: 700 }}>苦手漢字</div>
              <div className="text-muted">間違えたことのある漢字を中心に</div>
            </span>
          </span>
        </button>

        <button type="button" className="card row-between" onClick={() => navigate('handwriting')}>
          <span className="row">
            <span aria-hidden="true" style={{ fontSize: 26 }}>
              ✏️
            </span>
            <span>
              <div style={{ fontWeight: 700 }}>書き取り練習</div>
              <div className="text-muted">手書きキャンバスに書いて自己採点</div>
            </span>
          </span>
        </button>

        <button type="button" className="card row-between" onClick={() => navigate('kanjiList')}>
          <span className="row">
            <span aria-hidden="true" style={{ fontSize: 26 }}>
              📚
            </span>
            <span>
              <div style={{ fontWeight: 700 }}>漢字一覧</div>
              <div className="text-muted">95字をいつでも見返せます</div>
            </span>
          </span>
        </button>

        <button type="button" className="card row-between" onClick={() => navigate('progress')}>
          <span className="row">
            <span aria-hidden="true" style={{ fontSize: 26 }}>
              📊
            </span>
            <span>
              <div style={{ fontWeight: 700 }}>学習きろく</div>
              <div className="text-muted">これまでの学習を振り返る</div>
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default CourseSelectPage
