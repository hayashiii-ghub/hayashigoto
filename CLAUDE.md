# はやしごと - Claude Code 用プロジェクト説明

個人事業「はやしごと」のポートフォリオサイト。

## 技術スタック

- **ビルド**: Vite
- **フロント**: バニラ HTML / CSS / JavaScript
- **メール送信**: Resend（Vercel Serverless Functions 経由）
- **デプロイ**: Vercel
- **パッケージマネージャ**: npm

## ディレクトリ構成

- `index.html` - エントリの HTML
- `style.css` - スタイル
- `main.js` - メインの JS
- `api/send.js` - お問い合わせメール送信の Serverless Function（Resend）
- `vite.config.js` - Vite 設定
- `vercel.json` - Vercel 設定
- `public/` - 静的アセット（ロゴ画像など）
- `works/` - 制作実績の個別ページ

## 開発コマンド

- `npm run dev` - 開発サーバー起動（ホットリロード）
- `npm run build` - 本番ビルド
- `npm run preview` - ビルド結果のプレビュー

## 編集時の注意

- スタイルは `style.css` に追加する
- ページ構造は `index.html`、挙動は `main.js` を編集する
- メール送信ロジックは `api/send.js` を編集する
- 環境変数 `RESEND_API_KEY` は Vercel ダッシュボードで設定済み
