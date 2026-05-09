---
title: "AIエージェント向けCLIツール — sitesnap / pdfmint"
dirName: "agent-tooling"
year: 2026
role: "Solo dev"
stack: ["TypeScript", "Bun", "Playwright", "Puppeteer", "Node.js", "Skill"]
description: "AIエージェント(Claude Code等)から自然言語で呼び出せるCLIツール群。Webサイトのスクリーンショット一括取得(sitesnap)とHTML/MarkdownのPDF化(pdfmint)。"
note: "https://note.com/hayashiii_note/n/ne1336671f1a3"
order: 5
featured: true
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

ウェブサイトのデスクトップ + モバイル版スクリーンショットを sitemap から一気にキャプチャしてローカル保管するツールです。Playwright のブラウザコンテキストに `prefers-reduced-motion: reduce` を送信し、全要素の `animation/transition` を `0.001s` に短縮するCSSを自動注入することで、AOSや wow.js 等のスクロール連動アニメによる撮影漏れを抑えます。データはJSON + PNG構成でDB不要、ポートフォリオ向けにサイトを集めたいというユースケースから派生し、AIエージェントが「このサイト保存して」とお願いするだけで実行できる設計に発展しました。

### pdfmint — HTML/Markdown to PDF

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
