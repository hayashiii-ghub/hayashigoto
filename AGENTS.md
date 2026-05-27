# AGENTS.md

「はやしごと」— 林 祐太の個人事業ポートフォリオサイト（Astro 6 + Vercel）。

## Cursor Cloud specific instructions

### サービス概要

Astro 6 による静的ポートフォリオサイト。パッケージマネージャは **Bun**（`bun.lock` テキスト形式）。
外部サービスは Resend（メール送信）のみで、DB やコンテナは不要。

### コマンド一覧

README.md の「コマンド」セクション参照。主要コマンド:

- `bun dev` — 開発サーバー起動（port 4322）
- `bun run check` — 型チェック（`astro check && tsc --noEmit`）
- `bun run build` — 本番ビルド（prebuild で brand asset 最適化を実行）

### 注意点

- Bun のパスは `$HOME/.bun/bin` にインストールされる。シェルで `export PATH="$HOME/.bun/bin:$PATH"` が必要な場合がある。
- `bun run check` は deprecation hints（`z` is deprecated）を出力するが、error/warning は 0 で正常。
- `/api/send`（お問い合わせフォーム）は `RESEND_API_KEY` 環境変数が未設定だと 500 を返す。サイト閲覧・開発には不要。
- `astro.config.ts` で `host: true` が設定済みのため、dev server は全インターフェースでリッスンする。
