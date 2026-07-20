import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import { useParentGate } from '../context/ParentGateContext'
import PinGate from '../components/parent/PinGate'
import KanjiSelectionPanel from '../components/parent/KanjiSelectionPanel'
import { todayJst } from '../domain/dateUtils'
import { computeLearningStats } from '../domain/progressCalculator'
import { getKanjiById } from '../data/kanji'
import type { DailyQuestionCount } from '../types'

const QUESTION_COUNT_OPTIONS: DailyQuestionCount[] = [5, 10, 20]

function ParentPageContent(): React.JSX.Element {
  const { state, updateSettings } = useAppData()
  const { navigate, back } = useNavigation()
  const { lock } = useParentGate()
  const [pinDraft, setPinDraft] = useState('')
  const [pinMessage, setPinMessage] = useState<string | null>(null)

  const today = todayJst()
  const stats = computeLearningStats(state.dailyHistory, state.progress, today)
  const weakKanji = stats.weakKanjiIds
    .map((id) => getKanjiById(id))
    .filter((k): k is NonNullable<typeof k> => !!k)

  const handleSetPin = (): void => {
    if (!/^\d{4}$/.test(pinDraft)) {
      setPinMessage('PINは数字4桁で入力してください。')
      return
    }
    updateSettings({ parentPin: pinDraft })
    setPinDraft('')
    setPinMessage('PINを設定しました。')
  }

  const handleClearPin = (): void => {
    updateSettings({ parentPin: null })
    setPinMessage('PINを解除しました。')
  }

  return (
    <div className="page">
      <div className="top-bar">
        <button
          type="button"
          className="icon-btn"
          aria-label="戻る"
          onClick={() => {
            lock()
            back()
          }}
        >
          <span aria-hidden="true">←</span>
        </button>
        <h1 style={{ fontSize: 20 }}>保護者設定</h1>
        <span style={{ width: 44 }} />
      </div>

      <section className="card stack" aria-label="基本設定">
        <h2 style={{ fontSize: 16 }}>基本設定</h2>
        <div className="form-field">
          <label htmlFor="parent-nickname">ニックネーム</label>
          <input
            id="parent-nickname"
            type="text"
            value={state.settings.nickname}
            maxLength={10}
            onChange={(e) => updateSettings({ nickname: e.target.value })}
          />
        </div>

        <div className="form-field">
          <span style={{ fontWeight: 700 }}>1日の標準問題数</span>
          <div className="row">
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                className={
                  state.settings.dailyQuestionCount === count
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }
                aria-pressed={state.settings.dailyQuestionCount === count}
                onClick={() => updateSettings({ dailyQuestionCount: count })}
              >
                {count}問
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="parent-daily-goal">学習目標（1日に解く問題数の目標）</label>
          <input
            id="parent-daily-goal"
            type="number"
            min={1}
            max={200}
            value={state.settings.dailyGoal}
            onChange={(e) =>
              updateSettings({ dailyGoal: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor="parent-summer-start">夏休み開始日</label>
          <input
            id="parent-summer-start"
            type="date"
            value={state.settings.summerStart}
            onChange={(e) => updateSettings({ summerStart: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="parent-summer-end">夏休み終了日</label>
          <input
            id="parent-summer-end"
            type="date"
            value={state.settings.summerEnd}
            onChange={(e) => updateSettings({ summerEnd: e.target.value })}
          />
        </div>

        <div className="toggle-row">
          <label htmlFor="parent-sound">効果音</label>
          <input
            id="parent-sound"
            type="checkbox"
            checked={state.settings.soundEnabled}
            onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
          />
        </div>
        <div className="toggle-row">
          <label htmlFor="parent-reduce-motion">アニメーション抑制</label>
          <input
            id="parent-reduce-motion"
            type="checkbox"
            checked={state.settings.reduceMotion}
            onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
          />
        </div>
        <div className="toggle-row">
          <label htmlFor="parent-handwriting-mix">書き取り問題を通常問題に含める</label>
          <input
            id="parent-handwriting-mix"
            type="checkbox"
            checked={state.settings.includeHandwritingInRegularQuiz}
            onChange={(e) => updateSettings({ includeHandwritingInRegularQuiz: e.target.checked })}
          />
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => updateSettings({ hasSeenInstallGuide: false })}
        >
          初期説明を再表示する
        </button>
      </section>

      <section className="card stack" aria-label="対象漢字の選択">
        <h2 style={{ fontSize: 16 }}>対象漢字の選択</h2>
        <KanjiSelectionPanel
          enabledIds={state.settings.enabledKanjiIds}
          onChange={(ids) => updateSettings({ enabledKanjiIds: ids })}
        />
      </section>

      <section className="card stack" aria-label="保護者用PIN">
        <h2 style={{ fontSize: 16 }}>保護者用PIN</h2>
        <p className="form-hint">
          4桁のPINで、お子さまが保護者設定を誤って変更しないようにできます。暗号のような強いセキュリティではありません。
        </p>
        <div className="form-field">
          <label htmlFor="parent-pin-draft">
            {state.settings.parentPin ? '新しいPIN（変更する場合）' : 'PINを設定する'}
          </label>
          <input
            id="parent-pin-draft"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pinDraft}
            onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={handleSetPin}>
            PINを保存
          </button>
          {state.settings.parentPin ? (
            <button type="button" className="btn btn-secondary" onClick={handleClearPin}>
              PINを解除
            </button>
          ) : null}
        </div>
        {pinMessage ? (
          <p role="status" aria-live="polite" className="text-muted" style={{ margin: 0 }}>
            {pinMessage}
          </p>
        ) : null}
      </section>

      <section className="card stack" aria-label="学習状況の確認">
        <h2 style={{ fontSize: 16 }}>学習状況の確認</h2>
        <div className="row-between">
          <span>学習日数</span>
          <span>{stats.totalDaysStudied}日</span>
        </div>
        <div className="row-between">
          <span>連続日数</span>
          <span>{stats.currentStreak}日</span>
        </div>
        <div className="row-between">
          <span>累計問題数</span>
          <span>{stats.totalQuestionsAnswered}問</span>
        </div>
        <div className="row-between">
          <span>正解率</span>
          <span>{Math.round(stats.accuracy * 100)}%</span>
        </div>
        <div className="row-between">
          <span>マスター数</span>
          <span>{stats.masteredKanjiIds.length}字</span>
        </div>
        <div>
          <span>苦手漢字：</span>
          {weakKanji.length === 0 ? (
            <span className="text-muted">なし</span>
          ) : (
            <span>{weakKanji.map((k) => k.kanji).join('、')}</span>
          )}
        </div>
      </section>

      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => navigate('dataManagement')}
      >
        🗂️ データ管理を開く
      </button>
    </div>
  )
}

export function ParentPage(): React.JSX.Element {
  return (
    <PinGate>
      <ParentPageContent />
    </PinGate>
  )
}

export default ParentPage
