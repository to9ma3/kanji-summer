import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useNavigation } from '../context/NavigationContext'
import { todayJst, getYearMonth, formatDateForDisplay } from '../domain/dateUtils'
import { getKanjiById } from '../data/kanji'
import CalendarGrid from '../components/calendar/CalendarGrid'

export function CalendarPage(): React.JSX.Element {
  const { state } = useAppData()
  const { back } = useNavigation()
  const today = todayJst()
  const initialYm = getYearMonth(
    state.settings.summerStart <= today && today <= state.settings.summerEnd
      ? today
      : state.settings.summerStart,
  )
  const [year, setYear] = useState(initialYm.year)
  const [month, setMonth] = useState(initialYm.month)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const goPrevMonth = (): void => {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
    setSelectedDate(null)
  }
  const goNextMonth = (): void => {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
    setSelectedDate(null)
  }

  const record = selectedDate ? state.dailyHistory[selectedDate] : undefined
  const studiedKanji = (record?.kanjiIds ?? [])
    .map((id) => getKanjiById(id))
    .filter((k): k is NonNullable<typeof k> => !!k)

  return (
    <div className="page">
      <div className="top-bar">
        <button type="button" className="icon-btn" aria-label="戻る" onClick={back}>
          <span aria-hidden="true">←</span>
        </button>
        <h1 style={{ fontSize: 20 }}>夏休みカレンダー</h1>
        <span style={{ width: 44 }} />
      </div>

      <div className="row-between">
        <button type="button" className="icon-btn" aria-label="前の月" onClick={goPrevMonth}>
          <span aria-hidden="true">‹</span>
        </button>
        <span style={{ fontWeight: 700 }}>
          {year}年{month}月
        </span>
        <button type="button" className="icon-btn" aria-label="次の月" onClick={goNextMonth}>
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="card">
        <CalendarGrid
          year={year}
          month={month}
          summerStart={state.settings.summerStart}
          summerEnd={state.settings.summerEnd}
          today={today}
          dailyHistory={state.dailyHistory}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className="row" style={{ flexWrap: 'wrap', fontSize: 13 }}>
        <span className="badge badge-muted">学習した日</span>
        <span className="badge badge-good">目標達成</span>
        <span className="badge badge-star">全問正解</span>
      </div>

      {selectedDate ? (
        <section className="card stack" aria-live="polite" aria-label="選んだ日の記録">
          <h2 style={{ fontSize: 16 }}>{formatDateForDisplay(selectedDate)}</h2>
          {record && record.attempts > 0 ? (
            <>
              <div className="row-between">
                <span>回答数</span>
                <span>{record.attempts}問</span>
              </div>
              <div className="row-between">
                <span>正解数</span>
                <span>{record.correct}問</span>
              </div>
              <div className="row-between">
                <span>正解率</span>
                <span>{Math.round((record.correct / record.attempts) * 100)}%</span>
              </div>
              <div className="row-between">
                <span>獲得した星</span>
                <span>⭐ {record.starsEarned}</span>
              </div>
              {studiedKanji.length > 0 ? (
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  {studiedKanji.map((k) => (
                    <span key={k.id} className="badge badge-muted" style={{ fontSize: 16 }}>
                      {k.kanji}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-muted" style={{ margin: 0 }}>
              この日は学習していません。
            </p>
          )}
        </section>
      ) : null}
    </div>
  )
}

export default CalendarPage
