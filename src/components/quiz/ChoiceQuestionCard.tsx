import { getKanjiById } from '../../data/kanji'
import type { QuizQuestion } from '../../types'

type ChoiceQuestionCardProps = {
  question: QuizQuestion
  disabled: boolean
  selectedAnswer: string | null
  onSelect: (choice: string) => void
}

/** 読み方選択・漢字選択・熟語の読み・文の穴埋め、共通の選択式問題カード。 */
export function ChoiceQuestionCard({
  question,
  disabled,
  selectedAnswer,
  onSelect,
}: ChoiceQuestionCardProps): React.JSX.Element {
  const kanji = getKanjiById(question.kanjiId)

  return (
    <div className="card stack">
      {question.type === 'kanji-choice' ? (
        <p className="question-prompt">{question.prompt}</p>
      ) : (
        <>
          {kanji ? (
            <p className="question-kanji" aria-hidden="true">
              {kanji.kanji}
            </p>
          ) : null}
          <p className="question-prompt">{question.prompt}</p>
        </>
      )}

      <div
        className={
          question.type === 'kanji-choice' ? 'choice-grid choice-grid-2col' : 'choice-grid'
        }
        role="group"
        aria-label="回答の選択肢"
      >
        {question.choices.map((choice) => {
          const isSelected = selectedAnswer === choice
          const isCorrectChoice = choice === question.correctAnswer
          const showResult = disabled
          const className = [
            'choice-btn',
            question.type === 'kanji-choice' ? 'question-kanji' : '',
            showResult && isCorrectChoice ? 'is-correct' : '',
            showResult && isSelected && !isCorrectChoice ? 'is-incorrect' : '',
            !showResult && isSelected ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={choice}
              type="button"
              className={className}
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(choice)}
            >
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ChoiceQuestionCard
