# 夏休み漢字たんけん

小学3年生・1学期

小学3年生が夏休み中に、1学期に習った漢字を毎日5〜10分ほどで復習できる学習用PWA（Progressive Web App）です。島をたんけんしながら漢字を覚えていく、夏休みの世界観になっています。

公開URL: https://to9ma3.github.io/kanji-summer/

## アプリ概要

- 対象：小学3年生（主利用者）・保護者（補助利用者）
- 1学期に習う95字の漢字を、選択式クイズと手書き練習で復習します
- 間違えた漢字は、軽量な間隔反復アルゴリズムにもとづいて適切なタイミングで再出題されます
- 広告なし・課金なし・ランキングなし・外部APIなし・ログインなし・個人情報の収集なし
- 学習データはすべてブラウザ内（localStorage）に保存され、外部に送信されません
- オフラインでも使えるPWAとして、iPhone・iPad・Mac・Windowsで動作します

## 主な機能

- **今日の5問 / 10問チャレンジ / 20問テスト / 苦手漢字**：4種類の学習コース
- **書き取り練習**：指・マウス・Apple Pencilで手書きし、自分で「できた／もう一度」を選ぶ自己採点方式（OCRや書き順の自動判定は行いません）
- **4種類の出題形式**：読み方選択・漢字選択・熟語の読み・文の穴埋め（設定で書き取り問題を通常問題に混ぜることも可能）
- **間隔反復による復習スケジューリング**：習熟度（0〜5）に応じて次回の出題タイミングを自動調整
- **漢字一覧・漢字詳細**：95字をいつでも一覧・詳細確認でき、習得状況で絞り込み可能
- **学習きろく・夏休みカレンダー**：学習日数、連続日数、正解率、マスター数、日ごとの学習状況を確認
- **ごほうび・実績**：星と8種類の実績で、学習のモチベーションを支えます
- **保護者設定**：4桁PINで保護。出題漢字の選択、学習目標、効果音、アニメーション抑制などを設定
- **データ管理**：学習データのJSONエクスポート／インポート、学習履歴だけのリセット、全データリセット
- **PWA対応**：ホーム画面への追加、オフライン動作、自動更新の案内

## 技術構成

- React 19 / TypeScript（strict mode）/ Vite
- vite-plugin-pwa（Web App Manifest・Service Worker生成）
- ルーティングは React Router を使わず、アプリ内state（`NavigationContext`）で画面制御（GitHub PagesのSPA 404問題を回避）
- Vitest + React Testing Library（ユニットテスト・コンポーネントテスト）
- Playwright（E2Eテスト）
- ESLint（flat config）+ Prettier
- CSSは単一の整理されたグローバルCSS構成（`src/styles/global.css`）
- 状態管理はReact Context + useReducerのみ（大規模な状態管理ライブラリは不使用）
- 依存パッケージは必要最小限（Tailwind・Firebase・外部DB・外部AI APIなどは不使用）

## ディレクトリ構成

```
src/
  app/            App.tsx（画面のルート）, routes.tsx（画面名→コンポーネント対応表）
  components/     common / quiz / handwriting / calendar / parent / pwa の各コンポーネント
  pages/          16画面に対応するページコンポーネント
  data/           kanji.ts（95字データ）, achievements.ts（実績の定義）
  domain/         quizGenerator / spacedRepetition / progressCalculator / dateUtils（純粋関数・ユニットテスト対象）
  services/       storage.ts（localStorage） / exportImport.ts / audio.ts
  context/        AppDataContext / QuizSessionContext / NavigationContext / PwaStatusContext / ParentGateContext
  reducers/       appDataReducer / quizSessionReducer
  hooks/          useReducedMotion など
  types/          共通の型定義
  styles/         global.css
  test/           テストセットアップ
public/
  icons/          192×192・512×512・maskableアイコン、apple-touch-icon
  favicon.svg
scripts/
  generate-icons.mjs   アイコン生成スクリプト（後述）
.github/workflows/deploy.yml   GitHub Pages 公開用ワークフロー
e2e/               Playwright E2Eテスト
```

## ローカル起動方法

Node.js の安定版LTS（推奨: Node.js 22 以降）を用意してください。

```bash
npm install
npm run dev
```

`http://localhost:5173/kanji-summer/` を開いてください（Viteのbaseを `/kanji-summer/` に設定しているため、パスにサブディレクトリが含まれます）。

## テスト方法

```bash
npm run typecheck     # TypeScriptの型チェック
npm run lint          # ESLint
npm run format:check  # Prettierフォーマットチェック
npm run test:run      # ユニットテスト・コンポーネントテスト（Vitest）を1回実行
npm run test          # Vitest をウォッチモードで実行
npm run test:coverage # カバレッジ計測つきでテスト実行
npm run test:e2e      # PlaywrightによるE2Eテスト（初回は `npx playwright install` が必要）
```

`npm run test:e2e` は内部で `npm run build` 済みの `dist` を `vite preview` で配信して実行します（`playwright.config.ts` の `webServer` 設定）。

## ビルド方法

```bash
npm run build    # 型チェック→本番ビルド（dist/ に出力）
npm run preview  # ビルド結果をローカルで確認（http://localhost:4173/kanji-summer/ など）
```

## GitHub Pages公開方法

1. 変更を `main` ブランチへ push します
2. GitHubリポジトリの **Settings** を開きます
3. 左メニューの **Pages** を開きます
4. **Source** を **GitHub Actions** に設定します
5. `.github/workflows/deploy.yml` のワークフロー（Actionsタブ）の完了を待ちます
6. https://to9ma3.github.io/kanji-summer/ を開いて動作を確認します

以降は `main` への push のたびに自動でビルド・デプロイされます（`workflow_dispatch` による手動実行も可能です）。

### GitHub Pages設定（ワークフローの内容）

`.github/workflows/deploy.yml` は以下を行います。

1. `actions/checkout`
2. `actions/setup-node`（Node.js 22）
3. `npm ci`
4. `npm run lint`
5. `npm run format:check`
6. `npm run test:run`
7. `npm run build`
8. `actions/configure-pages`
9. `actions/upload-pages-artifact`（`dist` をアップロード）
10. `actions/deploy-pages`

`permissions` は `contents: read` / `pages: write` / `id-token: write` に限定し、`concurrency` でPages向けの同時デプロイを1つに制御しています。

## PWAインストール方法

### iPhoneでホーム画面へ追加する方法

1. Safariでアプリを開く
2. 画面下部の共有ボタン（□に↑のアイコン）をタップ
3. 「ホーム画面に追加」を選ぶ
4. 「追加」をタップ

ホーム画面から起動するとアドレスバーのないアプリのような表示（standalone）になります。すでにホーム画面から起動している場合は、アプリ内のインストール案内は表示されません。

### その他の環境

- **Android Chrome / デスクトップChrome・Edge**：アドレスバーのインストールアイコン、またはメニューの「アプリをインストール」から追加できます
- **Mac / Windows**：対応ブラウザで開き、上記のインストール機能を使うとデスクトップアプリのように利用できます

アプリは初回訪問時にオフライン用のキャッシュを作成し、次回以降はオフラインでも起動できます。新しいバージョンが公開されると、アプリ内に更新案内が表示されます。

## 学習データの保存場所

学習データはすべて **お使いのブラウザのlocalStorage**（キー: `kanji-summer:v1`）に保存されます。サーバーには一切送信されません。ブラウザ・端末を変えると、そのブラウザのデータは引き継がれないため、機種変更前は下記のエクスポートでバックアップしてください。

保存データにはスキーマバージョン（`schemaVersion`）を持たせており、将来アプリを更新してデータ構造が変わった場合でも、可能な範囲で自動的に移行されます。保存データが壊れている場合も、アプリ全体がクラッシュせず、安全に初期状態から再開できるようになっています。

## データのバックアップ・復元

保護者設定 → データ管理 から行えます。

- **エクスポート**：学習データ（設定・進捗・学習履歴・実績・スター数など）をJSONファイルとしてダウンロードします
- **インポート**：エクスポートしたJSONファイルを選択して読み込みます。内容を検証し、不正な形式の場合は取り込まずエラーを表示します

## データ削除時の注意

データ管理画面には2種類のリセットがあります。いずれも確認ダイアログを経てから実行され、誤操作を防止しています。

- **学習履歴だけリセット**：進捗・カレンダー・実績・スターを削除します（ニックネームなどの設定は残ります）
- **すべての設定と履歴をリセット**：初期状態に戻り、初回設定からやり直しになります

**この操作は取り消せません。** 大事な記録がある場合は、リセット前に必ずエクスポートでバックアップを取ってください。リセット後はアプリが自動的に再読み込みされ、正常な初期状態で起動します。

## 漢字データ編集方法

95字の漢字データは `src/data/kanji.ts` にソースコードから分離して定義されています。各要素は次の形式です。

```ts
{
  id: "oyogu",
  kanji: "泳",
  onyomi: ["エイ"],
  kunyomi: ["およぐ"],
  primaryReadings: ["およぐ", "エイ"],
  words: [
    { word: "水泳", reading: "すいえい" },
    { word: "泳ぐ", reading: "およぐ" },
  ],
  exampleSentences: [{ text: "プールで泳ぐ。" }],
  hint: "水の中を進むことを表す漢字だよ。",
  group: 7,
  enabledByDefault: true,
}
```

編集後は `npm run test:run` を実行し、`src/data/kanji.test.ts` の検証（95字であること、id・漢字が重複しないこと、読み・単語・例文・ヒントが存在することなど）が通ることを確認してください。

## 保護者PINの注意

保護者設定は4桁のPINで保護できます。これは**暗号学的な強いセキュリティではなく**、お子さまが誤って設定を変更してしまうことを防ぐための簡易的なロックです。重要な情報（個人情報・決済情報など）は扱っていません。

PINを忘れた場合は、保護者用PIN入力画面の「PINをわすれた場合」から、すべてのデータをリセットすることでPINも解除できます（学習記録も削除されるため、可能であれば事前にエクスポートでバックアップしてください）。

## トラブルシューティング

- **GitHub Pagesで画面が真っ白になる**：Viteの`base`設定（`/kanji-summer/`）とリポジトリ名が一致しているか確認してください。ブラウザのキャッシュ／Service Workerが古い場合は、一度ホーム画面から削除して再インストールするか、シークレットウィンドウで確認してください
- **アイコンやmanifestが反映されない**：`npm run build` → `npm run preview` で `dist` を確認し、`/kanji-summer/manifest.webmanifest` や `/kanji-summer/icons/icon-512.png` が200で取得できるか確認してください
- **保護者設定に入れない（PINを忘れた）**：上記「保護者PINの注意」を参照してください
- **書き取りキャンバスに書けない**：ブラウザがCanvas 2D APIとPointer Eventsに対応しているか確認してください（最新のSafari/Chrome/Edge/Firefoxであれば対応しています）
- **オフラインで起動しない**：一度オンラインの状態でアプリを開き、Service Workerの初回キャッシュが完了するのを待ってから再度お試しください
- **`npm run test:e2e` が失敗する**：初回は `npx playwright install` でブラウザ本体の取得が必要です

## アイコンについて

アプリアイコンは、青系の背景・島とヤシの木・漢字の「学」・小さな星を組み合わせたオリジナルデザインです（著作権のある既存キャラクター等は使用していません）。`scripts/generate-icons.mjs` で生成しており、再生成する場合は一時的に `opentype.js` と `sharp` を devDependencies としてインストールしてから実行してください（通常の開発・ビルドではこの2つは不要です）。

```bash
npm install --no-save opentype.js sharp
node scripts/generate-icons.mjs
```

## セキュリティ・プライバシー

- 個人情報を収集・送信しません（氏名・住所・学校名などは入力項目にありません）
- Analytics・広告・外部トラッキング・外部CDNは使用していません
- インポートするJSONは必ず内容を検証してから取り込みます
- ユーザー入力をHTMLとして描画すること（`dangerouslySetInnerHTML`）は行っていません
