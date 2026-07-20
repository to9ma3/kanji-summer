import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

async function completeSetup(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  expect(await screen.findByText('夏休み漢字たんけんへようこそ')).toBeInTheDocument()
  const nicknameInput = screen.getByLabelText('ニックネーム')
  await user.type(nicknameInput, 'たろう')
  await user.click(screen.getByRole('button', { name: 'はじめる' }))
  expect(await screen.findByRole('heading', { name: '夏休み漢字たんけん' })).toBeInTheDocument()
}

/** 選択式の問題に1つ回答し、フィードバック後「次へ」または「けっかを見る」を押す。 */
async function answerOneQuestion(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
): Promise<void> {
  const choiceGrid = container.querySelector('.choice-grid')
  if (!choiceGrid) throw new Error('choice grid not found')
  const choiceButtons = within(choiceGrid as HTMLElement).getAllByRole('button')
  await user.click(choiceButtons[0]!)
  const nextButton = await screen.findByRole('button', { name: /次へ|けっかを見る/ })
  await user.click(nextButton)
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the home screen after completing initial setup', async () => {
    const user = userEvent.setup()
    render(<App />)
    await completeSetup(user)

    expect(screen.getByText('小学3年生・1学期')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /今日の5問をはじめる/ })).toBeInTheDocument()
  })

  it('starts the "today\'s 5 questions" set and shows a question', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await completeSetup(user)

    await user.click(screen.getByRole('button', { name: /今日の5問をはじめる/ }))

    expect(await screen.findByText('1 / 5')).toBeInTheDocument()
    expect(container.querySelector('.choice-grid')).toBeInTheDocument()
  })

  it('shows feedback (correct/incorrect) after answering a question', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await completeSetup(user)
    await user.click(screen.getByRole('button', { name: /今日の5問をはじめる/ }))

    await screen.findByText('1 / 5')
    const choiceGrid = container.querySelector('.choice-grid')
    const choiceButtons = within(choiceGrid as HTMLElement).getAllByRole('button')
    await user.click(choiceButtons[0]!)

    const feedback = await screen.findByRole('status')
    expect(feedback.textContent).toMatch(/せいかい|おしい/)
  })

  it('reaches the result screen after answering all 5 questions', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await completeSetup(user)
    await user.click(screen.getByRole('button', { name: /今日の5問をはじめる/ }))
    await screen.findByText('1 / 5')

    for (let i = 0; i < 5; i += 1) {
      await answerOneQuestion(user, container)
    }

    expect(await screen.findByText(/問中/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'もう一度' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ホームへ戻る' })).toBeInTheDocument()
  }, 15000)

  it('allows changing settings from the parent screen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await completeSetup(user)

    await user.click(screen.getByRole('button', { name: '保護者設定を開く' }))
    expect(await screen.findByRole('heading', { name: '保護者設定' })).toBeInTheDocument()

    const nicknameInput = screen.getByLabelText('ニックネーム') as HTMLInputElement
    await user.clear(nicknameInput)
    await user.type(nicknameInput, 'はなこ')
    expect(nicknameInput.value).toBe('はなこ')

    await user.click(screen.getByRole('button', { name: '戻る' }))
    expect(await screen.findByText(/はなこ さん、こんにちは/)).toBeInTheDocument()
  })

  it('keeps learning history after an app reload (persisted via localStorage)', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await completeSetup(user)
    await user.click(screen.getByRole('button', { name: /今日の5問をはじめる/ }))
    await screen.findByText('1 / 5')

    unmount()

    render(<App />)
    // hasCompletedSetup が保存されているので、セットアップ画面ではなくホーム画面が出る
    expect(await screen.findByText(/たろう さん、こんにちは/)).toBeInTheDocument()
  })

  it('shows a confirmation dialog before resetting data', async () => {
    const user = userEvent.setup()
    render(<App />)
    await completeSetup(user)

    await user.click(screen.getByRole('button', { name: '保護者設定を開く' }))
    await screen.findByRole('heading', { name: '保護者設定' })
    await user.click(screen.getByRole('button', { name: '🗂️ データ管理を開く' }))

    expect(await screen.findByRole('heading', { name: 'データ管理' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'すべての設定と履歴をリセット' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('本当にリセットしますか？')).toBeInTheDocument()

    // 誤操作防止：やめるを押すとリセットされずダイアログが閉じる
    await user.click(screen.getByRole('button', { name: 'やめる' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
