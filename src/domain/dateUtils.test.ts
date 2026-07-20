import { describe, expect, it } from 'vitest'
import {
  addDays,
  diffDays,
  isDateInRange,
  listDatesInMonth,
  toJstDateString,
  todayJst,
} from './dateUtils'

describe('dateUtils', () => {
  it('converts a UTC time just after midnight JST correctly (no off-by-one day)', () => {
    // 2024-07-20T00:30:00+09:00 は UTC では 2024-07-19T15:30:00Z
    const date = new Date('2024-07-19T15:30:00Z')
    expect(toJstDateString(date)).toBe('2024-07-20')
  })

  it('does not roll back a day when naive UTC conversion would', () => {
    // UTC の 23:30 は JST では翌日の 08:30 になる
    const date = new Date('2024-07-19T23:30:00Z')
    expect(toJstDateString(date)).toBe('2024-07-20')
  })

  it('todayJst returns a YYYY-MM-DD formatted string', () => {
    expect(todayJst()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('addDays adds days correctly across month boundaries', () => {
    expect(addDays('2024-07-31', 1)).toBe('2024-08-01')
  })

  it('addDays subtracts days correctly', () => {
    expect(addDays('2024-08-01', -1)).toBe('2024-07-31')
  })

  it('diffDays computes the difference in days', () => {
    expect(diffDays('2024-08-05', '2024-08-01')).toBe(4)
    expect(diffDays('2024-08-01', '2024-08-05')).toBe(-4)
  })

  it('isDateInRange checks inclusive boundaries', () => {
    expect(isDateInRange('2024-07-20', '2024-07-20', '2024-08-31')).toBe(true)
    expect(isDateInRange('2024-08-31', '2024-07-20', '2024-08-31')).toBe(true)
    expect(isDateInRange('2024-07-19', '2024-07-20', '2024-08-31')).toBe(false)
    expect(isDateInRange('2024-09-01', '2024-07-20', '2024-08-31')).toBe(false)
  })

  it('listDatesInMonth returns every date in the month', () => {
    const dates = listDatesInMonth(2024, 2) // うるう年の2月
    expect(dates).toHaveLength(29)
    expect(dates[0]).toBe('2024-02-01')
    expect(dates[28]).toBe('2024-02-29')
  })
})
