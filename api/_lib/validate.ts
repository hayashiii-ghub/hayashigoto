// お問い合わせフォームの純粋な検証ロジック。
// `_lib/` 配下は Vercel のルーティング対象外（エンドポイント化されない）。
// 副作用・I/O を持たないので bun test で回帰ガードできる（spam 対策の要）。

export function pickHeader(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== 'string' || !v) return undefined;
  return v.split(',')[0].trim();
}

export function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sanitizeLine(value: unknown): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

// ---- Origin allow-list ----
export interface OriginContext {
  siteUrl: string;
  vercelEnv?: string;
  vercelUrl?: string;
}

export function isAllowedOrigin(origin: string | undefined, ctx: OriginContext): boolean {
  if (!origin) return false;

  try {
    const requestUrl = new URL(origin);
    const siteHost = new URL(ctx.siteUrl).host;
    if (requestUrl.host === siteHost || requestUrl.hostname === 'localhost') return true;
    if (ctx.vercelEnv !== 'production' && ctx.vercelUrl && requestUrl.host === ctx.vercelUrl) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ---- Contact input parsing / validation ----
export const VALID_CATEGORIES = ['work', 'other'] as const;
export type Category = (typeof VALID_CATEGORIES)[number];

export const NAME_MAX = 100;
export const MESSAGE_MAX = 5000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactInput {
  category: string;
  name: string;
  email: string;
  message: string;
  website: string;
}

export type ValidationResult =
  | { ok: true; data: ContactInput }
  | { ok: false; status: number; error: string }
  | { ok: 'honeypot' }; // honeypot 反応時は送信せず 200 success を返す

export function parseContactBody(body: Record<string, unknown>): ContactInput {
  return {
    category: sanitizeLine(body.category),
    name: sanitizeLine(body.name),
    email: sanitizeLine(body.email).toLowerCase(),
    message: String(body.message ?? '').trim(),
    website: sanitizeLine(body.website),
  };
}

export function validateContact(input: ContactInput): ValidationResult {
  // Honeypot: hidden field が埋まっていれば bot 扱い（成功を装って黙殺）
  if (input.website) return { ok: 'honeypot' };

  if (!VALID_CATEGORIES.includes(input.category as Category)) {
    return { ok: false, status: 400, error: 'カテゴリを選択してください' };
  }
  if (!input.name || !input.email || !input.message) {
    return { ok: false, status: 400, error: '必須項目が入力されていません' };
  }
  if (input.name.length > NAME_MAX) {
    return { ok: false, status: 400, error: '名前は100文字以内で入力してください' };
  }
  if (input.message.length > MESSAGE_MAX) {
    return { ok: false, status: 400, error: 'メッセージは5000文字以内で入力してください' };
  }
  if (!EMAIL_REGEX.test(input.email)) {
    return { ok: false, status: 400, error: 'メールアドレスの形式が正しくありません' };
  }
  return { ok: true, data: input };
}

// ---- Rate limiting（インスタンス内ベストエフォート） ----
export interface RateLimitEntry {
  count: number;
  startedAt: number;
}

// store を破壊的に更新し、上限超過なら true を返す。now / store を引数化してテスト可能に。
export function rateLimitCheck(
  store: Map<string, RateLimitEntry>,
  ip: string,
  now: number,
  opts: { windowMs: number; max: number },
): boolean {
  const entry = store.get(ip);

  if (!entry || now - entry.startedAt > opts.windowMs) {
    store.set(ip, { count: 1, startedAt: now });
    return false;
  }

  entry.count += 1;
  return entry.count > opts.max;
}

// 期限切れエントリを掃除する（store を破壊的に更新）。
export function cleanupRateLimitStore(
  store: Map<string, RateLimitEntry>,
  now: number,
  windowMs: number,
): void {
  for (const [ip, entry] of store) {
    if (now - entry.startedAt > windowMs) {
      store.delete(ip);
    }
  }
}
