# CLAUDE.md

## プロジェクト概要

「はやしごと」— 林 祐太の個人事業ポートフォリオサイト。バニラJS構成の軽量サイト。

## READMEの技術スタック記載ルール

README.md の「技術スタック」セクションには、使用している技術とその選定理由を簡潔に併記すること。
新しい技術を追加・削除した場合は README.md も同時に更新する。

記載フォーマット:
```
- **カテゴリ**: ツール名 — 選定理由（1行）
```

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド
- `npm run preview` — ビルド後プレビュー

## 構成

- `index.html` / `main.js` / `style.css` — メインのフロントエンド
- `api/send.js` — お問い合わせ送信 (Vercel Serverless Function)
- `works/` — 制作実績の個別ページ
- `public/` — 静的アセット（画像・robots.txt・sitemap.xml）
- `vercel.json` — Vercelデプロイ設定・セキュリティヘッダー

## 環境変数（Vercel側で設定）

- `RESEND_API_KEY` — Resend APIキー
