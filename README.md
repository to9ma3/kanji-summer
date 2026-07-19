# 小学3年生 夏休み漢字たんけん

小学3年生の1学期に学ぶ漢字95字を、iPhone・iPad・PCで復習できるReact PWAです。

## 主な機能

- 読み方・漢字選択のランダム問題
- 5問／10問／20問設定
- 間違えた漢字の優先復習
- 学習日数、回答数、正解率、マスター漢字の記録
- 月間学習カレンダー
- 指・Apple Pencil対応の書き取り練習
- 端末内保存（localStorage）
- PWA／オフライン利用
- GitHub Actionsによる自動ビルド・公開

## GitHub Pagesで公開する手順

1. このZIPを解凍する。
2. `kanji-summer` リポジトリの **Add file → Upload files** を開く。
3. 解凍したフォルダの「中身」をすべてドラッグしてCommitする。
   - `node_modules` は含まれていないため、100ファイル制限にはかかりません。
4. リポジトリの **Settings → Pages** を開く。
5. **Source** を `GitHub Actions` に変更する。
6. 上部の **Actions** を開き、`Deploy PWA to GitHub Pages` が成功するまで待つ。
7. 公開URLは通常 `https://to9ma3.github.io/kanji-summer/` です。

## iPhoneへの追加

1. Safariで公開URLを開く。
2. 共有ボタンを押す。
3. 「ホーム画面に追加」を選ぶ。
4. 追加後はアプリのように起動でき、読み込み済みデータはオフラインでも利用できます。

## ローカル起動

```bash
npm install
npm run dev
```

## リポジトリ名を変更する場合

`vite.config.js` 内の `/kanji-summer/` を、新しいリポジトリ名に合わせて変更してください。

## データ保存について

学習記録はサーバーには送信せず、その端末のブラウザ内に保存します。Safariの履歴・Webサイトデータを消去すると学習記録も消える可能性があります。
