import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievements'
import { formatDateForDisplay, toJstDateString } from '../domain/dateUtils'
import StarBadge from '../components/common/StarBadge'

export function AchievementsPage(): React.JSX.Element {
  const { state } = useAppData()
  const { back } = useNavigation()

  const unlockedMap = new Map(state.achievements.map((a) => [a.id, a.unlockedAt]))

  return (
    <div className="page">
      <div className="top-bar">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={back}>
          <span aria-hidden="true">←</span>
        </button>
        <h1 style={{ fontSize: 20 }}>ごほうび・実績</h1>
        <span style={{ width: 44 }} />
      </div>

      <div className="card row-between">
        <span>これまでに集めた星</span>
        <StarBadge count={state.totalStars} label="合計の星" />
      </div>

      <section className="stack" aria-label="実績一覧">
        {ACHIEVEMENT_DEFINITIONS.map((def) => {
          const unlockedAt = unlockedMap.get(def.id)
          const unlocked = !!unlockedAt
          return (
            <div
              key={def.id}
              className={unlocked ? 'card row-between' : 'card row-between'}
              style={{ opacity: unlocked ? 1 : 0.55 }}
            >
              <div className="row">
                <span aria-hidden="true" style={{ fontSize: 28 }}>
                  {unlocked ? '🏅' : '🔒'}
                </span>
                <span>
                  <div style={{ fontWeight: 700 }}>{def.title}</div>
                  <div className="text-muted">{def.description}</div>
                </span>
              </div>
              {unlocked && unlockedAt ? (
                <span className="badge badge-good">
                  {formatDateForDisplay(toJstDateString(new Date(unlockedAt)))}
                </span>
              ) : (
                <span className="badge badge-muted">未達成</span>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}

export default AchievementsPage
