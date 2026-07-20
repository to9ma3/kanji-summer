/**
 * 日本時間 (Asia/Tokyo) を基準にした日付ユーティリティ。
 *
 * `new Date().toISOString()` を単純に切り出す実装は UTC 基準になり、
 * 日本時間の深夜〜朝に日付が1日ずれる。ここでは Intl.DateTimeFormat の
 * timeZone 指定で常に JST の日付を取り出す。
 */

const JST_TIME_ZONE = 'Asia/Tokyo'

const jstDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: JST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const jstWeekdayFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: JST_TIME_ZONE,
  weekday: 'short',
})

/** 指定した Date（省略時は現在時刻）を JST の "YYYY-MM-DD" 文字列にする。 */
export function toJstDateString(date: Date = new Date()): string {
  // en-CA ロケールは YYYY-MM-DD 形式を返すため分解不要
  return jstDateFormatter.format(date)
}

/** 現在の JST 日付文字列。 */
export function todayJst(): string {
  return toJstDateString(new Date())
}

/** "YYYY-MM-DD" をローカルタイムゾーンに依存しない形で Date（UTC 正午）に変換する。 */
export function parseDateString(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number)
  const year = parts[0] ?? 1970
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  // UTC の正午に固定することでタイムゾーンによる日付ズレを避ける
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

/** "YYYY-MM-DD" に days 日を加算した日付文字列を返す（負数で減算）。 */
export function addDays(dateStr: string, days: number): string {
  const base = parseDateString(dateStr)
  base.setUTCDate(base.getUTCDate() + days)
  return toJstDateString(base)
}

/** date1 - date2 を日数で返す。 */
export function diffDays(dateStr1: string, dateStr2: string): number {
  const a = parseDateString(dateStr1).getTime()
  const b = parseDateString(dateStr2).getTime()
  return Math.round((a - b) / (24 * 60 * 60 * 1000))
}

/** dateStr が start〜end（両端含む）の範囲内かどうか。 */
export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

/** dateStr が今日以前（未来ではない）かどうか。 */
export function isTodayOrPast(dateStr: string, today: string = todayJst()): boolean {
  return dateStr <= today
}

/** 表示用に "7月20日(月)" のような文字列を作る。 */
export function formatDateForDisplay(dateStr: string): string {
  const date = parseDateString(dateStr)
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const weekday = jstWeekdayFormatter.format(date)
  return `${month}月${day}日(${weekday})`
}

/** dateStr を含む月の日数一覧 ("YYYY-MM-DD"[]) を返す。 */
export function listDatesInMonth(year: number, month: number): string[] {
  const dates: string[] = []
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  for (let day = 1; day <= daysInMonth; day += 1) {
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    dates.push(`${year}-${mm}-${dd}`)
  }
  return dates
}

export function getYearMonth(dateStr: string): { year: number; month: number } {
  const parts = dateStr.split('-').map(Number)
  return { year: parts[0] ?? 1970, month: parts[1] ?? 1 }
}
