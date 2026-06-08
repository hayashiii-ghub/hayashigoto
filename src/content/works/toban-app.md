---
title: "toban — かんたん当番表"
dirName: "rotation-table"
year: 2026
role: "Design / Full Stack"
stack: ["Cloudflare", "Hono", "React", "Drizzle ORM", "Vitest", "Playwright", "Sentry"]
url: "https://toban.app"
github: "https://github.com/hayashiii-ghub/toban-app"
note: "https://note.com/hayashiii_note/n/naca284af9f20?sub_rt=share_sb"
description: "掃除当番・給食当番・日直などのローテーション表を作成・印刷・共有できる無料Webアプリ。UIは日本語/英語切替に対応。"
images: ["../../assets/works/rotation-table.webp"]
order: 6
category: "個人開発"
---

掃除当番・給食当番・日直などのローテーション表を作成・印刷・共有できる無料Webアプリ。幼稚園・保育園・小学校・PTA・介護施設・自治会・飲食店・家庭まで、幅広い現場を想定して開発しました。

最終的なアウトプットが「紙に印刷して掲示するもの」であることを前提に設計。こくばん・クレヨン・さくらなど9種類のデザインテーマを用意し、テンプレートごとに推奨テーマを自動適用。印刷映えする質感とレイアウトにこだわっています。

32種類のテンプレートからシーンに合った当番表を選び、メンバー入力・並び替え・ローテーション設定まで直感的に操作可能。チェックリスト系テンプレートにも対応。カード・早見表・カレンダーの3つの表示形式を切り替えられ、土日祝スキップの日付自動ローテーションにも対応。URL・QRコード・LINEでの共有（閲覧用/編集権限付きの2種類）や、メンバー入力後の自動クラウドバックアップ、PWAとしてホーム画面に追加しての利用もでき、登録不要で即利用開始できる体験を目指しました。フッターの言語ボタンでUIを日本語/英語に切り替え可能（初回はブラウザ言語を判定。テンプレート・テーマ等のコンテンツは日本語のまま）。

マーケティング用LP（`/about`）とResend連携の問い合わせフォームを備えています。運用面ではGitHub ActionsによるCI（lint・型チェック・ユニットテスト・ビルド・E2E）、Lighthouse CIによるパフォーマンス計測、Sentryによる本番エラー監視を導入し、本番環境の信頼性を確保しています。

[WebMCP](https://developer.chrome.com/docs/ai/webmcp)（実験的）にも対応し、対応ブラウザ上のAIエージェントが当番表の閲覧・編集・印刷などをブラウザ内ツールとして直接操作できます。非対応環境では登録を行わない no-op 設計のため、通常利用への影響はありません。

本プロジェクトは、Claude Codeのエージェント機能を活用した実験的な開発体制でも進行しています。想定ユーザーのペルソナ（保育士・小学校教諭・事務担当者など）を持つエージェントと、PMロールのエージェントでチームを構成し、要件定義・UI設計・ユーザビリティ検証をAIチーム内で回しながら開発するワークフローを検証しています。人間の開発者は最終的な判断とコードレビューに集中し、AIエージェントがユーザー視点のフィードバックループを担う——という協業モデルの実践です。

## WebMCP対応（実験的）

Home画面（`/`）で [WebMCP](https://developer.chrome.com/docs/ai/webmcp) のツールを公開しています。`navigator.modelContext` / `document.modelContext` を feature-detect し、対応ブラウザでのみ `registerTool` します。データは既存の localStorage / React state 経路をそのまま使うため、ツール経由の変更も通常操作と同様に自動保存されます。

| 種別 | ツール例 |
|------|----------|
| 読み取り | 当番表一覧・担当割り当て・設定詳細・既存共有URLの参照 |
| 操作 | 当番表の切り替え・回転の進行/設定・表示形式の変更・テンプレートからの新規作成・メンバー追加/削除・印刷 |

共有（外部公開）の実行はツールに含めていません。実名を含む当番表の公開は誤操作を避けるため、ユーザの共有ボタン操作に限定し、エージェントは `get_share_link` で既存リンクの参照のみ行えます。実装は `useTobanTools`（`client/src/hooks/useTobanTools.ts`）に集約し、型定義は `client/src/types/webmcp.d.ts` で吸収しています。ツール一覧の詳細は [GitHub README](https://github.com/hayashiii-ghub/toban-app#webmcp-対応実験的) を参照してください。

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
| 多言語 | 自作i18n（ja/en） | UI枠のみ翻訳・テンプレート等のコンテンツは日本語維持 |
| テスト | Vitest + Testing Library | 高速なユニットテスト・ReactコンポーネントのDOMテスト |
| CI/CD | GitHub Actions + Lighthouse CI | PR時にlint・型チェック・テスト・ビルド・E2Eを自動実行、パフォーマンス計測 |
| E2Eテスト | Playwright | フロント〜APIを横断したブラウザテスト |
| エラー監視 | Sentry | 本番環境のエラーをリアルタイムに捕捉（`VITE_SENTRY_DSN` 設定時） |
| メール送信 | Resend | 問い合わせフォームのメール送信をAPIベースで実装 |
| パッケージマネージャ | pnpm | 高速・ディスク効率の良い依存管理 |

## 構成

```
toban-app/
├── client/src/
│   ├── pages/                      # ページコンポーネント
│   │   ├── Home.tsx                # メインページ（/ — 当番表の作成・編集）
│   │   ├── useHomeState.ts         # Home用の状態管理フック
│   │   ├── LandingPage.tsx         # マーケティングLP（/about）
│   │   ├── SharedScheduleView.tsx  # 共有リンクの閲覧ページ
│   │   ├── TemplatesPage.tsx       # テンプレート一覧（SEO用LP）
│   │   ├── TemplateDetailPage.tsx  # テンプレート詳細（個別LP）
│   │   └── Transfer.tsx            # 編集権限の引き継ぎページ
│   ├── features/home/              # ホーム画面の機能コンポーネント群
│   ├── components/                 # 共有UIコンポーネント（shadcn/ui）
│   ├── rotation/                   # コア型・ユーティリティ・定数・デフォルト状態
│   ├── hooks/                      # カスタムフック（useAutoSync・WebMCP登録 useTobanTools 等）
│   ├── lib/                        # APIクライアント・同期マネージャ
│   ├── i18n/                       # 多言語対応（自作i18n・辞書 ja/en）
│   └── types/                      # 型定義（webmcp.d.ts 等）
├── server/
│   ├── worker.ts                   # Cloudflare Workers エントリーポイント
│   ├── api.ts                      # Hono APIアプリ定義
│   ├── routes/                     # APIルートハンドラ（schedules, contact）
│   └── db/                         # Drizzle スキーマ・マイグレーション
├── shared/                         # フロント・バックエンド共有の型定義・Zodスキーマ
└── functions/                      # Cloudflare Pages Functions エントリーポイント
```
