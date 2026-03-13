# はやしごと

林 祐太の個人事業ポートフォリオサイト。

**URL**: [shigoto.dev](https://shigoto.dev)

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|---------|--------|---------|
| ビルド | Vite 6 | 高速HMR・ゼロコンフィグでバニラJS構成に最適 |
| フロント | HTML / CSS / JavaScript | 静的サイトにフレームワークは不要。軽量さを維持 |
| デプロイ | Vercel | Git連携で自動デプロイ・エッジネットワーク・Serverless Functions一体型 |
| メール送信 | Resend | モダンなAPI設計・独自ドメイン送信対応・無料枠で十分 |
| スパム対策 | ハニーポット + 入力バリデーション | 外部サービス不要でボットを低コストに排除 |
| アナリティクス | Vercel Analytics | Vercelネイティブ統合・追加設定不要・プライバシー配慮 |
| フォント | Fontsource (IBM Plex Mono, Noto Sans JP) | Google Fonts依存を排除しCLS改善・CSP制御を簡素化 |
| セキュリティ | vercel.json ヘッダー (CSP, Permissions-Policy等) | 外部依存最小限の構成でCSPを厳格に設定可能 |
| パッケージマネージャ | npm | Node.js標準・追加ツール不要 |

## 構成

```
├── index.html          # トップページ
├── card.html           # 名刺ビューアー
├── card.js             # 名刺ビューアーのインタラクション
├── main.js             # 共通スクリプト
├── style.css           # 共通スタイル
├── api/
│   └── send.js         # お問い合わせ送信 (Vercel Serverless Function)
├── works/
│   ├── index.html      # 制作実績一覧
│   ├── brand-site.html # 一気通貫ブランディング
│   ├── corporate-renewal.html
│   ├── toban-maker.html
│   └── dashboard.html  # 図面記号検出システム
├── public/             # 静的アセット（画像・robots.txt・sitemap.xml）
├── vite.config.js
└── vercel.json         # デプロイ設定・セキュリティヘッダー
```

## コマンド

```sh
npm run dev       # 開発サーバー起動
npm run build     # 本番ビルド
npm run preview   # ビルド後プレビュー
```

## 環境変数（Vercel側で設定）

- `RESEND_API_KEY` — Resend APIキー

## ライセンス

コードは参考として公開しています。コンテンツ（テキスト・画像・ロゴ）の無断転載はご遠慮ください。
