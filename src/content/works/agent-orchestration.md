---
title: "kufuu — agent orchestration skill pack"
dirName: "agent-orchestration"
year: 2026
role: "Solo dev"
stack: ["Bash", "Agent Skills", "Markdown"]
github: "https://github.com/hayashiii-ghub/kufuu"
description: "「査読 / 構築 / 探索 / 試験」の動詞で責務を分けた Agent Skills と、並列開発を支える git worktree CLI を同梱した skill pack。"
order: 6
category: "個人開発"
---

`tw93/Waza` を起点に、`anthropic/superpowers` から選択的に取り込み、日本語圏のチーム開発に最適化した **core 4 skill** と、並列開発を支える **`wt`** (worktree manager) を含む skill pack です。「waza (技)」に対して「kufuu (工夫)」— 動詞単位で責務を分け、AI エージェントが状況に応じた discipline を呼び出せる構造にしました。

## core 4 skill

| skill | 漢字 | 動詞 | 担当 |
|---|---|---|---|
| `sadoku` | 査読 | 見る・書く | code review / PR 説明文 |
| `kouchiku` | 構築 | 考える・作る | 設計判断 / 評価 / 計画策定 / 計画実行 |
| `tansaku` | 探索 | 追う | バグ調査 / root cause investigation |
| `shiken` | 試験 | 試す | TDD discipline / PRUNE |

動詞で 4 分割した役割境界が原則。`kouchiku` は controller として設計から計画実行までを持ち、原因調査は `tansaku`、TDD discipline は `shiken`、レビュー / PR 文は `sadoku` に handoff block で渡します。

## bin/wt — git worktree CLI

並列開発で worktree を扱うための bash 単体の CLI。skill とは独立して動き、`wt new <branch>` / `wt list` / `wt rm` などで worktree の生成・整理ができます。`kouchiku` の計画実行モードや subagent 並列起動と組み合わせる前提で設計しました。

## 配布

[Agent Skills 標準](https://agentskills.io) に準拠した skill pack なので、`npx skills add github:hayashiii-ghub/kufuu` の 1 コマンドで Claude Code / Cursor / Codex / Cline などの skills 対応エージェントに自動配置できます。

## 設計判断

- **動詞ベースの 4 分割**: 「査読 / 構築 / 探索 / 試験」を独立 skill にしたことで、handoff block を通して役割が交差せず、判断と検証を分離できる
- **日本語圏 team-dev への最適化**: skill 名・出力フォーマット・コメントを日本語にし、日本語のレビュー/PR 文を素直に書ける構造に
- **既存 waza skill との共存**: skill 名 (`sadoku` 等) が waza (`kakunin` 等) と衝突しないため、同じ環境で併用可能
