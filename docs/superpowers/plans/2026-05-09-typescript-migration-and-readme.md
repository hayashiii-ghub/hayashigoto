# TypeScript Migration & README Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プロジェクト内の `.js` ファイルを TypeScript に移行し、その後 `README.md` の技術スタックセクションを最新の構成（TypeScript / Content Collections / astro:assets / astro:transitions / HSTS / latin サブセット）に更新する。

**Architecture:** 既存の `tsconfig.json` (`extends: "astro/tsconfigs/strict"`) をそのまま流用し、`include` を `api/` まで拡張。Vite/Astro が `src/` の TS をバンドル、Vercel が `api/` の TS を関数として変換。型は `astro check`（src/）+ `tsc --noEmit`（api/）でチェック。最後に `README.md` を更新。

**Tech Stack:**
- TypeScript 5.9.3（既に devDep）
- `@vercel/node`（新規 devDep, types-only）— Vercel Function の req/res 型
- Astro 6 + Vite — TS バンドルをネイティブ対応
- 既存の `tsconfig.json`（strict preset）

**スコープ外（別途検討）:** `scripts/optimize-brand-assets.mjs` の TS 化。理由: prebuild で `node scripts/...mjs` を直接実行しており、TS 化には `tsx` 追加 or `node --experimental-strip-types` のいずれかが必要。導入コスト > 得られる型恩恵（60行のシンプルな build スクリプト）と判断し、JSDoc 型ヒントすら一旦保留。Task 6 で task としてオプション提示。

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | `@vercel/node` を devDep に追加、`check` スクリプトに `tsc --noEmit` を append |
| `tsconfig.json` | Modify | `include: ["src/**/*", "api/**/*"]` を追加 |
| `api/send.js` | Rename → `api/send.ts` | Vercel Serverless Function |
| `src/scripts/main.js` | Rename → `src/scripts/main.ts` | クライアント初期化 |
| `src/scripts/card.js` | Rename → `src/scripts/card.ts` | 名刺ビューアー |
| `src/layouts/Layout.astro` | Modify | `<script>import '../scripts/main.js';</script>` を `.ts` に |
| `src/pages/index.astro` | Modify | `<script>import '../scripts/card.js';</script>` を `.ts` に |
| `src/pages/works/[id].astro` | Modify | `<script>import '../../scripts/card.js';</script>` を `.ts` に |
| `README.md` | Modify | 技術スタック表を更新 |

---

## Task 1: 依存追加 + tsconfig 拡張

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: `@vercel/node` を devDep として追加**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm install --save-dev @vercel/node
```

期待: `node_modules/@vercel/node` が追加され、`package.json` の devDependencies に反映。

- [ ] **Step 2: `tsconfig.json` を編集して `api/` を `include` に追加**

`/Users/hayashi/Desktop/hayashigoto/tsconfig.json` を以下に変更:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src/**/*", "api/**/*", ".astro/types.d.ts"]
}
```

注意: `.astro/types.d.ts` は Astro 自動生成型で、`extends` 元では暗黙 include されているが明示しておくと安全。

- [ ] **Step 3: `package.json` の `check` スクリプトを更新**

`/Users/hayashi/Desktop/hayashigoto/package.json` の `"check": "astro check"` を:

```json
"check": "astro check && tsc --noEmit"
```

に変更。

- [ ] **Step 4: 現状の JS ファイルでも `tsc --noEmit` がパスすることを確認**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check 2>&1 | tail -20
```

期待: `0 errors`。`api/send.js` はまだ JS なので tsc は型チェックしない（`allowJs` が false なので無視される）。Astro check の hint は許容。

- [ ] **Step 5: コミット**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "$(cat <<'EOF'
chore(ts): @vercel/node 型を追加し tsconfig include を api/ まで拡張

JS→TS 移行の準備。check スクリプトに tsc --noEmit を追加し、
api/ 配下も型チェック対象に。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `api/send.js` → `api/send.ts` に移行

**Files:**
- Rename: `api/send.js` → `api/send.ts`
- Modify: `api/send.ts`（型注釈追加）

- [ ] **Step 1: 現状ファイルを読んで構造を把握**

`/Users/hayashi/Desktop/hayashigoto/api/send.js` を Read。約140行、6つのヘルパ関数 + handler。

- [ ] **Step 2: git mv でリネーム**

```bash
cd /Users/hayashi/Desktop/hayashigoto
git mv api/send.js api/send.ts
```

- [ ] **Step 3: 型注釈を一括追加**

`api/send.ts` の冒頭近くに以下を追加:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
```

各関数のシグネチャを以下のように書き換える:

```ts
interface RateLimitEntry {
  count: number;
  startedAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanup: number = Date.now();

type HeaderValue = string | string[] | undefined;

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

function cleanupRateLimitStore(): void {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitStore) {
    if (now - entry.startedAt > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupRateLimitStore();
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, startedAt: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function sanitizeLine(value: unknown): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;

  try {
    const requestUrl = new URL(origin);
    const siteHost = new URL(SITE_URL).host;
    if (requestUrl.host === siteHost || requestUrl.hostname === 'localhost') return true;
    if (process.env.VERCEL_ENV !== 'production') {
      const vercelUrl = process.env.VERCEL_URL;
      if (vercelUrl && requestUrl.host === vercelUrl) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  // (本体は既存ロジックのまま — 既存コードを保ったまま型のみ追加)
}
```

実装本体（handler 関数のロジック）は変更せず、上記の型と関数シグネチャだけを当てはめる。なお `req.body` は `VercelRequest` で `any` 型なので、`const body = req.body && typeof req.body === 'object' ? req.body : {};` の後で `body.category` 等を `unknown` 経由でアクセスすることになる。`sanitizeLine(body.category)` は `value: unknown` を受け取るので OK。

- [ ] **Step 4: `npm run check` で型エラーを確認・修正**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check 2>&1 | tail -40
```

期待: 0 errors。エラーが残ったら、各エラーメッセージに従って修正（例: `req.body` のプロパティアクセスで `any` 関連の警告 → `(body as Record<string, unknown>).category` のように narrowed access）。

- [ ] **Step 5: `npm run build` で実ビルド確認**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run build 2>&1 | tail -10
```

期待: `8 page(s) built`。

- [ ] **Step 6: コミット**

```bash
git add api/
git commit -m "$(cat <<'EOF'
refactor(api): send.js を TypeScript に移行

VercelRequest/VercelResponse 型と各ヘルパに型を付与。
ロジックは変更なし。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `src/scripts/main.js` → `src/scripts/main.ts` に移行

**Files:**
- Rename: `src/scripts/main.js` → `src/scripts/main.ts`
- Modify: `src/scripts/main.ts`（型注釈）
- Modify: `src/layouts/Layout.astro`（`<script>` 内 import 拡張子）

- [ ] **Step 1: 現状ファイルを読んで構造を把握**

`/Users/hayashi/Desktop/hayashigoto/src/scripts/main.js` を Read。約460行、init 関数 + 9つの個別 init helpers。

- [ ] **Step 2: git mv でリネーム**

```bash
cd /Users/hayashi/Desktop/hayashigoto
git mv src/scripts/main.js src/scripts/main.ts
```

- [ ] **Step 3: 型注釈を追加**

`src/scripts/main.ts` 全体を以下方針で書き換え:

トップレベル:
```ts
let _marqueeResizeAttached: boolean = false;

function init(): void {
  initLoader();
  initHeroLogoFallback();
  initMarquee();
  initSmoothScroll();
  initScrollReveal();
  initDirToggle();
  initToggleAll();
  initContactForm();
  initLightbox();
}

document.addEventListener('astro:page-load', init);
```

各関数の型付け基本パターン（例 initHeroLogoFallback）:
```ts
function initHeroLogoFallback(): void {
  const img = document.querySelector<HTMLImageElement>('.hero-logo-img');
  if (!img) return;
  img.addEventListener('error', () => {
    const parent = img.parentElement;
    if (!parent) return;
    parent.style.display = 'none';
    const fallback = parent.nextElementSibling;
    if (fallback instanceof HTMLElement) fallback.style.display = 'block';
  });
}
```

initLoader:
```ts
function initLoader(): void {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const dismiss = (): void => loader.classList.add('is-hidden');
  if (document.readyState === 'complete') dismiss();
  else window.addEventListener('load', dismiss);
}
```

initMarquee（最も複雑）:
```ts
function initMarquee(): void {
  const MARQUEE_SPEED = 50;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  document.querySelectorAll<HTMLElement>('.marquee').forEach(marquee => {
    const track = marquee.querySelector<HTMLElement>('.marquee-track');
    if (!track) return;
    const original = track.querySelector<HTMLElement>('.marquee-content');
    if (!original) return;

    const isReverse = marquee.classList.contains('marquee--reverse');
    let animation: Animation | undefined;
    let frameId = 0;
    let lastSignature = '';

    function clearClones(): void {
      track!.querySelectorAll('.marquee-content[aria-hidden]').forEach(el => el.remove());
    }
    // ...（残りも同様に型注釈、existing logic そのまま）
  });
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

initSmoothScroll:
```ts
function initSmoothScroll(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href) return;
      const target = document.querySelector(href);
      if (!target) return;
      const header = document.querySelector<HTMLElement>('.header');
      const headerHeight = header?.offsetHeight ?? 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}
```

initScrollReveal:
```ts
function initScrollReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.cli-reveal'));
  if (items.length === 0) return;

  if (sessionStorage.getItem('revealed')) {
    items.forEach(el => {
      el.classList.add('is-visible');
      if (el.classList.contains('dir-entry')) {
        el.classList.add('is-open');
        el.setAttribute('aria-expanded', 'true');
      }
    });
    return;
  }

  sessionStorage.setItem('revealed', '1');

  const sectionItems = new Map<Element | string, HTMLElement[]>();
  items.forEach(el => {
    const section = el.closest('.dir-section');
    const key: Element | string = section ?? 'global';
    if (!sectionItems.has(key)) sectionItems.set(key, []);
    sectionItems.get(key)!.push(el);
  });

  const sectionState = new Map<Element | string, { pending: HTMLElement[]; playing: boolean }>();
  sectionItems.forEach((els, key) => {
    sectionState.set(key, { pending: [...els], playing: false });
  });

  const globalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      globalObserver.unobserve(entry.target);
      entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.15 });

  function observeNext(section: Element | string): void {
    const state = sectionState.get(section);
    if (!state || state.pending.length === 0) {
      if (state) state.playing = false;
      return;
    }
    const el = state.pending.shift()!;
    state.playing = true;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        revealElement(el, () => observeNext(section));
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    obs.observe(el);
  }

  function revealElement(el: HTMLElement, onDone: () => void): void {
    el.classList.add('is-visible');
    if (el.classList.contains('dir-entry')) {
      setTimeout(() => {
        el.classList.add('is-open');
        el.setAttribute('aria-expanded', 'true');
        setTimeout(onDone, 100);
      }, 120);
    } else {
      setTimeout(onDone, 150);
    }
  }

  sectionItems.forEach((els, key) => {
    if (key === 'global') {
      els.forEach(el => globalObserver.observe(el));
    } else {
      observeNext(key);
    }
  });
}
```

initDirToggle:
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

initToggleAll:
```ts
function initToggleAll(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-toggle-all]').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.dir-section');
      if (!section) return;

      const entries = section.querySelectorAll<HTMLElement>('.dir-entry[data-toggle]');
      const allOpen = Array.from(entries).every(e => e.classList.contains('is-open'));

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

      btn.setAttribute('aria-expanded', String(!allOpen));
    });
  });
}
```

initLightbox:
```ts
function initLightbox(): void {
  const dialog = document.getElementById('lightbox') as HTMLDialogElement | null;
  const img = document.getElementById('lightbox-img') as HTMLImageElement | null;
  if (!dialog || !img) return;

  document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      img.src = link.href;
      img.alt = link.textContent || '';
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    });
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
```

initContactForm:
```ts
function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector<HTMLButtonElement>('.dir-submit');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = './sending...<span class="cursor-blink">_</span>';
    btn.disabled = true;

    try {
      const formData = {
        category: (form.elements.namedItem('category') as HTMLSelectElement).value,
        name: (form.elements.namedItem('name') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
        website: (form.elements.namedItem('website') as HTMLInputElement | null)?.value || '',
      };
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data: { error?: string; success?: boolean } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '送信失敗');

      btn.innerHTML = 'sent <span class="status-ok">&#10003;</span>';
      setTimeout(() => {
        form.reset();
        btn.innerHTML = original;
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : '送信失敗';
      btn.innerHTML = `error <span class="status-error">&#10007;</span>`;
      btn.title = message;
      setTimeout(() => {
        btn.innerHTML = original;
        btn.removeAttribute('title');
        btn.disabled = false;
      }, 2000);
    }
  });
}
```

- [ ] **Step 4: `src/layouts/Layout.astro` の import 拡張子を更新**

72行目あたり:
```astro
    <script>
      import '../scripts/main.js';
    </script>
```
を:
```astro
    <script>
      import '../scripts/main.ts';
    </script>
```
に変更。

- [ ] **Step 5: `npm run check` で型エラーを確認・修正**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check 2>&1 | tail -40
```

期待: 0 errors。strict モードなので残るエラーは型キャスト不足が中心。エラー文に従って `as HTMLElement` 追加 or `if (el instanceof HTMLElement)` で narrowing。

- [ ] **Step 6: `npm run build` で実ビルド確認**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run build 2>&1 | tail -10
```

期待: 成功。

- [ ] **Step 7: コミット**

```bash
git add src/scripts/main.ts src/layouts/Layout.astro
git commit -m "$(cat <<'EOF'
refactor(scripts): main.js を TypeScript に移行

DOM API の型を活用して strict null/type チェックを通す。
Layout.astro の <script> import パスを .ts に更新。
ロジックは変更なし。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `src/scripts/card.js` → `src/scripts/card.ts` に移行

**Files:**
- Rename: `src/scripts/card.js` → `src/scripts/card.ts`
- Modify: `src/scripts/card.ts`（型注釈）
- Modify: `src/pages/index.astro`（import 拡張子）
- Modify: `src/pages/works/[id].astro`（import 拡張子）

- [ ] **Step 1: 現状ファイルを読んで構造を把握**

`/Users/hayashi/Desktop/hayashigoto/src/scripts/card.js` を Read。約380行、initCard 関数 + state object + pointer/touch handlers。

- [ ] **Step 2: git mv でリネーム**

```bash
cd /Users/hayashi/Desktop/hayashigoto
git mv src/scripts/card.js src/scripts/card.ts
```

- [ ] **Step 3: 型注釈を追加**

`src/scripts/card.ts` トップ:

```ts
type CardSide = 'front' | 'back';
type CardOrientation = 'portrait' | 'landscape';
type PointerIdentifier = number | string | null;

interface CardState {
  side: CardSide;
  orientation: CardOrientation;
  tiltX: number;
  tiltY: number;
  dragging: boolean;
  pointerId: PointerIdentifier;
  startX: number;
  startY: number;
  startTiltX: number;
  startTiltY: number;
  moved: boolean;
  switching: boolean;
}

let cardAbortController: AbortController | null = null;

function initCard(): void {
  if (cardAbortController) cardAbortController.abort();
  cardAbortController = new AbortController();
  const { signal } = cardAbortController;

  const overlay = document.getElementById('card-overlay');
  const tilt = document.getElementById('card-tilt');
  const orientation = document.getElementById('card-orientation');
  const card = document.getElementById('card-body');
  if (!overlay || !tilt || !orientation || !card) {
    cardAbortController = null;
    return;
  }

  const initialOrientation = ((orientation.dataset.orientation as CardOrientation | undefined) ?? 'portrait');

  const state: CardState = {
    side: 'front',
    orientation: initialOrientation,
    tiltX: 0,
    tiltY: 0,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startTiltX: 0,
    startTiltY: 0,
    moved: false,
    switching: false,
  };

  const MAX_TILT_X = 14;
  const MAX_TILT_Y = 18;
  const DRAG_SENSITIVITY = 2.1;
  const TAP_THRESHOLD = 8;
  const RESET_DURATION = 220;
  const SIDE_SWITCH_DURATION = 560;

  const supportsPointerEvents = 'PointerEvent' in window;
  const supportsPointerCapture =
    typeof overlay.setPointerCapture === 'function' &&
    typeof overlay.releasePointerCapture === 'function';

  let resetFrame = 0;
  let sideSwapTimer = 0;
  let sideCleanupTimer = 0;
  let legacyMouseListenersAttached = false;

  // ヘルパ関数群（既存ロジック維持・型注釈のみ追加）
  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function renderTilt(): void {
    tilt!.style.transform = `rotateX(${state.tiltX.toFixed(2)}deg) rotateY(${state.tiltY.toFixed(2)}deg)`;
  }

  function renderCard(): void {
    card!.dataset.side = state.side;
    orientation!.dataset.orientation = state.orientation;
    overlay!.dataset.orientation = state.orientation;
  }

  function render(): void {
    renderTilt();
    renderCard();
  }

  function cancelReset(): void {
    if (!resetFrame) return;
    cancelAnimationFrame(resetFrame);
    resetFrame = 0;
  }

  function animateTiltToRest(): void {
    cancelReset();
    const startX = state.tiltX;
    const startY = state.tiltY;
    if (!startX && !startY) return;

    const startedAt = performance.now();
    function step(now: number): void {
      const progress = Math.min(1, (now - startedAt) / RESET_DURATION);
      const eased = 1 - Math.pow(1 - progress, 3);
      state.tiltX = startX * (1 - eased);
      state.tiltY = startY * (1 - eased);
      renderTilt();
      if (progress < 1) {
        resetFrame = requestAnimationFrame(step);
      } else {
        state.tiltX = 0;
        state.tiltY = 0;
        renderTilt();
        resetFrame = 0;
      }
    }
    resetFrame = requestAnimationFrame(step);
  }

  function updateTiltFromDrag(clientX: number, clientY: number): void {
    const rect = overlay!.getBoundingClientRect();
    const deltaX = clientX - state.startX;
    const deltaY = clientY - state.startY;
    const normalizedX = rect.width ? (deltaX / rect.width) * DRAG_SENSITIVITY : 0;
    const normalizedY = rect.height ? (deltaY / rect.height) * DRAG_SENSITIVITY : 0;
    state.tiltY = clamp(state.startTiltY + normalizedX * MAX_TILT_Y, -MAX_TILT_Y, MAX_TILT_Y);
    state.tiltX = clamp(state.startTiltX - normalizedY * MAX_TILT_X, -MAX_TILT_X, MAX_TILT_X);
    renderTilt();
  }

  function toggleSide(): void {
    if (state.switching) return;
    state.switching = true;
    const nextSide: CardSide = state.side === 'front' ? 'back' : 'front';
    const directionClass = nextSide === 'back' ? 'is-switching-forward' : 'is-switching-reverse';
    card!.classList.remove('is-switching', 'is-switching-forward', 'is-switching-reverse');
    void card!.offsetWidth;
    card!.classList.add('is-switching', directionClass);
    clearTimeout(sideSwapTimer);
    clearTimeout(sideCleanupTimer);
    sideSwapTimer = window.setTimeout(() => {
      state.side = nextSide;
      renderCard();
    }, SIDE_SWITCH_DURATION / 2);
    sideCleanupTimer = window.setTimeout(() => {
      card!.classList.remove('is-switching', 'is-switching-forward', 'is-switching-reverse');
      state.switching = false;
    }, SIDE_SWITCH_DURATION);
  }

  function toggleOrientation(): void {
    if (state.switching) return;
    state.orientation = state.orientation === 'landscape' ? 'portrait' : 'landscape';
    renderCard();
  }

  function resetCard(): void {
    clearTimeout(sideSwapTimer);
    clearTimeout(sideCleanupTimer);
    state.switching = false;
    card!.classList.remove('is-switching', 'is-switching-forward', 'is-switching-reverse');
    state.side = 'front';
    state.orientation = initialOrientation;
    renderCard();
    animateTiltToRest();
  }

  function finishDrag(): void {
    state.dragging = false;
    state.pointerId = null;
    state.startTiltX = state.tiltX;
    state.startTiltY = state.tiltY;
    overlay!.classList.remove('is-dragging');
    tilt!.classList.remove('is-dragging');
  }

  function beginDrag(pointerId: PointerIdentifier, clientX: number, clientY: number): void {
    cancelReset();
    state.dragging = true;
    state.pointerId = pointerId;
    state.startX = clientX;
    state.startY = clientY;
    state.startTiltX = state.tiltX;
    state.startTiltY = state.tiltY;
    state.moved = false;
    overlay!.classList.add('is-dragging');
    tilt!.classList.add('is-dragging');
  }

  function moveDrag(pointerId: PointerIdentifier, clientX: number, clientY: number): boolean {
    if (!state.dragging || pointerId !== state.pointerId) return false;
    const movedX = Math.abs(clientX - state.startX);
    const movedY = Math.abs(clientY - state.startY);
    state.moved = state.moved || movedX > TAP_THRESHOLD || movedY > TAP_THRESHOLD;
    updateTiltFromDrag(clientX, clientY);
    return true;
  }

  function endDrag(pointerId: PointerIdentifier, opts: { toggleTap?: boolean } = {}): boolean {
    const { toggleTap = true } = opts;
    if (!state.dragging || pointerId !== state.pointerId) return false;
    const wasTap = !state.moved;
    finishDrag();
    if (toggleTap && wasTap) toggleSide();
    animateTiltToRest();
    return true;
  }

  function cancelDrag(pointerId: PointerIdentifier): boolean {
    if (!state.dragging || pointerId !== state.pointerId) return false;
    finishDrag();
    animateTiltToRest();
    return true;
  }

  function safeSetPointerCapture(pointerId: number): void {
    if (!supportsPointerCapture) return;
    try {
      overlay!.setPointerCapture(pointerId);
    } catch {
      // ignore
    }
  }

  function safeReleasePointerCapture(pointerId: number): void {
    if (!supportsPointerCapture) return;
    if (typeof overlay!.hasPointerCapture === 'function' && !overlay!.hasPointerCapture(pointerId)) return;
    try {
      overlay!.releasePointerCapture(pointerId);
    } catch {
      // ignore
    }
  }

  function findTouchById(touchList: TouchList, identifier: number): Touch | null {
    for (const touch of Array.from(touchList)) {
      if (touch.identifier === identifier) return touch;
    }
    return null;
  }

  function detachLegacyMouseListeners(): void {
    if (!legacyMouseListenersAttached) return;
    window.removeEventListener('mousemove', onLegacyMouseMove);
    window.removeEventListener('mouseup', onLegacyMouseUp);
    legacyMouseListenersAttached = false;
  }

  function handleInterruptedInteraction(): void {
    if (!state.dragging || state.pointerId == null) return;
    cancelDrag(state.pointerId);
    detachLegacyMouseListeners();
  }

  function onLegacyMouseMove(event: MouseEvent): void {
    moveDrag('mouse', event.clientX, event.clientY);
  }

  function onLegacyMouseUp(): void {
    if (endDrag('mouse')) {
      detachLegacyMouseListeners();
      return;
    }
    cancelDrag('mouse');
    detachLegacyMouseListeners();
  }

  // イベントハンドラ登録（pointer / legacy 分岐）
  if (supportsPointerEvents) {
    overlay.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      beginDrag(event.pointerId, event.clientX, event.clientY);
      safeSetPointerCapture(event.pointerId);
    });
    overlay.addEventListener('pointermove', (event: PointerEvent) => {
      moveDrag(event.pointerId, event.clientX, event.clientY);
    });
    overlay.addEventListener('pointerup', (event: PointerEvent) => {
      endDrag(event.pointerId);
      safeReleasePointerCapture(event.pointerId);
    });
    overlay.addEventListener('pointercancel', (event: PointerEvent) => {
      cancelDrag(event.pointerId);
      safeReleasePointerCapture(event.pointerId);
    });
  } else {
    overlay.addEventListener('mousedown', (event: Event) => {
      const e = event as MouseEvent;
      if (e.button !== 0) return;
      beginDrag('mouse', e.clientX, e.clientY);
      if (!legacyMouseListenersAttached) {
        window.addEventListener('mousemove', onLegacyMouseMove, { signal });
        window.addEventListener('mouseup', onLegacyMouseUp, { signal });
        legacyMouseListenersAttached = true;
      }
    });
    overlay.addEventListener('touchstart', (event: Event) => {
      const e = event as TouchEvent;
      const [touch] = Array.from(e.changedTouches);
      if (!touch) return;
      e.preventDefault();
      beginDrag(touch.identifier, touch.clientX, touch.clientY);
    }, { passive: false });
    overlay.addEventListener('touchmove', (event: Event) => {
      const e = event as TouchEvent;
      const touch = state.pointerId !== null && typeof state.pointerId === 'number'
        ? findTouchById(e.changedTouches, state.pointerId) : null;
      if (!touch) return;
      e.preventDefault();
      moveDrag(touch.identifier, touch.clientX, touch.clientY);
    }, { passive: false });
    overlay.addEventListener('touchend', (event: Event) => {
      const e = event as TouchEvent;
      const touch = state.pointerId !== null && typeof state.pointerId === 'number'
        ? findTouchById(e.changedTouches, state.pointerId) : null;
      if (!touch) return;
      e.preventDefault();
      endDrag(touch.identifier);
    }, { passive: false });
    overlay.addEventListener('touchcancel', (event: Event) => {
      const e = event as TouchEvent;
      const touch = state.pointerId !== null && typeof state.pointerId === 'number'
        ? findTouchById(e.changedTouches, state.pointerId) : null;
      if (!touch) return;
      cancelDrag(touch.identifier);
    }, { passive: false });
  }

  window.addEventListener('blur', handleInterruptedInteraction, { signal });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    handleInterruptedInteraction();
  }, { signal });

  overlay.addEventListener('keydown', (event: Event) => {
    const e = event as KeyboardEvent;
    const key = e.key.toLowerCase();
    if (key === 'enter' || key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleSide();
      return;
    }
    if (key === 'o') {
      e.preventDefault();
      e.stopPropagation();
      toggleOrientation();
      return;
    }
    if (key === 'r') {
      e.preventDefault();
      e.stopPropagation();
      resetCard();
    }
  });

  render();
  requestAnimationFrame(() => {
    orientation.classList.add('is-ready');
  });
}

document.addEventListener('astro:page-load', initCard);
```

注: `tilt!`, `card!`, `overlay!`, `orientation!` の `!`（non-null assertion）は、関数冒頭の null チェック後にクロージャ内で参照されるため必要。strict mode で TS は narrowing を保持しないため。

- [ ] **Step 4: `src/pages/index.astro` の import 拡張子を更新**

```astro
  <script>
    import '../scripts/card.js';
  </script>
```
を:
```astro
  <script>
    import '../scripts/card.ts';
  </script>
```
に変更。

- [ ] **Step 5: `src/pages/works/[id].astro` の import 拡張子を更新**

```astro
    <script>
      import '../../scripts/card.js';
    </script>
```
を:
```astro
    <script>
      import '../../scripts/card.ts';
    </script>
```
に変更。

- [ ] **Step 6: `npm run check` で型エラーを確認・修正**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check 2>&1 | tail -40
```

期待: 0 errors。strict 由来の narrowing 失敗があれば `!` または `instanceof` で対処。

- [ ] **Step 7: `npm run build` で実ビルド確認**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run build 2>&1 | tail -10
```

期待: 成功。

- [ ] **Step 8: コミット**

```bash
git add src/scripts/card.ts src/pages/index.astro 'src/pages/works/[id].astro'
git commit -m "$(cat <<'EOF'
refactor(scripts): card.js を TypeScript に移行

CardState インタフェース化で名刺ビューアーの状態管理が型で守られる。
Pointer/Touch/Keyboard ハンドラに型を付与。
index.astro と works/[id].astro の <script> import パスを .ts に更新。
ロジックは変更なし。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: README.md を更新

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 現状の README を読む**

`/Users/hayashi/Desktop/hayashigoto/README.md` を Read。

- [ ] **Step 2: 技術スタック表を更新**

以下のテーブルに置き換える（既存テーブルの行ごとに対応）:

```markdown
## 技術スタック

| カテゴリ | ツール | 選定理由 |
|---------|--------|---------|
| フレームワーク | Astro 6 | 静的HTML出力でJSゼロ配信・コンポーネント共通化でメンテナンス性向上 |
| 言語 | TypeScript（strict） | 型安全な開発体験。`astro/tsconfigs/strict` を継承し API/ も型チェック対象 |
| フロント | HTML / CSS / TypeScript | フレームワークランタイム不要。Vite/Astro が静的HTMLにバンドル |
| コンテンツ管理 | Astro Content Collections + Zod | `src/content/works/` の Markdown を統一スキーマで管理し型生成 |
| 画像最適化 | astro:assets `<Image>` | コレクション画像を responsive `srcset` 自動生成（widths/sizes 指定） |
| ページ遷移 | astro:transitions ClientRouter | View Transitions による SPA 的遷移。init は `astro:page-load` で再走 |
| デプロイ | Vercel | Git連携で自動デプロイ・エッジネットワーク・Serverless Functions一体型 |
| メール送信 | Resend | モダンなAPI設計・独自ドメイン送信対応・無料枠で十分 |
| スパム対策 | ハニーポット + 入力バリデーション + 簡易レート制限 | 外部サービス不要で最低限の不正送信対策を維持 |
| フォント | Fontsource (IBM Plex Mono, latin サブセット) + システム日本語フォント | 欧文だけを配信して日本語はOS標準に寄せ、転送量を抑制 |
| ブランド画像 | sharp + to-ico（`prebuild`） | `assets/brand/logo-master.png` から軽量ロゴと各種ファビコンを同じ再現性で生成 |
| セキュリティ | vercel.json ヘッダー (CSP, HSTS, Permissions-Policy 等) | 外部依存最小限の構成で CSP/HSTS を厳格に設定 |
| パッケージマネージャ | npm | Node.js標準・追加ツール不要 |
```

- [ ] **Step 3: 構成セクションの古い記述があれば微修正**

`README.md` の「構成」のディレクトリツリー（```sh ブロック内）で `*.js` 拡張子と `astro:assets` の path を確認し、古い記述があれば軽微に直す。例: `src/scripts/main.js` → `src/scripts/main.ts`、`src/content.config.ts` の説明を「Content Collections スキーマ定義（`image()` ヘルパで画像も型付き）」のように追記。

具体的に必要なら、現状のディレクトリツリー部分を読んだ上で:
- `src/scripts/main.js` を `src/scripts/main.ts` に
- `src/scripts/card.js` を `src/scripts/card.ts` に
- `api/send.js` を `api/send.ts` に
- `assets/brand/` セクションの記述: 既存通りで OK
- `src/content.config.ts # Content Collections スキーマ定義` → 「Content Collections スキーマ定義（image() ヘルパで画像も型付き）」

- [ ] **Step 4: 環境変数セクションの確認**

`RESEND_API_KEY`, `SITE_URL` の記述は変更なし（追加された環境変数なし）。

- [ ] **Step 5: ライセンス・コマンドセクション確認**

`npm run check` の説明を「Astro の型・コンテンツ検証 + tsc --noEmit」へ微修正。

```sh
npm run check     # Astro の型・コンテンツ検証 + tsc --noEmit
```

- [ ] **Step 6: コミット**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: README 技術スタックを最新化

TypeScript / Content Collections / astro:assets / astro:transitions /
HSTS / Fontsource latin サブセット / scripts の .ts 拡張子を反映。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 最終検証 + push

- [ ] **Step 1: 全体ビルド検証**

```bash
cd /Users/hayashi/Desktop/hayashigoto
npm run check && npm run build 2>&1 | tail -15
```

期待: check 0 errors、build 8 page(s) 成功。

- [ ] **Step 2: git status 確認**

```bash
git status
```

期待: working tree clean。

- [ ] **Step 3: commit log 確認**

```bash
git log --oneline -6
```

期待: Task 1〜5 のコミット 5 つが順番に並ぶ。

- [ ] **Step 4: push（ユーザー承認後）**

ユーザーに「push して良いか」確認。OK なら:

```bash
git push origin main
```

---

## 補足: `scripts/optimize-brand-assets.mjs` を TS 化する場合の選択肢（参考）

このプランでは保留。やる場合の3案:

**A. 現状維持（推奨）** — 60行の build script、JS のままで動作している。型恩恵 < 移行コスト。
**B. JSDoc 型ヒント** — `.mjs` のまま `/** @param {string} path */` 等を追加。tsc --checkJs を有効化すれば型チェック可能。runtime 変更ゼロ。
**C. tsx 経由で TS 化** — `npm i -D tsx`、`prebuild` を `tsx scripts/optimize-brand-assets.ts` に変更。devDep が増える。

別タイミングで個別 plan を切るか、Task として追加するかはユーザー判断。

---

## Self-Review

**Spec coverage:** ユーザー要求は (#1) README 更新と (#2) JS→TS。Task 1〜4 で TS 化、Task 5 で README、Task 6 で検証/push。✓ カバー。

**Placeholder scan:** 各 Task の Step に具体的なコマンドとコードを記述済み。"TBD" 等なし。✓

**Type consistency:** `CardState`, `RateLimitEntry`, `HeaderValue`, `CardSide`, `CardOrientation`, `PointerIdentifier` が一貫。`VercelRequest`/`VercelResponse` は `@vercel/node` から import。✓

**Build script:** Task 6 で参考案を併記し、本 plan のスコープ外であることを明示。✓
