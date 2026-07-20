import type { AchievementDefinition } from '../types'

/** 実績の定義（表示用の文言）。実際に「いつ解除されるか」の判定は domain/progressCalculator.ts が持つ。 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first-step',
    title: 'はじめの一歩',
    description: 'はじめて学習した',
  },
  {
    id: 'explore-5',
    title: '5日たんけん',
    description: '累計5日学習した',
  },
  {
    id: 'explore-10',
    title: '10日たんけん',
    description: '累計10日学習した',
  },
  {
    id: 'streak-7',
    title: '7日れんぞく',
    description: '7日連続で学習した',
  },
  {
    id: 'challenge-100',
    title: '100問チャレンジ',
    description: '累計100問に答えた',
  },
  {
    id: 'master-10',
    title: '漢字マスター10',
    description: '10字の漢字をマスターした',
  },
  {
    id: 'master-50',
    title: '漢字マスター50',
    description: '50字の漢字をマスターした',
  },
  {
    id: 'master-95',
    title: '1学期マスター',
    description: '95字すべての漢字をマスターした',
  },
]

export const ACHIEVEMENT_BY_ID: ReadonlyMap<string, AchievementDefinition> = new Map(
  ACHIEVEMENT_DEFINITIONS.map((def) => [def.id, def]),
)
