# はやしごと

個人事業ポートフォリオサイト。

**URL**: [shigoto.dev](https://shigoto.dev)

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|---------|--------|---------|
| フレームワーク | Astro 6 | 静的HTML出力でJSゼロ配信・コンポーネント共通化でメンテナンス性向上 |
| フロント | HTML / CSS / JavaScript | フレームワークランタイム不要。Astroが静的HTMLに変換 |
| デプロイ | Vercel | Git連携で自動デプロイ・エッジネットワーク・Serverless Functions一体型 |
| メール送信 | Resend | モダンなAPI設計・独自ドメイン送信対応・無料枠で十分 |
| スパム対策 | ハニーポット + 入力バリデーション + 簡易レート制限 | 外部サービス不要で最低限の不正送信対策を維持 |
| フォント | Fontsource (IBM Plex Mono) + システム日本語フォント | 欧文だけを配信して日本語はOS標準に寄せ、転送量を抑制 |
| セキュリティ | vercel.json ヘッダー (CSP, Permissions-Policy等) | 外部依存最小限の構成でCSPを厳格に設定可能 |
| パッケージマネージャ | npm | Node.js標準・追加ツール不要 |

## 構成

```
├── src/
│   ├── pages/              # ページ（Astro）
│   │   ├── index.astro     # トップページ
│   │   ├── 404.astro       # カスタム404ページ
│   │   ├── card.astro      # 名刺ビューアー
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
│   ├── content.config.ts   # Content Collections スキーマ定義
│   ├── scripts/
│   │   ├── main.js         # メインページ用 JavaScript
│   │   └── card.js         # 名刺ビューアー用 JavaScript
│   └── styles/global.css   # グローバルスタイル
├── api/
│   └── send.js             # お問い合わせ送信 (Vercel Serverless Function)
├── public/                 # 静的アセット（画像・robots.txt・sitemap.xml）
├── astro.config.mjs
└── vercel.json             # デプロイ設定・セキュリティヘッダー
```

## コマンド

```sh
npm run dev       # 開発サーバー起動
npm run build     # 本番ビルド
npm run preview   # ビルド後プレビュー
npm run check     # Astroの型・コンテンツ検証
```

## 環境変数（Vercel側で設定）

- `RESEND_API_KEY` — Resend APIキー
- `SITE_URL` — 送信元検証に使う本番URL（省略時は `https://shigoto.dev`）

## ライセンス

コードは参考として公開しています。コンテンツ（テキスト・画像・ロゴ）の無断転載はご遠慮ください。
