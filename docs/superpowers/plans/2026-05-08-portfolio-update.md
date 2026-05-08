# ポートフォリオ更新 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ポートフォリオサイト `hayashigoto/` の作品コンテンツを2点更新する(corporate-redesign URL差し替え + cli-tools 新規エントリ追加)

**Architecture:** Astro Content Collections の Markdown ファイル(`src/content/works/`)を2件編集するのみ。スキーマ・コンポーネント・スタイルは変更しない。検証は `npm run check` と `npm run dev` の目視確認で行う。

**Tech Stack:** Astro 6 / Markdown(Content Collections) / npm

---

## File Structure

| 操作 | パス | 役割 |
|---|---|---|
| Modify | `src/content/works/corporate-redesign.md` | フロントマター `url` を1行差し替え |
| Create | `src/content/works/cli-tools.md` | sitesnap / pdfmint を統合した新規workエントリ |

検証用のコード追加・テストファイル新設は不要。

---

### Task 1: corporate-redesign の URL を差し替える

**Files:**
- Modify: `src/content/works/corporate-redesign.md:8`(`url:` 行)

- [ ] **Step 1: 現在の `url` 行を確認**

Run: `grep -n '^url:' src/content/works/corporate-redesign.md`
Expected: `8:url: "https://tsukurikae.vercel.app"` の1行が出力される

- [ ] **Step 2: `url` を独自ドメインへ書き換え**

`src/content/works/corporate-redesign.md` の8行目を編集する。

変更前:
```yaml
url: "https://tsukurikae.vercel.app"
```

変更後:
```yaml
url: "https://tsukurikae.jp/"
```

他の行は触らない。

- [ ] **Step 3: 差分を確認**

Run: `git diff src/content/works/corporate-redesign.md`

Expected: 1行のみ `-`/`+` で差し替わっている。

```diff
-url: "https://tsukurikae.vercel.app"
+url: "https://tsukurikae.jp/"
```

- [ ] **Step 4: コンテンツ検証**

Run: `npm run check`

Expected: エラーなし(`Result (X files): 0 errors, 0 warnings`)。Astro Content Collections のスキーマ検証が通る。

- [ ] **Step 5: コミット**

```bash
git add src/content/works/corporate-redesign.md
git commit -m "fix(works): corporate-redesign の URL を独自ドメインへ更新"
```

---

### Task 2: `cli-tools.md` 新規エントリを作成する

**Files:**
- Create: `src/content/works/cli-tools.md`

- [ ] **Step 1: 新規ファイルの全文を作成**

`src/content/works/cli-tools.md` を以下の内容で新規作成する。

````markdown
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

AIエージェント(Claude Code・Codex等)から自然言語で呼び出せる、構造化出力対応のCLIツール群です。`--json` フラグで stdout に JSON、stderr に進捗ログを分離して返し、エラー時も `code` と `hint` を含む構造体で返却するため、エージェントが結果のパースや自動リトライまで行えます。各パッケージには Claude Code Skill (`skills/<name>/SKILL.md`) を同梱しており、`npm install -g` した瞬間からエージェントが自動認識し、自然言語で呼び出せるようになります。

## 収録ツール

### sitesnap — Webサイト一括スクリーンショット

- npm: [https://www.npmjs.com/package/@hayashiii/sitesnap](https://www.npmjs.com/package/@hayashiii/sitesnap)
- GitHub: [https://github.com/hayashiii-ghub/sitesnap](https://github.com/hayashiii-ghub/sitesnap)

ウェブサイトのデスクトップ + モバイル版スクリーンショットを sitemap から一気にキャプチャしてローカル保管するツールです。Playwright のブラウザコンテキストに `prefers-reduced-motion: reduce` を送信し、全要素の `animation/transition` を `0.001s` に短縮するCSSを自動注入することで、AOSや wow.js 等のスクロール連動アニメによる撮影漏れを抑えます。データはJSON + PNG構成でDB不要、ポートフォリオ向けにサイトを集めたいというユースケースから派生し、AIエージェントが「このサイト保存して」とお願いするだけで実行できる設計に発展しました。

### pdfmint — HTML/Markdown to PDF

- npm: [https://www.npmjs.com/package/@hayashiii/pdfmint](https://www.npmjs.com/package/@hayashiii/pdfmint)
- GitHub: [https://github.com/hayashiii-ghub/pdfmint](https://github.com/hayashiii-ghub/pdfmint)

HTML / Markdown を綺麗な日本語PDFに変換する Puppeteer ベースのCLIです。AIエージェントが生成したHTMLをコマンド一発でPDF化できるよう設計し、`--json` でメタ情報(出力パス・ファイルサイズ・処理時間)を構造化出力。Markdown入力時はデフォルトCSSで Hiragino Sans を指定し、印刷用 `@page` ルールにも対応。`--format` `--margin` `--landscape` `--no-background` といった用紙オプションを揃えて、請求書・履歴書・レポートまで幅広く扱えます。

## 共通設計

- **AIエージェントファースト**: stdoutにJSON / stderrに進捗ログを分離し、エラーは `code` + `hint` 構造体で返してリトライしやすくする
- **Bun開発・Node.js配布**: `bun src/cli.ts` でローカル開発しつつ、`dist/cli.js` として Node.js 22+ 環境に配布するハイブリッド構成
- **Claude Code Skill 同梱**: パッケージ内に `skills/<name>/SKILL.md` を含めることで、`npm install -g` 直後にClaude Codeが自動認識

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|----------|--------|----------|
| 言語/ランタイム | TypeScript / Bun / Node.js 22+ | 開発はBunで高速、配布はNode.jsで広い互換性を確保 |
| ブラウザ自動化 | Playwright (sitesnap) / Puppeteer (pdfmint) | スクショ精度とPDF印刷品質、それぞれの目的に最適なものを選定 |
| エージェント連携 | Claude Code Skill / `--json` 出力 | パッケージ同梱の SKILL.md で自然言語呼び出しを実現 |
| 配布 | npm (`@hayashiii` スコープ) | 単一コマンドでグローバルインストール可能 |
| 開発パッケージマネージャ | Bun | 高速インストールと TypeScript 直接実行で開発体験を向上 |
````

(末尾の3つのバッククォートは codeblock の閉じなので、コピーする際はファイル本体の内容のみを保存すること)

- [ ] **Step 2: ファイルが作成されたことを確認**

Run: `ls -l src/content/works/cli-tools.md`

Expected: ファイルが存在する(サイズは概ね 2〜3KB)。

- [ ] **Step 3: フロントマター/本文を grep で検査**

Run: `grep -E '^(title|dirName|order|featured|category):' src/content/works/cli-tools.md`

Expected: 5行が出力される(title / dirName / order / featured / category)。

```
title: "AIエージェント向けCLIツール — sitesnap / pdfmint"
dirName: "cli-tools"
order: 5
featured: true
category: "個人開発"
```

- [ ] **Step 4: コンテンツ検証**

Run: `npm run check`

Expected: エラーなし。新規ファイルがスキーマに適合し、`works` collection に追加される。

- [ ] **Step 5: コミット**

```bash
git add src/content/works/cli-tools.md
git commit -m "feat(works): CLIツール集 cli-tools エントリを追加(sitesnap / pdfmint)"
```

---

### Task 3: ローカル起動して目視確認する

**Files:** なし(検証のみ)

- [ ] **Step 1: 開発サーバーを起動**

Run: `npm run dev`

Expected: `http://localhost:4321/` で Astro dev サーバーが起動する。起動エラーがないこと。

- [ ] **Step 2: トップページ `/` を確認**

ブラウザで `http://localhost:4321/` を開く。

確認項目:
- 「/works」セクションに4件が表示される(corporate-redesign / toban-app / dashboard / cli-tools)
- cli-tools が末尾(4件目)に表示される
- 各エントリの description / stack タグが表示される

- [ ] **Step 3: 一覧 `/works` を確認**

ブラウザで `http://localhost:4321/works` を開く。

確認項目:
- 全6件(full-branding / corporate-redesign / toban-app / dashboard / freelance-ledger / cli-tools)が表示される
- cli-tools のカテゴリタグ(`個人開発`)とスタックタグが表示される

- [ ] **Step 4: cli-tools 詳細ページ `/works/cli-tools` を確認**

ブラウザで `http://localhost:4321/works/cli-tools` を開く。

確認項目:
- ヘッダの cli プロンプト行に `cat /works/cli-tools/README.md` と表示される
- title / year / role / category / stack のメタ情報が表示される
- `url` `github` `images` `card` 関連の行が(未指定なので)表示されないが、レイアウトは崩れない
- 本文に「収録ツール」「共通設計」「技術スタック」の3セクションが表示される
- 本文中の sitesnap/pdfmint の npm/GitHub リンクがクリックで開ける

- [ ] **Step 5: corporate-redesign 詳細ページの URL 変更を確認**

ブラウザで `http://localhost:4321/works/corporate-redesign` を開く。

確認項目:
- `> open https://tsukurikae.jp/` の行が表示される(`tsukurikae.vercel.app` ではない)
- リンクをクリックすると `https://tsukurikae.jp/` に遷移する

- [ ] **Step 6: 開発サーバーを停止**

`Ctrl+C` で `npm run dev` を停止する。

- [ ] **Step 7: 検証完了の確認**

検証結果を簡潔にまとめる。問題があれば該当タスクに戻って修正し、再度 Task 3 を実行する。

問題なければ、`git log --oneline -3` で2件のコミットが乗っていることを確認して終了。

```
<sha> feat(works): CLIツール集 cli-tools エントリを追加(sitesnap / pdfmint)
<sha> fix(works): corporate-redesign の URL を独自ドメインへ更新
<sha> docs(specs): ポートフォリオ更新の設計ドキュメントを追加
```

---

## Self-Review

スペック対応:
- [x] corporate-redesign URL差し替え → Task 1
- [x] cli-tools 新規エントリ作成(フロントマター + 本文4セクション + 技術スタック表) → Task 2
- [x] 表示順への影響確認(featured / order=5) → Task 3 Step 2-3
- [x] 詳細ページが `url`/`github`/`images`/`card` 未指定でも崩れないこと確認 → Task 3 Step 4
- [x] `npm run check` による型・コンテンツ検証 → Task 1 Step 4 / Task 2 Step 4
- [x] 4画面の目視確認 → Task 3

プレースホルダ: なし。`<sha>` は最終確認時の git 出力例なのでプレースホルダではなく実際の出力を比較する目印として記載。

型/フィールド一貫性: Task 2 の `dirName: "cli-tools"`、`order: 5`、`featured: true`、`category: "個人開発"` は spec と完全一致。表示順テーブル(Task 3 Step 2)も spec の表と一致。
