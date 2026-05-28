---
title: "hikizan — agent workflow plugin"
dirName: "agent-orchestration"
year: 2026
role: "Solo dev"
stack: ["Claude Code Plugin", "Agent Skills", "Bash", "Markdown"]
github: "https://github.com/hayashiii-ghub/hikizan"
description: "探索・査読・構築・試験・提出の動詞で責務を分けた core 5 skill と、git push・gh pr create・submodule・CLAUDE.md bootstrap を補完する hooks を同梱した日本語圏チーム開発向け Claude Code plugin / Agent Skills skill pack。"
order: 3
category: "個人開発"
---

AI agent が長く自走しすぎても、逐一確認を挟まれすぎても開発のテンポが落ちる。その不満から、リスクに応じて自律と確認のバランスを変える Claude Code plugin / Agent Skills 対応 skill pack として設計しました。低リスクで推測可能なことは自律で進め、計画の分岐点では確認し、不可逆・破壊的な操作では必ず止まる。固定の折衷点ではなく、場面ごとに振る舞いを切り替えるのが hikizan の役割です。

名前のとおり「引き算」— 選択肢を増やして全部を抱え込むのではなく、動詞単位で責務を切り、認知負荷を下げることを全 skill の設計原則にしています。

## core 5 skill

| skill | 漢字 | 動詞 | 担当 |
|---|---|---|---|
| `tansaku` | 探索 | 探す | code map / impact scope / terminology scan / すり合わせ |
| `sadoku` | 査読 | 見る | code review / findings の整理 |
| `kouchiku` | 構築 | 考える・作る | 設計判断 / 評価 / 計画策定 / 計画実行 / root cause diagnosis |
| `shiken` | 試験 | 試す | TDD discipline / PRUNE |
| `teishutsu` | 提出 | 出す | PR 本文ドラフト / PR 提出フロー (remote / submodule / parent commit / cwd-aware gh) |

動詞で 5 分割した役割境界が原則。`tansaku` は情報取得・構造把握・用語整理・実装前のすり合わせを扱い、判断と実装は行わない。`kouchiku` は controller として設計、計画実行、原因診断を扱い、TDD discipline は `shiken`、レビューは `sadoku`、PR 本文ドラフト / 提出プロセスは `teishutsu` に handoff block で渡します。TDD が必要な層では、`kouchiku` が実装を vertical behavior slice に分解し、`shiken` が 1 slice ごとに RED → GREEN → PRUNE を実行。test level / coverage gap / PRUNE witness は `shiken` の return log に残す方針です。

mode 切替や skill 間 handoff の全体像はリポジトリ内の `docs/workflow.md`（mermaid 図入り）が SoT です。

## trigger 早見表

install 後、自然言語の入力例から各 skill が起動します。

```
"設計どうする"           → kouchiku 通常検討
"探索して" / "全体像を掴んで" → tansaku 探索
"すり合わせ" / "仕様を詰めたい" → tansaku すり合わせ
"計画実行" / "進めて"     → kouchiku 計画実行
"レビューして"           → sadoku 通常レビュー
"整理して" / "simplify"   → sadoku simplify findings
"PR文書いて"            → teishutsu PR 本文ドラフト
"エラー" / "動かない"     → kouchiku diagnosis
"TDDで" / "テストから書いて" → shiken
"PR出す" / "PR提出"     → teishutsu
```

## hooks による安全網

skill 本文が通常フローの手順を示す一方、`hooks/hooks.json` 経由の hooks は「skill を経由しない経路でも止める補完的な検査」を担当します。Claude Code の Bash ツール呼び出しを監視し、定義済みの条件に該当するときだけ介入する条件駆動型です。発火条件の正本は `hooks/conditions.md` です。

- **SessionStart**: `templates/CLAUDE.md` の作業ルールを冪等に bootstrap
- **pre-push**: `git push` 前に non-fast-forward を検出し、`main` / `master` / `develop` への force push を block
- **pre-pr-create**: `gh pr create` に `--draft` も `--reviewer` も無い場合に block
- **post-commit**: submodule pointer 変更後、submodule 側が未 push の場合に warning

発火イベントは `~/.hikizan/metrics.jsonl` に 1 行 1 JSON で記録され（`HIKIZAN_METRICS_DIR` で書き込み先を変更可）、block / warn / allow の集計に使えます。PostToolUse は副作用が完了済みのため warning に留め、block 対象は PreToolUse に限定しています。

## 配布と併用

Claude Code 利用者は plugin 経由が推奨経路です。`.git` 付き HTTPS URL を明示し、GitHub SSH key 未設定の環境でも repository として clone できるようにしています。skill 名は namespace 規約により `/hikizan:tansaku` などで呼び出します。

```bash
/plugin marketplace add https://github.com/hayashiii-ghub/hikizan.git
/plugin install hikizan@hikizan
```

[Agent Skills 標準](https://agentskills.io) にも沿っているため、ハーネス別に `skills` CLI で配置できます。

```bash
# ローカル: 全プロジェクト共通
npx skills add github:hayashiii-ghub/hikizan -g -a cursor -y
npx skills add github:hayashiii-ghub/hikizan -g -a claude-code -y
npx skills add github:hayashiii-ghub/hikizan -g -a codex -y

# Cloud Agent / チーム共有: リポジトリに固定（-g なし → .agents/skills/ をコミット）
npx skills add github:hayashiii-ghub/hikizan -a cursor -y
```

Claude Code 上で Codex に委譲したい場合は、hikizan 自体が orchestration 本体を抱え込まず、OpenAI 公式の `openai/codex-plugin-cc` を並行 install する設計です。シンボル探索が必要な言語では CC 公式 marketplace の LSP plugin を併用し、hikizan 側の skill は「シンボル系は LSP、テキスト系は grep、LSP 未設定なら grep にフォールバック」という規約で動きます。

## 設計判断

- **動詞ベースの 5 分割**: 探索を `tansaku` に独立させ、設計前の文脈不足を handoff で `kouchiku` に渡せるようにした
- **controller と専門 discipline の分離**: `kouchiku` が設計と計画実行を持ち、TDD は `shiken`、レビューは `sadoku`、提出は `teishutsu` に渡す
- **inline 既定、subagent は明示 gate**: subagent は (a) 重い情報取得 (b) specialist review (c) 機械的 fan-out の 3 つに限定。計画実行は inline を原則とする
- **skill + hooks の二層防御**: skill 本文で正常経路を、hooks と `conditions.md` で skill を経由しない経路を止め、PR 粒度や remote 操作の事故を多重に防ぐ
- **plugin と skill pack の二経路配布**: Claude Code には plugin として hooks ごと、その他のエージェントには Agent Skills 標準の skill pack として、同じ `skills/` を配布する
- **外部 plugin 併用の明示**: Codex 連携や LSP を hikizan 本体に取り込まず、公式 plugin と namespace を分けて併用する
- **環境変化で完了を見る**: 検証ログは command 出力を根拠にし、「pass しました」のような自己申告を完了証跡にしない
- **引き算の哲学**: 選択肢 + 推奨度 + 1 行根拠で提示し、儀礼的表現を削る。認知負荷の削減を全 skill で一貫させる
