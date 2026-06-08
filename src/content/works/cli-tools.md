---
title: "AIエージェント向けCLIツール — sitesnap / pdfmint"
dirName: "agent-tooling"
year: 2026
role: "Solo dev"
stack: ["TypeScript", "Bun", "Playwright", "Puppeteer", "Node.js", "Skill"]
description: "AIエージェント(Claude Code等)から自然言語で呼び出せるCLIツール群。Webサイトのスクリーンショット一括取得(sitesnap)とHTML/MarkdownのPDF/PNG化(pdfmint)。"
note: "https://note.com/hayashiii_note/n/ne1336671f1a3"
order: 5
featured: false
category: "個人開発"
tools:
  - name: "sitesnap"
    url: "https://www.npmjs.com/package/@hayashiii/sitesnap"
    github: "https://github.com/hayashiii-ghub/sitesnap"
  - name: "pdfmint"
    url: "https://www.npmjs.com/package/@hayashiii/pdfmint"
    github: "https://github.com/hayashiii-ghub/pdfmint"
---

AIエージェント(Claude Code・Codex等)から自然言語で呼び出せる、構造化出力対応のCLIツール群です。`--json` フラグで stdout に JSON、stderr に進捗ログを分離して返し、エラー時も `code` と `hint` を含む構造体で返却するため、エージェントが結果のパースや自動リトライまで行えます。各パッケージには Claude Code Skill (`skills/<name>/SKILL.md`) を同梱しており、`npm install -g` した瞬間からエージェントが自動認識し、自然言語で呼び出せるようになります。

## 収録ツール

### sitesnap — Webサイト一括スクリーンショット

ウェブサイトのデスクトップ + モバイル版スクリーンショットを sitemap から一気にキャプチャしてローカル保管するツールです。**ポートフォリオ用のサイト集め**を主目的に設計し、出力は JSON + PNG 構成でDB不要。`meta.json` を Astro 等の静的サイトジェネレーターから読み込んで公開ポートフォリオに統合できるスキーマを備えています。

Playwright のブラウザコンテキストに `prefers-reduced-motion: reduce` を送信し、全要素の `animation/transition` を `0.001s` に短縮するCSSを自動注入することで、AOSや wow.js 等のスクロール連動アニメによる撮影漏れを抑えます。それでも真っ白な場合は `--force-visible` で強制表示。失敗ページは `retry` で再取得、`doctor` でキャプチャ結果を診断し再取得案やエージェント向け調査票を生成できます。

| コマンド | 用途 |
|----------|------|
| `sitesnap site <sitemap-url>` | sitemapから全URL展開 → 全ページキャプチャ |
| `sitesnap page <url>` | 単一ページのみキャプチャ |
| `sitesnap list` | キャプチャ済みサイト一覧 |
| `sitesnap retry <domain>` | 失敗したページのみ再取得 |
| `sitesnap doctor <run-dir>` | キャプチャ結果を診断（`--agent-task` で調査票生成） |

### pdfmint — HTML/Markdown to PDF/PNG

HTML / Markdown を綺麗な日本語PDF（＋任意のPNG）に変換する Puppeteer ベースのCLIです。AIエージェントが生成した原稿を、提出・共有しやすい成果物へコマンド一発で変換することを目的に設計。`--json` でメタ情報（出力パス・ファイルサイズ・ページ数・処理時間）を構造化出力します。

Markdown入力時は `--font sans`（既定）で Noto Sans JP、`--font serif` で Noto Serif JP を優先。`--css` でスタイルを固定、`--format` `--margin` `--landscape` `--no-background` といった用紙オプションに加え、`batch` で一括変換、`--png` で高解像度PNG同時生成、`--expect-pages` でページ数の品質チェックが可能です。

| コマンド | 用途 |
|----------|------|
| `pdfmint <input> <output>` | 単一HTML/Markdown→PDF |
| `pdfmint batch <pattern> <out-dir>` | バッチ処理 |

## 共通設計

- **AIエージェントファースト**: stdoutにJSON / stderrに進捗ログを分離し、エラーは `code` + `hint` 構造体で返してリトライしやすくする
- **Bun開発・Node.js配布**: `bun src/cli.ts` でローカル開発しつつ、`dist/cli.js` として Node.js 22+ 環境に配布するハイブリッド構成
- **Claude Code Skill 同梱**: パッケージ内に `skills/<name>/SKILL.md` を含めることで、`npm install -g` 直後にClaude Codeが自動認識
- **DB不要**: sitesnap は JSON + PNG、pdfmint は PDF + 任意PNG として成果物をファイル保存

## 技術スタック

| カテゴリ | ツール | 選定理由 |
|----------|--------|----------|
| 言語/ランタイム | TypeScript / Bun / Node.js 22+ | 開発はBunで高速、配布はNode.jsで広い互換性を確保 |
| ブラウザ自動化 | Playwright (sitesnap) / Puppeteer (pdfmint) | スクショ精度とPDF印刷品質、それぞれの目的に最適なものを選定 |
| エージェント連携 | Claude Code Skill / `--json` 出力 / AGENTS.md | パッケージ同梱の SKILL.md で自然言語呼び出しを実現 |
| 配布 | npm (`@hayashiii` スコープ) | 単一コマンドでグローバルインストール可能 |
| 開発パッケージマネージャ | Bun | 高速インストールと TypeScript 直接実行で開発体験を向上 |
