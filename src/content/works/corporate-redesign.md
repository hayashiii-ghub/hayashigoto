---
title: "コーポレートサイト フルリニューアル"
dirName: "corporate-redesign"
year: 2026
role: "Design / Frontend"
stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Zod", "Resend"]
description: "リノベーション事業のコーポレートサイトをNext.js 16 (App Router)でフルリニューアル。"
url: "https://tsukurikae.vercel.app"
images: ["/works/corporate-redesign.webp"]
order: 2
---

リノベーション事業を展開する企業のコーポレートサイトをフルリニューアルしたプロジェクトです。Next.js 16のApp Routerを採用し、施工事例の動的ルーティング、Resendによるお問い合わせフォーム、Zodによるサーバー/クライアント共用バリデーションを実装しました。

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|----------|--------|----------|
| フレームワーク | Next.js 16 (App Router) | RSC・SSG対応でパフォーマンスとSEOを両立 |
| フロント | React 19 / TypeScript / Tailwind CSS v4 | 型安全かつユーティリティファーストで高速開発 |
| デプロイ | Vercel | Git連携で自動デプロイ・エッジネットワーク・Serverless Functions一体型 |
| メール送信 | Resend | モダンなAPI設計・独自ドメイン送信対応・無料枠で十分 |
| スパム対策 | ハニーポット + バリデーション + レート制限 + Content-Length 早期拒否 | 外部サービス不要で不正送信対策を維持 |
| セキュリティ | next.config.mjs ヘッダー (HSTS, Permissions-Policy等) | 外部依存なしでセキュリティヘッダーを一元管理 |
| 画像高解像度化 | NanoBananaPro | 事業内容ページの背景画像をAIアップスケーリング |
| バリデーション | Zod 4 (v4/classic) | サーバー/クライアント共用・TypeScript親和性が高い |
| ユーティリティ | clsx + tailwind-merge | 条件付きクラス結合・Tailwind競合解消 |
| アニメーション | tw-animate-css | Tailwind CSS v4対応のアニメーションユーティリティ |
| アイコン | Lucide React | 軽量・Tree-shakeable・アイコン数が豊富 |
| Lint | ESLint 9 + eslint-config-next | Next.js公式推奨構成 |
| パッケージマネージャ | npm | Node.js標準・追加ツール不要 |

## 構成

```
├── app/
│   ├── page.tsx            # トップページ
│   ├── layout.tsx          # 共通レイアウト（ヘッダー・フッター・OGP）
│   ├── globals.css         # グローバルスタイル
│   ├── error.tsx           # エラーバウンダリ
│   ├── not-found.tsx       # 404ページ
│   ├── robots.ts           # robots.txt 生成
│   ├── sitemap.ts          # サイトマップ生成
│   ├── contact/
│   │   └── page.tsx        # お問い合わせページ
│   ├── privacy/
│   │   └── page.tsx        # プライバシーポリシー
│   ├── works/
│   │   ├── page.tsx        # 施工事例一覧
│   │   ├── loading.tsx     # ローディングUI
│   │   └── [slug]/
│   │       └── page.tsx    # 施工事例詳細（動的ルーティング）
│   └── api/
│       └── contact/
│           └── route.ts    # お問い合わせ送信（Serverless Function）
├── components/             # UIコンポーネント
├── hooks/                  # カスタムフック
├── lib/                    # 設定・ユーティリティ・バリデーション
└── public/                 # 静的アセット
```
