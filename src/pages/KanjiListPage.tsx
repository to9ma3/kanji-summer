import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import { KANJI_LIST } from '../data/kanji'
import { isMastered, isWeak } from '../domain/spacedRepetition'

type FilterKey = 'all' | 'weak' | 'mastered' | 'unstudied'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'weak', label: '苦手のみ' },
  { key: 'mastered', label: 'マスター済み' },
  { key: 'unstudied', label: '未学習' },
]

export function KanjiListPage(): React.JSX.Element {
  const { state } = useAppData()
  const { navigate, back } = useNavigation()
  const [filter, setFilter] = useState<FilterKey>('all')
  const enabledIds = useMemo(
    () => new Set(state.settings.enabledKanjiIds),
    [state.settings.enabledKanjiIds],
  )

  const filteredKanji = KANJI_LIST.filter((kanji) => {
    const progress = state.progress[kanji.id]
    switch (filter) {
      case 'weak':
        return isWeak(progress)
      case 'mastered':
        return isMastered(progress)
      case 'unstudied':
        return !progress || progress.attempts === 0
      default:
        return true
    }
  })

  return (
    <div className="page">
      <div className="top-bar">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={back}>
          <span aria-hidden="true">←</span>
        </button>
        <h1 style={{ fontSize: 20 }}>漢字一覧</h1>
        <span style={{ width: 44 }} />
      </div>

      <div className="row" role="group" aria-label="絞り込み" style={{ flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={filter === f.key ? 'btn btn-primary' : 'btn btn-secondary'}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-muted" style={{ margin: 0 }}>
        {filteredKanji.length}字 表示中
      </p>

      <div className="kanji-grid" role="group" aria-label="漢字一覧">
        {filteredKanji.map((kanji) => {
          const progress = state.progress[kanji.id]
          const mastered = isMastered(progress)
          const weak = isWeak(progress)
          const disabled = !enabledIds.has(kanji.id)
          const className = [
            'kanji-tile',
            mastered ? 'is-mastered' : '',
            !mastered && weak ? 'is-weak' : '',
            disabled ? 'is-disabled' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={kanji.id}
              type="button"
              className={className}
              aria-label={`${kanji.kanji}${mastered ? '（マスター済み）' : weak ? '（苦手）' : ''}${disabled ? '（出題対象外）' : ''}`}
              onClick={() => navigate('kanjiDetail', { kanjiId: kanji.id })}
            >
              {kanji.kanji}
            </button>
          )
        })}
      </div>

      {filteredKanji.length === 0 ? (
        <p className="text-center text-muted">あてはまる漢字はありません。</p>
      ) : null}
    </div>
  )
}

export default KanjiListPage
