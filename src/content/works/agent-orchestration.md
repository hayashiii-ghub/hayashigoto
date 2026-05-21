---
title: "hikizan — agent orchestration plugin"
dirName: "agent-orchestration"
year: 2026
role: "Solo dev"
stack: ["Bash", "Claude Code", "Agent Skills", "Markdown"]
github: "https://github.com/hayashiii-ghub/hikizan"
description: "「査読 / 構築 / 探索 / 試験 / 提出」の動詞で責務を分けた core 5 skill、安全網となる hooks、並列開発用の git worktree CLI を同梱した日本語圏チーム開発向け Claude Code plugin。"
order: 3
category: "個人開発"
---

`tw93/Waza` を起点に、`anthropic/superpowers` から選択的に取り込み、日本語圏のチーム開発に最適化した **core 5 skill**、安全網となる **hooks**、並列開発を支える **`wt`** (worktree manager) を同梱した Claude Code plugin です。動詞単位で責務を分けたうえで、名前のとおり「引き算」— 認知負荷の削減を全 skill に貫く設計哲学に据えました。

## core 5 skill

| skill | 漢字 | 動詞 | 担当 |
|---|---|---|---|
| `sadoku` | 査読 | 見る・書く | code review / PR 説明文 |
| `kouchiku` | 構築 | 考える・作る | 設計判断 / 評価 / 計画策定 / 計画実行 |
| `tansaku` | 探索 | 追う | バグ調査 / root cause investigation |
| `shiken` | 試験 | 試す | TDD discipline / PRUNE |
| `teishutsu` | 提出 | 出す | PR 提出フロー (remote / submodule / parent commit) |

動詞で 5 分割した役割境界が原則。`kouchiku` は controller として設計から計画実行までを持ち、原因調査は `tansaku`、TDD discipline は `shiken`、レビュー / PR 文ドラフトは `sadoku`、PR 提出プロセスは `teishutsu` に handoff block で渡します。skill 名は短い英語、本文は日本語に統一し、日本語のレビュー / PR 文を素直に書ける構造にしました。

## hooks による安全網

skill 本文が正常経路での漏れを防ぐ一方、`hooks/hooks.json` 経由の hooks は「skill を経由しない経路でも止める最後の砦」を担当します。Claude Code の Bash ツール呼び出しを監視し、定義済みの条件に該当するときだけ介入する条件駆動型です。

- **SessionStart**: `templates/CLAUDE.md` の作業ルールを冪等に bootstrap
- **pre-push**: `git push` 前に non-fast-forward を検出し、`main` / `master` / `develop` への force push を block
- **pre-pr-create**: `gh pr create` の前提条件をチェック
- **post-commit**: submodule pointer の未 push を warning

発火イベントは `~/.hikizan/metrics.jsonl` に 1 行 1 JSON で記録され、運用の振り返りに使えます。

## bin/wt — git worktree CLI

並列開発で worktree を扱うための bash 単体の CLI。skill とは独立して動き、`wt new <branch>` / `wt ls` / `wt rm` / `wt cleanup` などで worktree の生成・整理ができます。`kouchiku` の計画実行モードや subagent の並列起動と組み合わせる前提で設計しました。Claude Code plugin として install すると、`bin/wt` はセッション中の Bash の `PATH` に自動追加されます。

## 配布

Claude Code 利用者は plugin 経由が推奨経路です。

```bash
/plugin marketplace add https://github.com/hayashiii-ghub/hikizan.git
/plugin install hikizan@hikizan
```

[Agent Skills 標準](https://agentskills.io) にも準拠しているため、`npx skills add github:hayashiii-ghub/hikizan` の 1 コマンドで Cursor / Codex などの skills 対応エージェントにも配置できます。version は固定せず git commit を version として扱い、`/plugin update` で最新の commit に追従します。

## 設計判断

- **動詞ベースの 5 分割**: 「査読 / 構築 / 探索 / 試験 / 提出」を独立 skill にしたことで、handoff block を通して役割が交差せず、判断・検証・提出を分離できる
- **plugin と skill pack の二経路配布**: Claude Code には plugin として hooks ごと、その他のエージェントには Agent Skills 標準の skill pack として、同じ skill 本体 (SoT) を配布する
- **skill + hooks の二層防御**: skill 本文で正常経路を、hooks で skill を経由しない経路を止め、PR 粒度や remote 操作の事故を多重に防ぐ
- **引き算の哲学**: 選択肢 + 推奨度 + 1 行根拠で提示し、儀礼的表現を削る。認知負荷の削減を全 skill で一貫させる
