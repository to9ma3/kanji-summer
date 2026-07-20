import { KANJI_LIST, KANJI_GROUP_COUNT, getKanjiByGroup } from '../../data/kanji'

type KanjiSelectionPanelProps = {
  enabledIds: string[]
  onChange: (nextEnabledIds: string[]) => void
}

export function KanjiSelectionPanel({
  enabledIds,
  onChange,
}: KanjiSelectionPanelProps): React.JSX.Element {
  const enabledSet = new Set(enabledIds)

  const toggleOne = (id: string): void => {
    const next = new Set(enabledSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  const selectAll = (): void => onChange(KANJI_LIST.map((k) => k.id))
  const deselectAll = (): void => onChange([])
  const resetToDefault = (): void =>
    onChange(KANJI_LIST.filter((k) => k.enabledByDefault).map((k) => k.id))

  const toggleGroup = (group: number, enable: boolean): void => {
    const groupIds = new Set(getKanjiByGroup(group).map((k) => k.id))
    const next = new Set(enabledSet)
    if (enable) {
      for (const id of groupIds) next.add(id)
    } else {
      for (const id of groupIds) next.delete(id)
    }
    onChange([...next])
  }

  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" onClick={selectAll}>
          すべて選択
        </button>
        <button type="button" className="btn btn-secondary" onClick={deselectAll}>
          すべて解除
        </button>
        <button type="button" className="btn btn-ghost" onClick={resetToDefault}>
          初期状態へ戻す
        </button>
      </div>
      <p className="text-muted" style={{ margin: 0 }}>
        {enabledIds.length} / {KANJI_LIST.length} 字が出題対象です。
      </p>

      {Array.from({ length: KANJI_GROUP_COUNT }, (_, i) => i + 1).map((group) => {
        const groupKanji = getKanjiByGroup(group)
        const allEnabled = groupKanji.every((k) => enabledSet.has(k.id))
        return (
          <div key={group} className="card-flat stack">
            <div className="row-between">
              <span style={{ fontWeight: 700 }}>グループ{group}</span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => toggleGroup(group, !allEnabled)}
              >
                {allEnabled ? 'グループを解除' : 'グループを選択'}
              </button>
            </div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {groupKanji.map((k) => {
                const enabled = enabledSet.has(k.id)
                return (
                  <button
                    key={k.id}
                    type="button"
                    className={enabled ? 'kanji-tile' : 'kanji-tile is-disabled'}
                    style={{ width: 44, height: 44, fontSize: 20 }}
                    aria-pressed={enabled}
                    aria-label={`${k.kanji}を${enabled ? '出題対象から外す' : '出題対象にする'}`}
                    onClick={() => toggleOne(k.id)}
                  >
                    {k.kanji}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KanjiSelectionPanel
