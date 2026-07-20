import { describe, expect, it } from 'vitest'
import { KANJI_LIST } from './kanji'

describe('KANJI_LIST', () => {
  it('has exactly 95 entries', () => {
    expect(KANJI_LIST).toHaveLength(95)
  })

  it('has unique ids', () => {
    const ids = KANJI_LIST.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique kanji characters', () => {
    const kanjiChars = KANJI_LIST.map((item) => item.kanji)
    expect(new Set(kanjiChars).size).toBe(kanjiChars.length)
  })

  it('every kanji has at least one reading (onyomi or kunyomi)', () => {
    for (const item of KANJI_LIST) {
      expect(item.onyomi.length + item.kunyomi.length).toBeGreaterThan(0)
    }
  })

  it('every kanji has primaryReadings drawn from onyomi/kunyomi', () => {
    for (const item of KANJI_LIST) {
      expect(item.primaryReadings.length).toBeGreaterThan(0)
      for (const reading of item.primaryReadings) {
        expect([...item.onyomi, ...item.kunyomi]).toContain(reading)
      }
    }
  })

  it('every kanji has at least one word', () => {
    for (const item of KANJI_LIST) {
      expect(item.words.length).toBeGreaterThan(0)
    }
  })

  it('every word contains the kanji character itself', () => {
    for (const item of KANJI_LIST) {
      for (const word of item.words) {
        expect(word.word).toContain(item.kanji)
      }
    }
  })

  it('every kanji has at least one example sentence', () => {
    for (const item of KANJI_LIST) {
      expect(item.exampleSentences.length).toBeGreaterThan(0)
    }
  })

  it('every example sentence contains the kanji character', () => {
    for (const item of KANJI_LIST) {
      for (const sentence of item.exampleSentences) {
        expect(sentence.text).toContain(item.kanji)
      }
    }
  })

  it('every kanji has a non-empty hint', () => {
    for (const item of KANJI_LIST) {
      expect(item.hint.trim().length).toBeGreaterThan(0)
    }
  })

  it('group is between 1 and 9', () => {
    for (const item of KANJI_LIST) {
      expect(item.group).toBeGreaterThanOrEqual(1)
      expect(item.group).toBeLessThanOrEqual(9)
    }
  })

  it('is enabled by default for all kanji', () => {
    for (const item of KANJI_LIST) {
      expect(item.enabledByDefault).toBe(true)
    }
  })
})
