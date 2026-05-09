# はやしごと

個人事業ポートフォリオサイト。

**URL**: [shigoto.dev](https://shigoto.dev)

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|---------|--------|---------|
| フレームワーク | Astro 6 | 静的HTML出力でJSゼロ配信・コンポーネント共通化でメンテナンス性向上 |
| 言語 | TypeScript（strict） | 型安全な開発体験。`astro/tsconfigs/strict` を継承し API/ も型チェック対象 |
| フロント | HTML / CSS / TypeScript | フレームワークランタイム不要。Vite/Astro が静的HTMLにバンドル |
| コンテンツ管理 | Astro Content Collections + Zod | `src/content/works/` の Markdown を統一スキーマで管理し型生成 |
| 画像最適化 | astro:assets `<Image>` | コレクション画像を responsive `srcset` 自動生成（widths/sizes 指定） |
| ページ遷移 | astro:transitions ClientRouter | View Transitions による SPA 的遷移。init は `astro:page-load` で再走 |
| デプロイ | Vercel | Git連携で自動デプロイ・エッジネットワーク・Serverless Functions一体型 |
| メール送信 | Resend | モダンなAPI設計・独自ドメイン送信対応・無料枠で十分 |
| スパム対策 | ハニーポット + 入力バリデーション + 簡易レート制限 | 外部サービス不要で最低限の不正送信対策を維持 |
| フォント | Fontsource (IBM Plex Mono, latin サブセット) + システム日本語フォント | 欧文だけを配信して日本語はOS標準に寄せ、転送量を抑制 |
| ブランド画像 | sharp + to-ico（`prebuild`） | `assets/brand/logo-master.png` から軽量ロゴと各種ファビコンを同じ再現性で生成 |
| セキュリティ | vercel.json ヘッダー (CSP, HSTS, Permissions-Policy 等) | 外部依存最小限の構成で CSP/HSTS/Permissions-Policy を厳格に設定 |
| パッケージマネージャ | npm | Node.js標準・追加ツール不要 |

## 構成

```
├── src/
│   ├── pages/              # ページ（Astro）
│   │   ├── index.astro     # トップページ
│   │   ├── 404.astro       # カスタム404ページ
│   │   ├── sitemap.xml.ts  # 動的サイトマップ生成
│   │   └── works/
│   │       ├── index.astro # 制作実績一覧
│   │       └── [id].astro  # 制作実績詳細（動的ルート）
│   ├── layouts/
│   │   └── Layout.astro    # 共通レイアウト（ヘッダー・フッター・OGP）
│   ├── components/
│   │   ├── Header.astro    # ヘッダーナビゲーション
│   │   ├── Footer.astro    # フッター
│   │   └── SnsLinks.astro  # SNSリンク（Hero・Footer共通）
│   ├── content/works/      # 制作実績データ（Markdown + Content Collections）
│   ├── content.config.ts   # Content Collections スキーマ定義（image() ヘルパで画像も型付き）
│   ├── scripts/
│   │   ├── main.ts         # メインページ用 TypeScript
│   │   └── card.ts         # 名刺ビューアー用 TypeScript
│   └── styles/global.css   # グローバルスタイル
├── assets/
│   ├── brand/              # ロゴの原本（非公開）
│   └── meishi-source/      # 名刺画像の原本（非公開）
├── api/
│   └── send.ts             # お問い合わせ送信 (Vercel Serverless Function)
├── public/                 # 静的アセット（画像・robots.txt・sitemap.xml）
├── astro.config.mjs
└── vercel.json             # デプロイ設定・セキュリティヘッダー
```

## コマンド

```sh
npm run dev       # 開発サーバー起動
npm run build     # 本番ビルド
npm run preview   # ビルド後プレビュー
npm run check     # Astro の型・コンテンツ検証 + tsc --noEmit
```

## 環境変数（Vercel側で設定）

- `RESEND_API_KEY` — Resend APIキー
- `SITE_URL` — 送信元検証に使う本番URL（省略時は `https://shigoto.dev`）

## ライセンス

コードは参考として公開しています。コンテンツ（テキスト・画像・ロゴ）の無断転載はご遠慮ください。
