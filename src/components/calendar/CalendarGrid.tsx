import { listDatesInMonth, parseDateString } from '../../domain/dateUtils'
import type { DailyHistory } from '../../types'

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

type CalendarGridProps = {
  year: number
  month: number
  summerStart: string
  summerEnd: string
  today: string
  dailyHistory: DailyHistory
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

export function CalendarGrid({
  year,
  month,
  summerStart,
  summerEnd,
  today,
  dailyHistory,
  selectedDate,
  onSelectDate,
}: CalendarGridProps): React.JSX.Element {
  const dates = listDatesInMonth(year, month)
  const firstWeekday = parseDateString(
    dates[0] ?? `${year}-${String(month).padStart(2, '0')}-01`,
  ).getUTCDay()
  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => `blank-${i}`)

  return (
    <div>
      <div className="calendar-grid" style={{ marginBottom: 4 }}>
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="calendar-weekday">
            {w}
          </div>
        ))}
      </div>
      <div className="calendar-grid" role="group" aria-label={`${year}年${month}月のカレンダー`}>
        {leadingBlanks.map((key) => (
          <div key={key} aria-hidden="true" />
        ))}
        {dates.map((date) => {
          const inSummer = date >= summerStart && date <= summerEnd
          const isFuture = date > today
          const record = dailyHistory[date]
          const hasStudy = !isFuture && !!record && record.attempts > 0
          const goalMet = hasStudy && record?.goalMet
          const allCorrect = hasStudy && record?.allCorrect
          const isToday = date === today
          const day = Number(date.slice(-2))

          if (!inSummer) {
            return <div key={date} aria-hidden="true" />
          }

          const className = [
            'calendar-cell',
            isToday ? 'is-today' : '',
            hasStudy ? 'has-study' : '',
            goalMet ? 'goal-met' : '',
            allCorrect ? 'all-correct' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={date}
              type="button"
              className={className}
              disabled={isFuture}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={selectedDate === date}
              aria-label={`${day}日${isFuture ? '（まだ来ていません）' : hasStudy ? '（学習済み）' : '（未学習）'}`}
              onClick={() => onSelectDate(date)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid
