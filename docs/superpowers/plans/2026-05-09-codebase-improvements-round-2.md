# Codebase Improvements (Round 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Round 1 (TS 移行) で残った範囲を埋め、Round 1 のレビューで挙がった follow-up と完遂しきれなかった a11y refactor を片付け、ツール周りを Node 24 のネイティブ TS 実行に揃える。

**Architecture:** Vercel が Node 24.x を使っている事実（dashboard で確認済）に乗って、`astro.config.mjs` と `scripts/optimize-brand-assets.mjs` を **追加依存ゼロ** で TS 化。その他は Round 1 のレビュアー指摘に従って api/send.ts の初期化と DOM 取得の null-safety を整える。a11y は h2/button refactor の続きで dir-entry を `<div role="button">` から `<button>` に置換する。

**Tech Stack:**
- Node 24 (Vercel) / Node 25 (local) — どちらも `node script.ts` をフラグなしで実行
- 既存: Astro 6 + TypeScript strict + tsconfig include
- 新規 deps: なし

**スコープ外:**
- CSP `'unsafe-inline'` 削除（Shiki テーマ刷新が必要なので別 plan）
- パッケージマネージャ変更（npm のまま）
- Tests / Prettier 導入（portfolio 規模では ROI 弱）
- ロゴのさらなる圧縮（Round 1 で 360KB まで縮小済）

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `astro.config.mjs` | Rename → `astro.config.ts` | Astro 設定（型安全化） |
| `scripts/optimize-brand-assets.mjs` | Rename → `scripts/optimize-brand-assets.ts` | prebuild 用画像最適化スクリプト |
| `package.json` | Modify | `optimize:assets` script のパスと `engines.node` |
| `src/pages/index.astro` | Modify | dir-entry 5 箇所を `<button>` ベースに |
| `src/pages/works/index.astro` | Modify | dir-entry 1 箇所を `<button>` ベースに |
| `src/styles/global.css` | Modify | `.dir-entry-toggle` 追加 + 既存セレクタ調整 |
| `src/scripts/main.ts` | Modify | `initDirToggle` のキーボードハンドラ削除 + null-safe contact form |
| `api/send.ts` | Modify | Resend 初期化の遅延化 + `getClientIp` の `??` 統一 |

---

## Task 1: Tooling 整理 — astro.config / build script の TS 化 + engines.node

**Files:**
- Rename: `/Users/hayashi/Desktop/hayashigoto/astro.config.mjs` → `astro.config.ts`
- Rename: `/Users/hayashi/Desktop/hayashigoto/scripts/optimize-brand-assets.mjs` → `scripts/optimize-brand-assets.ts`
- Modify: `/Users/hayashi/Desktop/hayashigoto/package.json`

- [ ] **Step 1: `astro.config.mjs` を TS 化**

```bash
cd /Users/hayashi/Desktop/hayashigoto
git mv astro.config.mjs astro.config.ts
```

ファイル内容は変更不要（Astro の `defineConfig` が型を自動的に推論するため）。中身:
```ts
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shigoto.dev',
  trailingSlash: 'never',
  server: {
    port: 4322,
    host: true,
  },
  preview: {
    port: 4323,
    host: true,
  },
});
```

- [ ] **Step 2: `scripts/optimize-brand-assets.mjs` を TS 化**

```bash
cd /Users/hayashi/Desktop/hayashigoto
git mv scripts/optimize-brand-assets.mjs scripts/optimize-brand-assets.ts
```

`scripts/optimize-brand-assets.ts` の現状コードに最低限の型注釈を加える。`to-ico` は型定義がないので ambient declaration を1ファイル追加する。

新規ファイル `/Users/hayashi/Desktop/hayashigoto/scripts/types/to-ico.d.ts`:
```ts
declare module 'to-ico' {
  const toIco: (buffers: Buffer[]) => Promise<Buffer>;
  export default toIco;
}
```

`scripts/optimize-brand-assets.ts` 自体は `main()` 関数の戻り値を `Promise<void>` に明示する程度でよい:
```ts
async function main(): Promise<void> {
  // 既存ロジックそのまま
}
```

`sharp` と `node:fs` / `node:path` / `node:url` は型定義同梱なので追加作業不要。

- [ ] **Step 3: tsconfig.json の include を `scripts/**/*` まで広げる**

`/Users/hayashi/Desktop/hayashigoto/tsconfig.json` を:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src/**/*", "api/**/*", "scripts/**/*", ".astro/types.d.ts"]
}
```
に変更（`scripts/**/*` を追加）。これで `astro.config.ts` は project root にあるので別途明示不要だが、`scripts/optimize-brand-assets.ts` は include されるようにする。

注: `astro.config.ts` 自体は Astro が読み込む際に内部で TS をハンドリングするため、`include` に project root（`./*.ts`）を入れる必要は薄いが、tsc の noEmit 検査対象にしたい場合は `include` に `astro.config.ts` を追加する。今回は既存の `src/**/*` パターンで十分なら追加しなくて OK。実際には不要のはずなので Step 3 は **scripts/ のみ追加**。

- [ ] **Step 4: package.json の `optimize:assets` スクリプトを更新 + `engines` を追加**

`/Users/hayashi/Desktop/hayashigoto/package.json` を:
```json
{
  "name": "hayashigoto",
  "version": "0.0.1",
  "type": "module",
  "private": true,
  "engines": {
    "node": ">=22.6.0"
  },
  "scripts": {
    "optimize:assets": "node scripts/optimize-brand-assets.ts",
    "prebuild": "npm run optimize:assets",
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check && tsc --noEmit"
  },
  ...
}
```

`engines.node` は Node 24 (Vercel) と Node 22.6+ (TS strip-types stable boundary) を両方カバーする `>=22.6.0` で固定。
`optimize:assets` の値を `.mjs` → `.ts` に変更。

- [ ] **Step 5: prebuild 動作確認**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run optimize:assets 2>&1 | tail -10
```

期待: 既存の出力（`optimize-brand-assets: { master: { width: ..., height: ... }, hero: ..., faviconTrimmed: ... }`）または master/favicon master が無い場合の fail-soft メッセージ。

- [ ] **Step 6: 型チェック + ビルド**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check 2>&1 | tail -10
```
期待: 0 errors / 0 warnings.

```bash
npm run build 2>&1 | tail -8
```
期待: 8 page(s) built.

- [ ] **Step 7: コミット**

```bash
git add astro.config.ts scripts/optimize-brand-assets.ts scripts/types/to-ico.d.ts package.json tsconfig.json
git commit -m "$(cat <<'EOF'
chore(ts): astro.config と build script を TypeScript 化、engines.node を明記

- astro.config.mjs → .ts (型推論のみ、追加注釈なし)
- scripts/optimize-brand-assets.mjs → .ts (Promise<void> + to-ico の ambient 型)
- tsconfig include に scripts/** を追加
- package.json に "engines": { "node": ">=22.6.0" } を追加
  Node 24 (Vercel) / Node 22.6+ ローカルどちらも node コマンドで .ts 直接実行可能

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: dir-entry を `<button>` ベースに refactor (a11y completion)

**Files:**
- Modify: `/Users/hayashi/Desktop/hayashigoto/src/pages/index.astro` (5 箇所)
- Modify: `/Users/hayashi/Desktop/hayashigoto/src/pages/works/index.astro` (1 箇所)
- Modify: `/Users/hayashi/Desktop/hayashigoto/src/styles/global.css`
- Modify: `/Users/hayashi/Desktop/hayashigoto/src/scripts/main.ts`

### Step 1: 既存構造を把握

`src/pages/index.astro` の line 89, 101, 110, 148, 159 が `<div class="dir-entry ..." data-toggle role="button" aria-expanded="false" tabindex="0">`。
`src/pages/works/index.astro` の line 28 が同様。

各 dir-entry の中身は:
```astro
<div class="dir-entry cli-reveal" data-toggle role="button" aria-expanded="false" tabindex="0">
  <span class="dir-branch">├──</span>
  <span class="dir-name">{...}</span>
  {/* category-tag, status-tag が任意で兄弟として続く */}
  <div class="dir-expand">...</div>
</div>
```

クリック時挙動: `.dir-name` をクリックで toggle (main.ts の initDirToggle)。tags をクリックしても toggle しない。

### Step 2: index.astro を refactor

5 箇所すべてを以下パターンに変更:

**Before:**
```astro
<div class="dir-entry cli-reveal" data-toggle role="button" aria-expanded="false" tabindex="0">
  <span class="dir-branch">├──</span>
  <span class="dir-name">profile.yml</span>
  <div class="dir-expand">
    ...
  </div>
</div>
```

**After:**
```astro
<div class="dir-entry cli-reveal" data-toggle>
  <button type="button" class="dir-entry-toggle" aria-expanded="false">
    <span class="dir-branch">├──</span>
    <span class="dir-name">profile.yml</span>
  </button>
  <div class="dir-expand">
    ...
  </div>
</div>
```

`role="button" tabindex="0"` を削除し、内側に `<button class="dir-entry-toggle">` を入れる。`aria-expanded` は button 側に移動。

注意点 — works section の dir-entry は `category-tag` / `status-tag` を sibling に持つ:
```astro
<div class="dir-entry cli-reveal" data-toggle role="button" aria-expanded="false" tabindex="0">
  <span class="dir-branch">├──</span>
  <span class="dir-name">{work.data.dirName}/</span>{work.data.category && <span class="category-tag">...</span>}{work.data.status && <span class="status-tag">...</span>}
  <div class="dir-expand">...</div>
</div>
```

これも button は dir-branch + dir-name のみ wrap し、tags は **button の外に置く**:
```astro
<div class="dir-entry cli-reveal" data-toggle>
  <button type="button" class="dir-entry-toggle" aria-expanded="false">
    <span class="dir-branch">├──</span>
    <span class="dir-name">{work.data.dirName}/</span>
  </button>{work.data.category && <span class="category-tag">{work.data.category}</span>}{work.data.status && <span class="status-tag">{work.data.status}</span>}
  <div class="dir-expand">...</div>
</div>
```

`more/` block (line 159) も同様パターン。

### Step 3: works/index.astro を refactor

1 箇所 (line 28) を index.astro と同じパターンで:
```astro
<div class="dir-entry" data-toggle>
  <button type="button" class="dir-entry-toggle" aria-expanded="false">
    <span class="dir-branch">{isLast ? '└──' : '├──'}</span>
    <span class="dir-name">{work.data.dirName}/</span>
  </button>{work.data.category && <span class="category-tag">{work.data.category}</span>}{work.data.status && <span class="status-tag">{work.data.status}</span>}
  <div class="dir-expand">
    ...
  </div>
</div>
```

### Step 4: global.css を更新

`.dir-entry-toggle` クラスを追加し、既存の `.dir-entry[data-toggle] > .dir-name` 系セレクタを button 内ネスト構造に合わせて修正。

`/Users/hayashi/Desktop/hayashigoto/src/styles/global.css` の Directory Tree セクション内、`/* Toggleable entries */` の下:

**Before:**
```css
/* Toggleable entries */
.dir-entry[data-toggle] > .dir-name {
  cursor: pointer;
  transition: color 0.2s;
}

.dir-entry[data-toggle] > .dir-name:hover {
  color: var(--accent-hover);
}

.dir-entry[data-toggle] > .dir-name::before {
  content: "[+] ";
  color: var(--text-dim);
  font-weight: 300;
  font-size: 0.8em;
}

.dir-entry[data-toggle].is-open > .dir-name::before {
  content: "[-] ";
  color: var(--accent-light);
}
```

**After:**
```css
/* Toggleable entries — button-based */
.dir-entry-toggle {
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-align: left;
  display: inline;
  transition: color 0.2s;
}

.dir-entry-toggle:hover .dir-name {
  color: var(--accent-hover);
}

.dir-entry-toggle:focus-visible {
  outline: 1px solid var(--accent-light);
  outline-offset: 2px;
  border-radius: 2px;
}

.dir-entry[data-toggle] .dir-name::before {
  content: "[+] ";
  color: var(--text-dim);
  font-weight: 300;
  font-size: 0.8em;
}

.dir-entry[data-toggle].is-open .dir-name::before {
  content: "[-] ";
  color: var(--accent-light);
}
```

ポイント:
- `display: inline` で `<button>` を span 同等にレイアウト（dir-branch / dir-name は inline 配置を維持）
- `[+] ` / `[-] ` のセレクタは direct child `>` をやめて descendant にすることでネスト深さに依存しない

### Step 5: main.ts の initDirToggle を更新

`/Users/hayashi/Desktop/hayashigoto/src/scripts/main.ts` の `initDirToggle`:

**Before（要約）:**
```ts
function initDirToggle(): void {
  document.querySelectorAll<HTMLElement>('.dir-entry[data-toggle]').forEach(entry => {
    const name = entry.querySelector<HTMLElement>(':scope > .dir-name');
    if (!name) return;
    function toggle(e: Event): void {
      e.stopPropagation();
      const opening = !entry.classList.contains('is-open');
      entry.classList.toggle('is-open');
      entry.setAttribute('aria-expanded', String(opening));
    }
    name.addEventListener('click', toggle);
    entry.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(e);
      }
    });
  });
}
```

**After:**
```ts
function initDirToggle(): void {
  document.querySelectorAll<HTMLElement>('.dir-entry[data-toggle]').forEach(entry => {
    const btn = entry.querySelector<HTMLButtonElement>(':scope > .dir-entry-toggle');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const opening = !entry.classList.contains('is-open');
      entry.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(opening));
    });
  });
}
```

変更点:
- `name` (dir-name) ではなく button 自体にクリックリスナを attach
- keydown ハンドラを削除（`<button>` は Enter/Space をネイティブに発火）
- aria-expanded を button 側に set

### Step 6: initToggleAll の aria-expanded セットも button 側に変更

main.ts の initToggleAll は section 内の各 `.dir-entry[data-toggle]` に `is-open` をトグルし、`aria-expanded` を **entry に** セットしている。entry にはもう `aria-expanded` は無いので、各 entry の **内部 button に** セットするよう修正:

**Before（該当箇所）:**
```ts
entries.forEach((entry, i) => {
  setTimeout(() => {
    if (allOpen) {
      entry.classList.remove('is-open');
      entry.setAttribute('aria-expanded', 'false');
    } else {
      entry.classList.add('is-open');
      entry.setAttribute('aria-expanded', 'true');
    }
  }, i * 80);
});
```

**After:**
```ts
entries.forEach((entry, i) => {
  setTimeout(() => {
    const isOpening = !allOpen;
    entry.classList.toggle('is-open', isOpening);
    const innerBtn = entry.querySelector<HTMLButtonElement>(':scope > .dir-entry-toggle');
    if (innerBtn) innerBtn.setAttribute('aria-expanded', String(isOpening));
  }, i * 80);
});
```

### Step 7: initScrollReveal の aria-expanded セットも調整

main.ts の `initScrollReveal` の sessionStorage 既出パスで `el.setAttribute('aria-expanded', 'true')` を呼んでいるが、`el` は entry そのもの（dir-entry div）。同様に内部 button にセットする:

**Before:**
```ts
items.forEach(el => {
  el.classList.add('is-visible');
  if (el.classList.contains('dir-entry')) {
    el.classList.add('is-open');
    el.setAttribute('aria-expanded', 'true');
  }
});
```

**After:**
```ts
items.forEach(el => {
  el.classList.add('is-visible');
  if (el.classList.contains('dir-entry')) {
    el.classList.add('is-open');
    const innerBtn = el.querySelector<HTMLButtonElement>(':scope > .dir-entry-toggle');
    if (innerBtn) innerBtn.setAttribute('aria-expanded', 'true');
  }
});
```

`revealElement` 内も同様:
```ts
function revealElement(el: HTMLElement, onDone: () => void): void {
  el.classList.add('is-visible');
  if (el.classList.contains('dir-entry')) {
    setTimeout(() => {
      el.classList.add('is-open');
      const innerBtn = el.querySelector<HTMLButtonElement>(':scope > .dir-entry-toggle');
      if (innerBtn) innerBtn.setAttribute('aria-expanded', 'true');
      setTimeout(onDone, 100);
    }, 120);
  } else {
    setTimeout(onDone, 150);
  }
}
```

### Step 8: 型チェック + ビルド + 視覚確認

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check 2>&1 | tail -10
npm run build 2>&1 | tail -8
```
期待: 0 errors / 8 page(s) built。

(視覚確認は実際のブラウザで開いて、各 dir-entry が click / Enter / Space で展開すること、Tab でフォーカス移動すること、開閉アイコン `[+] / [-]` が変わること、を確認。)

### Step 9: コミット

```bash
git add src/pages/index.astro src/pages/works/index.astro src/styles/global.css src/scripts/main.ts
git commit -m "$(cat <<'EOF'
feat(a11y): dir-entry を div role=button から real <button> に refactor

h2/button refactor の続き。各 dir-entry の clickable 部分を
<button class="dir-entry-toggle"> でラップし、role=button + tabindex=0 +
keydown ハンドラの自前実装を撤廃。Enter/Space はネイティブ任せ、
focus 表示も button のデフォルトに乗せる。

main.ts の initDirToggle / initToggleAll / initScrollReveal で
aria-expanded を内部 button に set するよう調整。

CSS の `.dir-entry[data-toggle] > .dir-name` 系セレクタを
descendant 形に書き換え、`.dir-entry-toggle` のリセット +
:focus-visible スタイルを追加。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: api/send.ts cleanup (Round 1 review follow-ups)

**Files:**
- Modify: `/Users/hayashi/Desktop/hayashigoto/api/send.ts`

Round 1 の code-quality reviewer が flag した 2 点を解消:

### Issue A — Resend 初期化を handler 内へ

**Before（モジュールトップ）:**
```ts
const resend = new Resend(process.env.RESEND_API_KEY ?? '');
```
`?? ''` で空文字を Resend に渡すと、初期化時には何も起きず、実際に send() 呼び出し時にエラーが出る。これは「安全に見えるが何もしない」コードで、`if (!process.env.RESEND_API_KEY)` 二重ガードのうち module-level 側が無駄になっている。

**After:**
モジュールトップから削除。handler 内、`if (!process.env.RESEND_API_KEY)` チェック後に locally 初期化:

```ts
// Module top
import { Resend } from 'resend';
import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE_URL = process.env.SITE_URL || 'https://shigoto.dev';
// ...rest of constants

// (resend declaration を削除)

// Inside handler:
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  // ...origin/method/content-type checks...

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'メール設定が未構成です' });
  }

  // ...rate limit / validation...

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({ ... });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'メール送信に失敗しました' });
  }
}
```

これで:
- 環境変数未設定時に `Resend` インスタンスが作られない（無駄なオブジェクト生成回避）
- `apiKey` のローカル変数は narrowing 後の `string` 型なのでキャスト不要
- 既存の 500 レスポンスは変更なし（仕様維持）

### Issue B — `getClientIp` の戻り値型一致

**Before:**
```ts
function pickHeader(value: HeaderValue): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== 'string' || !v) return null;
  return v.split(',')[0].trim();
}

function getClientIp(req: VercelRequest): string {
  return (
    pickHeader(req.headers['x-vercel-forwarded-for']) ||
    pickHeader(req.headers['x-real-ip']) ||
    pickHeader(req.headers['x-forwarded-for']) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
```
`pickHeader` は `string | null` を返し、`req.socket?.remoteAddress` は `string | undefined`。`||` チェーンで動作はするが null/undefined が混在していて分かりにくい。

**After:**
`pickHeader` の戻り値を `string | undefined` に統一し、`getClientIp` は `??` で書く:

```ts
function pickHeader(value: HeaderValue): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== 'string' || !v) return undefined;
  return v.split(',')[0].trim();
}

function getClientIp(req: VercelRequest): string {
  return (
    pickHeader(req.headers['x-vercel-forwarded-for']) ??
    pickHeader(req.headers['x-real-ip']) ??
    pickHeader(req.headers['x-forwarded-for']) ??
    req.socket?.remoteAddress ??
    'unknown'
  );
}
```

`||` → `??` で空文字を「値あり」扱いにすると逆に困るが、`pickHeader` は空文字を弾いた上で `undefined` を返すので問題なし。

### Step 1: api/send.ts を読み直して上記 2 点を修正

`/Users/hayashi/Desktop/hayashigoto/api/send.ts` を Read。

### Step 2: Issue A を適用（Resend 初期化を handler 内へ）

モジュールトップの `const resend = new Resend(process.env.RESEND_API_KEY ?? '');` 行を削除。

handler 内の `if (!process.env.RESEND_API_KEY) { return res.status(500).json(...); }` ブロックの直後（rate limit より前 or 後はどちらでも良い、既存コードの順序を維持）で:
```ts
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  return res.status(500).json({ error: 'メール設定が未構成です' });
}
```
に置き換え。

`try { await resend.emails.send(...) }` 直前で:
```ts
const resend = new Resend(apiKey);
```
を追加。

### Step 3: Issue B を適用（pickHeader 戻り値を undefined に揃える）

`pickHeader` の戻り型 `string | null` → `string | undefined`、`return null` → `return undefined`。
`getClientIp` の `||` → `??` 4 箇所。

### Step 4: 型チェック + ビルド

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check 2>&1 | tail -10
```
期待: 0 errors.

### Step 5: コミット

```bash
git add api/send.ts
git commit -m "$(cat <<'EOF'
refactor(api): Resend 初期化を handler 内へ移し、IP 取得を ?? で統一

- Round 1 review follow-up
- module-level の new Resend(apiKey ?? '') は二重ガードになっていた。
  RESEND_API_KEY チェック後に handler 内で初期化するよう変更
- pickHeader の戻り型を string | null → string | undefined に統一し
  getClientIp の || チェーンを ?? に変更

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: contact form の field 取得を null-safe に

**Files:**
- Modify: `/Users/hayashi/Desktop/hayashigoto/src/scripts/main.ts`

Round 1 の reviewer から指摘:
```ts
category: (form.elements.namedItem('category') as HTMLSelectElement).value,
name: (form.elements.namedItem('name') as HTMLInputElement).value,
// ...
```
`namedItem` は null を返しうるのに `as HTMLSelectElement` で握りつぶしている。HTML 構造変更時に runtime error になる。

### Step 1: getField ヘルパを追加

`src/scripts/main.ts` 内、`initContactForm` 関数の上または同関数内冒頭で:

```ts
function getField<T extends HTMLElement>(form: HTMLFormElement, name: string): T | null {
  const el = form.elements.namedItem(name);
  return el instanceof HTMLElement ? (el as T) : null;
}
```

### Step 2: initContactForm を null-safe に

`/Users/hayashi/Desktop/hayashigoto/src/scripts/main.ts` の `initContactForm` で:

**Before:**
```ts
const formData = {
  category: (form.elements.namedItem('category') as HTMLSelectElement).value,
  name: (form.elements.namedItem('name') as HTMLInputElement).value,
  email: (form.elements.namedItem('email') as HTMLInputElement).value,
  message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
  website: (form.elements.namedItem('website') as HTMLInputElement | null)?.value || '',
};
```

**After:**
```ts
const category = getField<HTMLSelectElement>(form, 'category');
const name = getField<HTMLInputElement>(form, 'name');
const email = getField<HTMLInputElement>(form, 'email');
const message = getField<HTMLTextAreaElement>(form, 'message');
const website = getField<HTMLInputElement>(form, 'website');

if (!category || !name || !email || !message) {
  // 必須フィールドが見つからない場合は早期リターン (HTML が壊れている)
  btn.innerHTML = original;
  btn.disabled = false;
  return;
}

const formData = {
  category: category.value,
  name: name.value,
  email: email.value,
  message: message.value,
  website: website?.value ?? '',
};
```

`website` はハニーポットなのでオプショナルのまま。

### Step 3: 型チェック + ビルド

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check 2>&1 | tail -10
npm run build 2>&1 | tail -5
```

### Step 4: コミット

```bash
git add src/scripts/main.ts
git commit -m "$(cat <<'EOF'
refactor(form): contact フォーム field 取得を null-safe に

namedItem の戻り値 null を握りつぶす as キャストをやめ、
getField<T>() ヘルパで instanceof ガード経由に整理。
必須フィールドが取れない（HTML 壊れている）場合は早期リターン。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 最終ビルド検証 + push

- [ ] **Step 1: 全体ビルド検証**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check && npm run build 2>&1 | tail -15
```
期待: check 0 errors / build 8 pages 成功。

- [ ] **Step 2: 視覚確認 (推奨)**

```bash
npm run preview &
```
ブラウザで http://localhost:4323/ を開き:
- dir-entry のクリック / Enter / Space / Tab フォーカス操作
- contact form 送信（テスト送信は控えめに）
- /works/[id] でページ遷移時のアニメーション

- [ ] **Step 3: git status + log 確認**

```bash
git status
git log --oneline -6
```
期待: working tree clean、Task 1〜4 のコミット 4 つ。

- [ ] **Step 4: push**

ユーザー承認を得てから:
```bash
git push origin main
```

---

## Self-Review

**Spec coverage:** Task 1（tooling）/ Task 2（dir-entry a11y）/ Task 3（api cleanup）/ Task 4（form null-safe）/ Task 5（verify）。Round 1 reviewer の Important 指摘 2 件と未対応 a11y 1 件をすべて拾えている。✓

**Placeholder scan:** 各 Task に具体コードと exact path 記載。"TBD" / "implement appropriately" 等なし。✓

**Type consistency:**
- `HeaderValue`, `RateLimitEntry` は Round 1 から維持
- `getField<T>` ヘルパの返り型 `T | null`、呼び出し側で narrowing
- `dir-entry-toggle` クラス名と CSS / TS 両方で一致
✓

**File scope:**
- Task 1: 4 file (rename ×2 + edit ×2)
- Task 2: 4 file
- Task 3: 1 file
- Task 4: 1 file
- 重複は `src/scripts/main.ts` のみ（Task 2 と Task 4 両方触るが部位が異なる）→ 順序通り実行で衝突なし
