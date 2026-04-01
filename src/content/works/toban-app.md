---
title: "toban — かんたん当番表"
dirName: "toban-app"
year: 2026
role: "Design / Full Stack"
stack: ["Cloudflare", "Hono", "React", "Drizzle ORM", "Vitest", "Playwright", "Sentry"]
url: "https://toban.app"
github: "https://github.com/hayashiii-ghub/toban-app"
note: "https://note.com/hayashiii_note/n/naca284af9f20?sub_rt=share_sb"
description: "掃除当番・給食当番・日直などのローテーション表を作成・印刷・共有できる無料Webアプリ。"
images: ["/works/toban-app.webp"]
order: 3
category: "個人開発"
---

掃除当番・給食当番・日直などのローテーション表を作成・印刷・共有できる無料Webアプリ。幼稚園・保育園・小学校・PTA・介護施設・自治会・飲食店・家庭まで、幅広い現場を想定して開発しました。

最終的なアウトプットが「紙に印刷して掲示するもの」であることを前提に設計。こくばん・クレヨン・さくらなど9種類のデザインテーマを用意し、印刷映えする質感とレイアウトにこだわっています。

32種類のテンプレートからシーンに合った当番表を選び、メンバー入力・並び替え・ローテーション設定まで直感的に操作可能。チェックリスト系テンプレートにも対応しています。カード・早見表・カレンダーの3つの表示形式を切り替えられ、土日祝スキップの日付自動ローテーションにも対応。URL・QRコード・LINEでの共有（閲覧用/編集権限付きの2種類）や、メンバー入力後の自動クラウドバックアップ、PWAとしてホーム画面に追加しての利用もでき、登録不要で即利用開始できる体験を目指しました。7ステップのオンボーディングで初回利用をガイドし、PNG画像としてのエクスポートにも対応しています。

マーケティング用LP（`/about`）とResend連携の問い合わせフォーム、`sitemap.xml`・`robots.txt`の動的生成によるSEO基盤も備えています。運用面ではSentryによるエラー監視、HSTS・CSP・Permissions-Policyなどのセキュリティヘッダーを導入し、本番環境の信頼性を確保しています。

本プロジェクトは、Claude Codeのエージェント機能を活用した実験的な開発体制でも進行しています。想定ユーザーのペルソナ（保育士・小学校教諭・事務担当者など）を持つエージェントと、PMロールのエージェントでチームを構成し、要件定義・UI設計・ユーザビリティ検証をAIチーム内で回しながら開発するワークフローを検証しています。人間の開発者は最終的な判断とコードレビューに集中し、AIエージェントがユーザー視点のフィードバックループを担う——という協業モデルの実践です。

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|----------|--------|----------|
| フレームワーク | React (Vite) | SPAで即時レスポンス・Viteの高速ビルドで開発体験を向上 |
| ルーティング | wouter | React Routerの1/10のサイズで軽量・SPAに十分な機能 |
| スタイリング | Tailwind CSS v4 | ユーティリティファーストで高速開発・印刷スタイルにも対応 |
| アニメーション | Framer Motion | 宣言的APIでレイアウトアニメーションを簡潔に記述 |
| UIコンポーネント | shadcn/ui | コピー&ペースト方式で依存を最小化 |
| バックエンド | Hono (Cloudflare Workers) | 軽量・Web標準API準拠・Cloudflare Workersネイティブ対応 |
| データベース | Cloudflare D1 + Drizzle ORM | サーバーレスSQLite互換・型安全なクエリ |
| データ永続化 | localStorage + D1 | ローカルが主データストア・D1でクラウド共有・バックアップ |
| テスト | Vitest + Testing Library + Playwright | 高速なユニットテスト＋PlaywrightによるE2Eテストでフロント〜APIを横断的に検証 |
| エラー監視 | Sentry | 本番環境のエラーをリアルタイムに捕捉・トリアージ |
| メール送信 | Resend | 問い合わせフォームのメール送信をAPIベースで実装 |
| CI/CD | GitHub Actions + Lighthouse CI | PR時にtypecheck・lint・テスト・ビルド・E2Eを自動実行、週次でLighthouse計測 |
| パッケージマネージャ | pnpm | 高速・ディスク効率の良い依存管理 |

## 構成

```
toban-app/
├── client/src/
│   ├── pages/                      # ページコンポーネント
│   │   ├── Home.tsx                # メインページ（当番表の作成・編集）
│   │   ├── useHomeState.ts         # Home用の状態管理フック
│   │   ├── LandingPage.tsx         # マーケティングLP（/about）
│   │   ├── SharedScheduleView.tsx  # 共有リンクの閲覧ページ
│   │   ├── TemplatesPage.tsx       # テンプレート一覧（SEO用LP）
│   │   ├── TemplateDetailPage.tsx  # テンプレート詳細（個別LP）
│   │   ├── Transfer.tsx            # 編集権限の引き継ぎページ
│   │   └── NotFound.tsx            # 404ページ
│   ├── features/home/              # ホーム画面の機能コンポーネント群
│   ├── contexts/                   # React Context（状態共有）
│   ├── components/                 # 共有UIコンポーネント（shadcn/ui）
│   ├── rotation/                   # コア型・ユーティリティ・定数・デフォルト状態
│   ├── hooks/                      # カスタムフック（useAutoSync等）
│   └── lib/                        # APIクライアント・同期マネージャ
├── server/
│   ├── worker.ts                   # Cloudflare Workers エントリーポイント
│   ├── api.ts                      # Hono APIアプリ定義
│   ├── routes/                     # APIルートハンドラ
│   ├── handlers/                   # リクエストハンドラ
│   ├── middleware/                  # 認証・CORS・セキュリティヘッダー
│   ├── schemas/                    # Zodバリデーションスキーマ
│   └── db/                         # Drizzle スキーマ・マイグレーション
├── shared/                         # フロント・バックエンド共有の型定義・Zodスキーマ
└── e2e/                            # Playwright E2Eテスト
```
