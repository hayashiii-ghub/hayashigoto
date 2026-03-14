# CLAUDE.md

## プロジェクト概要

「はやしごと」— 林 祐太の個人事業ポートフォリオサイト。

## 技術選定のルール（Architecture & Stack）

本プロジェクトは、特定の技術スタック（React, Vue, Tailwindなど）に固定しません。
新しい機能（ルーティング、アニメーション、状態管理、スタイリングなど）を実装する際、外部ライブラリやフレームワークの導入が適切だと判断した場合は、**いきなり実装・インストールせず、まず私に提案してください。**

提案の際は、以下の観点を踏まえて2〜3つの選択肢を提示してください：
1. **軽量さとパフォーマンス**: ポートフォリオサイトとしての読み込み速度への影響
2. **保守性**: 個人開発におけるメンテナンスのしやすさ（学習コストや依存関係の少なさ）
3. **Vercelとの相性**: 現在のホスティング環境での動作やデプロイの容易さ

## READMEの更新ルール

提案した技術の導入を私が承認した場合、インストールと実装を行った後、必ず `README.md` の「技術スタック」セクションに**「採用した技術」と「その選定理由（1行）」**を追記・更新してください。

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド
- `npm run preview` — ビルド後プレビュー

## 構成

- `src/pages/` — ページ（Astro）
- `src/layouts/` — 共通レイアウト
- `src/components/` — 再利用可能コンポーネント
- `src/content/works/` — 制作実績データ（Markdown + Content Collections）
- `src/scripts/` — クライアントサイド JavaScript
- `src/styles/global.css` — グローバルスタイル
- `api/send.js` — お問い合わせ送信 (Vercel Serverless Function)
- `public/` — 静的アセット（画像・robots.txt・sitemap.xml）
- `vercel.json` — Vercelデプロイ設定・セキュリティヘッダー

## 環境変数（Vercel側で設定）

- `RESEND_API_KEY` — Resend APIキー
