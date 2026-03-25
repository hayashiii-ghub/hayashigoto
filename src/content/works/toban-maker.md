---
title: "当番表メーカー"
dirName: "toban-maker"
year: 2026
role: "Design / Full Stack"
stack: ["Cloudflare", "Hono", "React", "Drizzle ORM"]
url: "https://toban-maker.hayashigoto.workers.dev"
description: "当番表・ローテーション表を簡単に作成できるWebアプリ。印刷前提のデザインと直感操作のUI。"
order: 3
---

幼稚園・保育園・小学校や事務所向けに、当番表・ローテーション表を簡単に作成できるWebアプリを開発しました。

最終的なアウトプットが「紙に印刷して使うもの」であることを前提に設計。印刷映えする質感とレイアウトにこだわり、サイト全体のデザインもそのトーンに合わせています。

メンバーの追加・並び替え・ローテーション設定など、誰でも直感的に操作できるUIを重視。難しい説明なしで更新作業が完結する体験を目指しました。

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
| 状態管理 | localStorage + D1 | ローカル保存を主軸にD1でクラウド同期・共有に対応 |

## 構成

```
toban-maker/
├── client/src/
│   ├── pages/                  # ページコンポーネント
│   ├── features/home/          # ホーム画面の機能コンポーネント
│   ├── components/             # 共有UIコンポーネント（shadcn/ui）
│   ├── contexts/               # テーマ・デザインコンテキスト
│   ├── rotation/               # ローテーションのロジック・型定義
│   ├── hooks/                  # カスタムフック
│   └── lib/                    # APIクライアント・同期マネージャー
├── server/
│   ├── worker.ts               # Cloudflare Workers エントリーポイント
│   ├── api.ts                  # Hono API（レート制限・CORS）
│   ├── routes/schedules.ts     # スケジュールAPI
│   └── db/schema.ts            # Drizzle ORMスキーマ
├── shared/
│   └── types.ts                # フロント・バックエンド共有型定義
└── functions/                  # Cloudflare Pages Functions
```
