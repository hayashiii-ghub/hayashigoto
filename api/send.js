import { Resend } from 'resend';
import { createHash } from 'node:crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.SITE_URL || 'https://shigoto.dev';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_CLEANUP_INTERVAL = 60 * 1000;
// Rate limiting is best-effort and scoped to a single Vercel Function instance.
// State resets on cold starts and is not shared across regions or instances.
// The honeypot field and origin/method checks are the primary spam barrier.
const rateLimitStore = new Map();
let lastCleanup = Date.now();

function pickHeader(value) {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== 'string' || !v) return null;
  return v.split(',')[0].trim();
}

function getClientIp(req) {
  return (
    pickHeader(req.headers['x-vercel-forwarded-for']) ||
    pickHeader(req.headers['x-real-ip']) ||
    pickHeader(req.headers['x-forwarded-for']) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitStore) {
    if (now - entry.startedAt > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}

function isRateLimited(ip) {
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

function sanitizeLine(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function isAllowedOrigin(origin) {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: '許可されていない送信元です' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'メール設定が未構成です' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'JSON形式で送信してください' });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    const ipHash = createHash('sha256').update(clientIp).digest('hex').slice(0, 12);
    console.warn(`Rate limit exceeded: ip-${ipHash}`);
    return res.status(429).json({ error: '送信回数が多すぎます。時間をおいて再度お試しください' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const category = sanitizeLine(body.category);
  const name = sanitizeLine(body.name);
  const email = sanitizeLine(body.email).toLowerCase();
  const message = String(body.message || '').trim();
  const website = sanitizeLine(body.website);

  // Honeypot check
  if (website) {
    return res.status(200).json({ success: true });
  }

  const validCategories = ['work', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'カテゴリを選択してください' });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: '必須項目が入力されていません' });
  }

  if (String(name).length > 100) {
    return res.status(400).json({ error: '名前は100文字以内で入力してください' });
  }
  if (String(message).length > 5000) {
    return res.status(400).json({ error: 'メッセージは5000文字以内で入力してください' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
  }

  try {
    const textBody = `カテゴリ: ${category === 'work' ? 'お仕事の相談' : 'その他'}\n名前: ${name}\nメール: ${email}\n\n${message}`;
    await resend.emails.send({
      from: 'はやしごと <noreply@send.shigoto.dev>',
      to: 'hay@shigoto.dev',
      replyTo: email,
      subject: category === 'work' ? `【お仕事の相談】${name} さんより` : `【お問い合わせ】${name} さんより`,
      text: textBody,
      html: `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre-wrap; font-size: 14px;">${escapeHtml(textBody)}</pre>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'メール送信に失敗しました' });
  }
}
