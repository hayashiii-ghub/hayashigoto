# ポートフォリオサイト 作品コンテンツ更新

- 日付: 2026-05-08
- 対象: `hayashigoto/`(shigoto.dev)
- 種別: コンテンツ更新(コード/スキーマ変更なし)

## 目的

ポートフォリオの作品セクションに2点の更新を加える。

1. 既存 `corporate-redesign` の本番URLを Vercel ドメインから独自ドメインへ差し替える
2. AIエージェント向けCLIツール `sitesnap` / `pdfmint` を「CLIツール集」として1エントリにまとめて新規追加する

## スコープ

- 修正対象は `src/content/works/` 配下の Markdown 2ファイル(1更新 + 1新規)
- スキーマ(`src/content.config.ts`)、ページコンポーネント(`src/pages/works/[id].astro`、`src/pages/index.astro`)は変更しない
- スクリーンショット・名刺画像などのアセット追加は行わない

## 1. `corporate-redesign.md` の URL 変更

`src/content/works/corporate-redesign.md` のフロントマター1行を差し替える:

```yaml
url: "https://tsukurikae.vercel.app"  # 変更前
url: "https://tsukurikae.jp/"          # 変更後
```

本文・技術スタック表・構成図はそのまま。

## 2. `cli-tools.md`(新規)

### ファイルパス

`src/content/works/cli-tools.md`

### フロントマター

```yaml
---
title: "AIエージェント向けCLIツール — sitesnap / pdfmint"
dirName: "cli-tools"
year: 2026
role: "Solo dev"
stack: ["TypeScript", "Bun", "Playwright", "Puppeteer", "Node.js", "Skill"]
description: "AIエージェント(Claude Code等)から自然言語で呼び出せるCLIツール群。Webサイトのスクリーンショット一括取得(sitesnap)とHTML/MarkdownのPDF化(pdfmint)。"
order: 5
featured: true
category: "個人開発"
---
```

`url` と `github` はフロントマターでは未使用。各ツールへのリンクは本文のリストで掲載する。`images` `card` `note` `status` も未指定。

### 本文構成

1. **冒頭1段落** — AIエージェント連携の基本設計
    - `--json` で構造化出力(stdout=JSON / stderr=ログ)
    - エラー時も `code` + `hint` 構造体で返してエージェントが自動リトライしやすい
    - パッケージに Claude Code Skill (`skills/<name>/SKILL.md`) を同梱しており、`npm install -g` した瞬間から自然言語で呼べる
2. **「## 収録ツール」セクション** — 各ツールごとに `### ツール名` 見出しを切り、以下を記載:
    - **sitesnap** — Webサイト一括スクリーンショット
        - npm: `https://www.npmjs.com/package/@hayashiii/sitesnap`
        - GitHub: `https://github.com/hayashiii-ghub/sitesnap`
        - 用途と工夫(2〜3文): Playwrightベース、`prefers-reduced-motion` とアニメ短縮CSSを自動注入、JSON+PNG構成でDB不要、ポートフォリオ向けのサイト集めから派生
    - **pdfmint** — HTML/Markdown to PDF
        - npm: `https://www.npmjs.com/package/@hayashiii/pdfmint`
        - GitHub: `https://github.com/hayashiii-ghub/pdfmint`
        - 用途と工夫(2〜3文): Puppeteerベース、AIエージェントが生成したHTMLをコマンド一発でPDF化、Hiragino Sansを標準指定して日本語綺麗、`--margin` `--format` `--landscape` 等の用紙オプションを提供
3. **「## 共通設計」セクション** — 箇条書き3項目
    - AIエージェントファースト(`--json`構造化出力 + 構造化エラー)
    - Bun開発・Node.js配布(`bun src/cli.ts` で開発し `dist/cli.js` を Node.js 22+ に配布)
    - Claude Code Skill 同梱(`skills/<name>/SKILL.md` をパッケージに含める)
4. **「## 技術スタック」表** — 5〜6行
    - 言語/ランタイム — TypeScript / Bun / Node.js 22+
    - ブラウザ自動化 — Playwright(sitesnap) / Puppeteer(pdfmint)
    - エージェント連携 — Claude Code Skill / `--json` 出力
    - 配布 — npm(`@hayashiii` スコープ)
    - 開発パッケージマネージャ — Bun

## 表示順への影響

`src/pages/index.astro` は `featured !== false` でフィルタ後 `order` 昇順:

| order | dirName | featured |
|---|---|---|
| 1 | full-branding | false(トップ非表示) |
| 2 | corporate-redesign | true |
| 3 | toban-app | true |
| 4 | dashboard | true |
| 4 | freelance-ledger | false(トップ非表示) |
| **5** | **cli-tools(新規)** | **true** |

トップページ「/works」セクションは corporate-redesign → toban-app → dashboard → cli-tools の4件表示になる。`/works` 一覧ページは全件表示なのでcli-toolsも同位置に追加される。

## 副次的な確認

- `[id].astro` は `url`/`github`/`images`/`card` がすべて未指定の場合でも条件分岐により表示が崩れない構造になっている。本文+stack+メタ情報のみ表示される
- `sitemap.xml.ts` が `getCollection('works')` ベースであれば、新規エントリのURLが自動で含まれる(実装時に1度確認する)
- `featured` のスキーマデフォルトは `true` なので、フロントマターでの明示は実装時の好みに従う
- `README.md` の「技術スタック」セクションは依存関係不変のため変更不要

## 検証手順

1. `npm run check` — Astroの型・コンテンツ検証
2. `npm run dev` でローカル起動し、以下4画面を目視確認:
    - `/` — トップページの /works セクションに cli-tools が表示される
    - `/works` — 一覧に cli-tools が含まれる
    - `/works/cli-tools` — 詳細ページが本文・stack・メタ情報のみで崩れず表示される
    - `/works/corporate-redesign` — `tsukurikae.jp` への `> open` リンクに更新されている

## スキーマ拡張をしない理由

`tools: Array<{name, npm, github}>` のような構造体をスキーマに追加すれば cli-tools の各ツールへのリンクを `[id].astro` 側で表示できるが、現時点では:

- cli-toolsエントリは1つのみで、配列フィールドの汎用化を支える需要がない
- スキーマ変更は `[id].astro` のレンダリングロジック追加を伴い、コンテンツ更新の範疇を超える
- 本文(Markdown)中のリストでも npm/GitHub リンクは十分に視認できる

将来CLIツールが3つ以上に増え、視覚的にカード状で並べたいニーズが出たタイミングで拡張する。
