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

32種類のテンプレートからシーンに合った当番表を選び、メンバー入力・並び替え・ローテーション設定まで直感的に操作可能。チェックリスト系テンプレートにも対応。カード・早見表・カレンダー・円盤（回転ディスク）の4つの表示形式を切り替えられ、円盤は印刷時に「全体／外円／内円」の3枚を出力し、切り抜いて中心をピンで留めれば回せる仕組み。土日祝スキップの日付自動ローテーションにも対応。URL・QRコード・LINEでの共有（閲覧用/編集権限付きの2種類）や、メンバー入力後の自動クラウドバックアップ、ブラウザの印刷機能によるそのままの印刷・PDF保存、PWAとしてホーム画面に追加しての利用もでき、登録不要で即利用開始できる体験を目指しました。フッターの言語ボタンでUIを日本語/英語に切り替え可能（初回はブラウザ言語を判定。テンプレート・テーマ等のコンテンツは日本語のまま）。

マーケティング用LP（`/about`）とResend連携の問い合わせフォームを備えています。運用面ではGitHub ActionsによるCI（lint・型チェック・ユニットテスト・ビルド・E2E）、Lighthouse CIによるパフォーマンス計測、Sentryによる本番エラー監視を導入し、本番環境の信頼性を確保しています。

[WebMCP](https://developer.chrome.com/docs/ai/webmcp)（実験的）にも対応し、対応ブラウザ上のAIエージェントが当番表の閲覧・編集・印刷などをブラウザ内ツールとして直接操作できます。非対応環境では登録を行わない no-op 設計のため、通常利用への影響はありません。

本プロジェクトは、Claude Codeのエージェント機能を活用した実験的な開発体制でも進行しています。想定ユーザーのペルソナ（保育士・小学校教諭・事務担当者など）を持つエージェントと、PMロールのエージェントでチームを構成し、要件定義・UI設計・ユーザビリティ検証をAIチーム内で回しながら開発するワークフローを検証しています。人間の開発者は最終的な判断とコードレビューに集中し、AIエージェントがユーザー視点のフィードバックループを担う——という協業モデルの実践です。

## WebMCP対応（実験的）

Home画面（`/`）で [WebMCP](https://developer.chrome.com/docs/ai/webmcp) のツールを公開しています。`navigator.modelContext` / `document.modelContext` を feature-detect し、対応ブラウザでのみ `registerTool` します。データは既存の localStorage / React state 経路をそのまま使うため、ツール経由の変更も通常操作と同様に自動保存されます。

| ツール | 種別 | 内容 |
|--------|------|------|
| `list_schedules` | 読み取り | 全当番表の一覧（名前・人数・グループ数、表示中を明示） |
| `get_current_assignments` | 読み取り | 表示中の当番表の担当割り当てと回転状況 |
| `get_schedule_details` | 読み取り | 表示中の当番表の設定（メンバー・グループ・回転モード） |
| `get_share_link` | 読み取り | 共有済みなら公開 URL を返す（**公開はしない**。共有はユーザが共有ボタンで実施） |
| `switch_schedule` | 操作 | 名前を指定して表示する当番表を切り替え |
| `advance_rotation` | 操作 | 回転を1つ進める/戻す（手動モードのみ。日付モードは自動のため不可） |
| `set_rotation` | 操作 | 回転を指定の回数に設定（手動モードのみ） |
| `change_view` | 操作 | 表示形式を切り替え（カード / 早見表 / カレンダー / 円盤） |
| `create_schedule` | 操作 | テンプレート名から新しい当番表を作成 |
| `duplicate_schedule` | 操作 | 表示中の当番表を複製 |
| `update_schedule` | 操作 | 表の設定を更新（名前 / ピン留め / 担当者⇄タスク。部分更新） |
| `add_member` | 操作 | 名前を指定してメンバーを追加（色は自動割当） |
| `remove_member` | 操作 | 名前を指定してメンバーを削除（最後の1人は不可） |
| `update_member` | 操作 | メンバーの改名 / 休み(skip)・復帰（名前指定、部分更新） |
| `configure_rotation` | 操作 | 回転方式の設定（手動⇄日付・開始日・周期・土日祝スキップ） |
| `print_schedule` | 操作 | 現在の表示形式で印刷ダイアログを開く |

共有（外部公開）の実行はツールに含めていません。実名を含む当番表の公開は誤操作を避けるため、ユーザの共有ボタン操作に限定し、エージェントは `get_share_link` で既存リンクの参照のみ行えます。実装は `useTobanTools`（`client/src/hooks/useTobanTools.ts`）に集約し、型定義は `client/src/types/webmcp.d.ts`（`navigator.modelContext` / `document.modelContext` の差異もここで吸収）で定義しています。

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|----------|--------|----------|
| フレームワーク | React (Vite) | SPA で即座に操作可能・Vite の高速ビルドで開発体験向上 |
| ルーティング | wouter | 軽量（React Router の 1/10 以下）・SPA に必要十分 |
| スタイリング | Tailwind CSS v4 | ユーティリティファーストでUI構築が高速・印刷用スタイルも容易 |
| アニメーション | Framer Motion | 宣言的なAPI・レイアウトアニメーションが簡潔に書ける |
| UIコンポーネント | shadcn/ui | コピー&ペースト方式で依存を最小限に保てる |
| バックエンド | Hono (Cloudflare Workers) | 軽量・Web標準API準拠・Cloudflare Workersにネイティブ対応 |
| データベース | Cloudflare D1 + Drizzle ORM | SQLite互換でサーバーレス・型安全なクエリ |
| データ永続化 | localStorage + D1 | ローカルが主データストア、D1はクラウド共有・バックアップ層 |
| 多言語 | 自作i18n（ja/en） | UIの枠のみ翻訳・テンプレート等のコンテンツは日本語のまま |
| テスト | Vitest + Testing Library | 高速な実行・React コンポーネントのDOM テストに対応 |
| CI/CD | GitHub Actions + Lighthouse CI | push / PR で lint・型チェック・ユニットテスト・ビルド・E2E・パフォーマンス計測を自動実行 |
| E2Eテスト | Playwright | フロント〜APIを横断したブラウザテスト |
| エラー監視 | Sentry | 本番環境でのランタイムエラーを自動収集（`VITE_SENTRY_DSN` 設定時のみ有効） |
| メール送信 | Resend | お問い合わせフォーム送信用（`wrangler secret put RESEND_API_KEY`） |
| パッケージマネージャ | pnpm | 高速・ディスク効率の良い依存管理 |

## 構成

```
toban-app/
├── client/src/
│   ├── pages/                      # ページコンポーネント
│   │   ├── Home.tsx                # メインページ（/ — 当番表の作成・編集）
│   │   ├── useHomeState.ts         # Homeページの状態管理・hook集約
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
