---
title: "hikizan — agent workflow plugin"
dirName: "agent-orchestration"
year: 2026
role: "Solo dev"
stack: ["Claude Code Plugin", "Agent Skills", "Bash", "Markdown"]
github: "https://github.com/hayashiii-ghub/hikizan"
description: "レール(skills)・opt-out(standard tier)・floors(hooks)の3部品で自律と確認の塩梅を取り、出口契約として PR を teishutsu 6 セクションに収束させる Claude Code plugin / Agent Skills skill pack。"
order: 3
category: "個人開発"
---

AI agent が長く自走しすぎても、逐一確認を挟まれすぎても開発のテンポが落ちる。その不満から、リスクに応じて自律と確認のバランスを変える Claude Code plugin / Agent Skills 対応 skill pack として設計しました。hikizan はその塩梅を **3 つの部品** で取ります。

- **レール (skills)** — 弱いモデル基準で書いた番号付き手順と穴埋めテンプレ。上から実行すれば形になる。
- **opt-out (standard tier)** — hooks=floors のある環境では、SessionStart に「手順は守らなくてよい。ただし出口は固定」という前文を注入する。賢いモデルにハーネス税をかけず、成果物の形だけ揃える。
- **floors (hooks)** — push / PR / 破壊的操作を決定論的に止める下限。tier に関わらず効く。

**出口契約**: どのモデル・どの進め方でも、PR は `teishutsu` の 6 セクション（過程の trace を残す Workflow 節を含む）に収束させる。任せても流れを後から把握できる、が設計目標です。

名前のとおり「引き算」— 選択肢を増やして全部を抱え込むのではなく、動詞単位で責務を切り、認知負荷を下げることを全 skill の設計原則にしています。

## core 5 skill

| skill | 漢字 | 動詞 | 担当 |
|---|---|---|---|
| `tansaku` | 探索 | 探す | code map / impact scope / terminology scan / すり合わせ |
| `sadoku` | 査読 | 見る | code review / simplify findings |
| `kouchiku` | 構築 | 考える・作る | 設計判断 / 評価 / 計画策定 / 計画実行 / root cause diagnosis |
| `shiken` | 試験 | 試す | TDD discipline / PRUNE |
| `teishutsu` | 提出 | 出す | PR 本文ドラフト / PR 提出フロー (remote / submodule / parent / cwd-aware gh) |

各 SKILL.md は「共通ルール block + モード表 + 番号付き手順 + やってはいけないこと + 穴埋め報告」に絞り、手順詳細は `references/` に置きます。`kouchiku` が controller として判断を保持し、TDD は `shiken`、レビューは `sadoku`、提出は `teishutsu`、探索は `tansaku` に渡します。

ユーティリティ skill `init` (`/hikizan:init`) は規約を project の CLAUDE.md に手動で書き込みたい時だけ使う（model 自動起動は無効）。通常運用では SessionStart hook が routing / ルールを context に注入するため不要です。

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

## tier

tier は「環境構築時にどこまで足場を置いたか」を表します。skill 本文は両 tier 共通（弱いモデル基準のレール）で、違いは opt-out 前文の有無だけです。

- **standard** (hooks=floors のある環境): SessionStart hook が routing / ルールに加えて **opt-out 前文**（手順は自由、出口は固定）を注入。Claude Code の `/plugin` は既定でこれ。host repo の CLAUDE.md は書き換えない。
- **guided** (floors 未導入の環境): skill の番号付き手順を上から実行する。`HIKIZAN_TIER` 環境変数で tier を上書きできる。
- ファイルとして規約を残したい場合のみ `/hikizan:init` で project の CLAUDE.md に追記する。

## hooks による安全網 (floors)

skill 本文が通常フローの手順を示す一方、`hooks/hooks.json` 経由の hooks は「skill を経由しない経路でも止める補完的な検査」を担当します。発火条件の正本は `hooks/conditions.md` です。決定論ロジックは `hooks/tests/` で回帰検査します。

| hook | event | 介入 |
|---|---|---|
| `session-context` | SessionStart | routing / ルール / tier (+ standard なら opt-out 前文) を context に注入（書き込みなし） |
| `pre-push` | PreToolUse `git push` | non-fast-forward / 保護 branch への force を `deny` |
| `pre-destructive` | PreToolUse `rm` / `git reset` / `clean` / `checkout` | 不可逆操作を `ask`（確認要求） |
| `pre-pr-create` | PreToolUse `gh pr create` | draft / reviewer 未指定を `deny` |
| `post-commit` | PostToolUse `git commit` | submodule 未 push を warning |
| `skill-metrics` | PreToolUse `Skill` | 起動された hikizan skill 名を metrics に記録（block しない） |

発火イベントは `~/.hikizan/metrics.jsonl` に 1 行 1 JSON で記録され（`HIKIZAN_METRICS_DIR` で書き込み先を変更可）、block / warn / allow の集計に使えます。

## 配布 — 1 ハーネスに 1 チャネル

hikizan は 2 つの配布チャネルを持ちますが、**1 つのハーネスにはどちらか一方だけ**で入れます。両方入れると skill が二重定義され、古い側に誤 route します。

| ハーネス | 推奨チャネル | 入れない方 |
|---|---|---|
| Claude Code | `/plugin`（hooks=floors も同時に入る） | `npx skills add` は併用しない |
| Cursor / Codex 等 | `npx skills add`（skill pack のみ、hooks なし） | — |

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

Cursor には `beforeShellExecution` hook で CC と同じ floors（force push / 破壊的操作の停止）を移植できます。手順は `docs/cursor-floors.md`。floors を入れた環境は `HIKIZAN_TIER=standard` を宣言してよいです。

Claude Code 上で Codex に委譲したい場合は、hikizan 自体が orchestration 本体を抱え込まず、OpenAI 公式の `openai/codex-plugin-cc` を並行 install する設計です。シンボル探索が必要な言語では CC 公式 marketplace の LSP plugin を併用し、hikizan 側の skill は「シンボル系は LSP、テキスト系は grep、LSP 未設定なら grep にフォールバック」という規約で動きます。

## 設計判断

設計原則の詳細は `docs/principles.md` を参照（レール・opt-out・床 / 弱いモデル基準で書く / 出口契約 / 環境変化評価 / Vertical TDD / 単一ソース 等）。

- **レール・opt-out・床の 3 部品**: 弱いモデルには手順を、強いモデルには出口だけを、全モデルには hooks で下限を提供する
- **動詞ベースの 5 分割**: 探索を `tansaku` に独立させ、設計前の文脈不足を handoff で `kouchiku` に渡せるようにした
- **controller と専門 discipline の分離**: `kouchiku` が設計と計画実行を持ち、TDD は `shiken`、レビューは `sadoku`、提出は `teishutsu` に渡す
- **inline 既定、subagent は明示 gate**: subagent は (a) 重い情報取得 (b) specialist review (c) 機械的 fan-out の 3 つに限定。計画実行は inline を原則とする
- **skill + hooks の二層防御**: skill 本文で正常経路を、hooks と `conditions.md` で skill を経由しない経路を止め、PR 粒度や remote 操作の事故を多重に防ぐ
- **1 ハーネス 1 チャネル**: plugin と skill pack の二経路配布だが、同一ハーネスへの併用は二重定義事故を招くため禁止
- **外部 plugin 併用の明示**: Codex 連携や LSP を hikizan 本体に取り込まず、公式 plugin と namespace を分けて併用する
- **環境変化で完了を見る**: 検証ログは command 出力を根拠にし、「pass しました」のような自己申告を完了証跡にしない
- **引き算の哲学**: 選択肢 + 推奨度 + 1 行根拠で提示し、儀礼的表現を削る。認知負荷の削減を全 skill で一貫させる
