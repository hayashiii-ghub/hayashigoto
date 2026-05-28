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

### hikizan スキル（`.agents/skills/`）

このリポジトリには [hikizan](https://github.com/hayashiii-ghub/hikizan) の Agent Skills をプロジェクト scope で同梱している（Cloud Agent VM でも利用可）。更新するとき:

```bash
npx skills update -a cursor -y
# または upstream から再取得
npx skills add github:hayashiii-ghub/hikizan -a cursor -y
```

| スキル | 用途 |
| --- | --- |
| `tansaku` | 未知コードの探索・影響範囲・用語整理（実装前） |
| `kouchiku` | 設計判断・実装計画・承認済み計画の実行 |
| `shiken` | TDD・回帰テスト・ロジック修正 |
| `sadoku` | コードレビュー・所見の整理 |
| `teishutsu` | PR 本文・`gh pr create` までの提出 |

作業の目安:

- 仕様やコードベースが不明 → `tansaku` → `kouchiku`
- 挙動変更・バグ修正 → `shiken`（必要なら `tansaku` 先行）
- 実装後の差分確認 → `sadoku`
- 変更の提出 → `teishutsu`

hooks（`hooks/hooks.json`）は skills 同梱外。ローカルで hooks まで使う場合は hikizan の Claude Code plugin 経路を参照。
