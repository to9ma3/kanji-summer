import { useId, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import type { DailyQuestionCount } from '../types'

const QUESTION_COUNT_OPTIONS: DailyQuestionCount[] = [5, 10, 20]

export function SetupPage(): React.JSX.Element {
  const { state, updateSettings } = useAppData()
  const [nickname, setNickname] = useState(state.settings.nickname)
  const [dailyQuestionCount, setDailyQuestionCount] = useState<DailyQuestionCount>(
    state.settings.dailyQuestionCount,
  )
  const [soundEnabled, setSoundEnabled] = useState(state.settings.soundEnabled)
  const [summerStart, setSummerStart] = useState(state.settings.summerStart)
  const [summerEnd, setSummerEnd] = useState(state.settings.summerEnd)

  const nicknameId = useId()
  const startId = useId()
  const endId = useId()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const trimmedNickname = nickname.trim() || 'たんけんたい'
    updateSettings({
      nickname: trimmedNickname,
      dailyQuestionCount,
      dailyGoal: dailyQuestionCount,
      soundEnabled,
      summerStart,
      summerEnd,
      hasCompletedSetup: true,
    })
  }

  return (
    <div className="page">
      <header className="page-header stack">
        <span aria-hidden="true" style={{ fontSize: 40 }}>
          🏝️
        </span>
        <h1>夏休み漢字たんけんへようこそ</h1>
        <p className="text-muted">
          はじめに、かんたんな設定をしよう。あとから保護者設定で変更できます。
        </p>
      </header>

      <form className="card stack" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor={nicknameId}>ニックネーム</label>
          <input
            id={nicknameId}
            type="text"
            value={nickname}
            maxLength={10}
            placeholder="たんけんたい"
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="off"
          />
          <span className="form-hint">名前や住所などの個人情報は入力しないでね。</span>
        </div>

        <fieldset className="form-field" style={{ border: 'none', padding: 0 }}>
          <legend style={{ fontWeight: 700, marginBottom: 4 }}>1日の標準問題数</legend>
          <div className="row" role="radiogroup" aria-label="1日の標準問題数">
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                role="radio"
                aria-checked={dailyQuestionCount === count}
                className={dailyQuestionCount === count ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => setDailyQuestionCount(count)}
              >
                {count}問
              </button>
            ))}
          </div>
        </fieldset>

        <div className="toggle-row">
          <label htmlFor="setup-sound">効果音</label>
          <input
            id="setup-sound"
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={startId}>夏休み開始日</label>
          <input
            id={startId}
            type="date"
            value={summerStart}
            onChange={(e) => setSummerStart(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor={endId}>夏休み終了日</label>
          <input
            id={endId}
            type="date"
            value={summerEnd}
            onChange={(e) => setSummerEnd(e.target.value)}
          />
        </div>

        <p className="form-hint">
          出題する漢字は、はじめは95字すべてです。あとから保護者設定で選べます。
        </p>

        <button type="submit" className="btn btn-primary btn-hero btn-block">
          はじめる
        </button>
      </form>
    </div>
  )
}

export default SetupPage
