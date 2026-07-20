import { test, expect, type Page } from '@playwright/test'

async function completeSetup(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.getByText('夏休み漢字たんけんへようこそ')).toBeVisible()
  await page.getByLabel('ニックネーム').fill('たろう')
  await page.getByRole('button', { name: 'はじめる' }).click()
  await expect(page.getByRole('heading', { name: '夏休み漢字たんけん' })).toBeVisible()
}

test.describe('夏休み漢字たんけん', () => {
  test('初回設定を完了するとホーム画面が表示される', async ({ page }) => {
    await completeSetup(page)
    await expect(page.getByText('たろう さん、こんにちは！')).toBeVisible()
    await expect(page.getByRole('button', { name: /今日の5問をはじめる/ })).toBeVisible()
  })

  test('今日の5問を開始して5問回答し、結果画面が表示され、ホームへ戻れる', async ({ page }) => {
    await completeSetup(page)
    await page.getByRole('button', { name: /今日の5問をはじめる/ }).click()
    await expect(page.getByText('1 / 5')).toBeVisible()

    for (let i = 0; i < 5; i += 1) {
      const choiceButtons = page.locator('.choice-grid button')
      await choiceButtons.first().click()
      const nextButton = page.getByRole('button', { name: /次へ|けっかを見る/ })
      await expect(nextButton).toBeVisible()
      await nextButton.click()
    }

    await expect(page.getByText(/問中/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'もう一度' })).toBeVisible()

    await page.getByRole('button', { name: 'ホームへ戻る' }).click()
    await expect(page.getByRole('heading', { name: '夏休み漢字たんけん' })).toBeVisible()
  })

  test('リロード後も学習履歴（ニックネーム・設定）が残る', async ({ page }) => {
    await completeSetup(page)
    await page.reload()
    await expect(page.getByText('たろう さん、こんにちは！')).toBeVisible()
  })

  test('書き取り練習画面を開ける', async ({ page }) => {
    await completeSetup(page)
    await page.getByRole('button', { name: '書き取り練習' }).click()
    await expect(page.getByText('書き取り練習')).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('保護者設定を開ける', async ({ page }) => {
    await completeSetup(page)
    await page.getByRole('button', { name: '保護者設定を開く' }).click()
    await expect(page.getByRole('heading', { name: '保護者設定' })).toBeVisible()
    await expect(page.getByLabel('ニックネーム')).toBeVisible()
  })

  test('オフラインでも再訪問できる（Service Worker キャッシュ）', async ({
    page,
    context,
    browserName,
  }) => {
    // WebKit は Playwright 上での Service Worker + オフラインエミュレーションの相性が悪く
    // reload が内部エラーになることがあるため、可能な範囲の確認として Chromium 系に限定する。
    test.skip(browserName === 'webkit', 'WebKit + Playwright の SW/オフライン制約のためスキップ')
    await completeSetup(page)
    // Service Worker の登録がアクティブになるのを待つ
    await page.evaluate(() => navigator.serviceWorker.ready)
    // 最初の訪問はSWの制御下にないことがあるため、一度リロードしてSW配下のページにする
    await page.reload()
    await expect(page.getByText('たろう さん、こんにちは！')).toBeVisible()
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, {
      timeout: 15000,
    })

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByText('たろう さん、こんにちは！')).toBeVisible({ timeout: 10000 })
    await context.setOffline(false)
  })
})

test.describe('モバイル画面 (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('主要ボタンがタップ操作できる', async ({ page }) => {
    await completeSetup(page)
    const startButton = page.getByRole('button', { name: /今日の5問をはじめる/ })
    await expect(startButton).toBeVisible()
    const box = await startButton.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    await startButton.click()
    await expect(page.getByText('1 / 5')).toBeVisible()
  })
})
