# はやしごと

林 祐太の個人事業ポートフォリオサイト。

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|---------|--------|---------|
| ビルド | Vite 6 | 高速HMR・ゼロコンフィグでバニラJS構成に最適 |
| フロント | HTML / CSS / JavaScript | 5ページの静的サイトにフレームワークは不要。軽量さを維持 |
| デプロイ | Vercel | Git連携で自動デプロイ・エッジネットワーク・Serverless Functions一体型 |
| メール送信 | Resend | モダンなAPI設計・独自ドメイン送信対応・無料枠で十分 |
| スパム対策 | ハニーポット + 入力バリデーション | 外部サービス不要でボットを低コストに排除 |
| アナリティクス | Vercel Analytics | Vercelネイティブ統合・追加設定不要・プライバシー配慮 |
| フォント | Fontsource (IBM Plex Mono, Noto Sans JP) | Google Fonts依存を排除しCLS改善・CSP制御を簡素化 |
| セキュリティ | vercel.json ヘッダー (CSP, Permissions-Policy等) | 外部依存最小限の構成でCSPを厳格に設定可能 |
| パッケージマネージャ | npm | Node.js標準・追加ツール不要 |

## 追加しなかったもの

- **フレームワーク (React/Astro等)** — JS・CSSともに軽量な構成に不要
- **CMS** — 5ページの静的コンテンツに過剰
- **DB** — お問い合わせは送信のみ、保存不要
- **エラー監視 (Sentry等)** — console.error + Vercelログで個人規模には十分
- **レート制限 (Redis等)** — ハニーポット + バリデーションで十分。必要になれば後から追加
- **CDN (Cloudflare等)** — Vercelのエッジネットワークで十分
- **CI/CD** — VercelのGit連携で完結
