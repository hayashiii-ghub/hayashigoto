import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { createHash } from 'node:crypto';
import { EMAIL } from '../src/lib/site';
import {
  type RateLimitEntry,
  cleanupRateLimitStore,
  escapeHtml,
  isAllowedOrigin,
  parseContactBody,
  pickHeader,
  rateLimitCheck,
  validateContact,
} from './_lib/validate';

const SITE_URL = process.env.SITE_URL || 'https://shigoto.dev';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_CLEANUP_INTERVAL = 60 * 1000;
// Rate limiting is best-effort and scoped to a single Vercel Function instance.
// State resets on cold starts and is not shared across regions or instances.
// The honeypot field and origin/method checks are the primary spam barrier.

const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanup: number = Date.now();

function getClientIp(req: VercelRequest): string {
  return (
    pickHeader(req.headers['x-vercel-forwarded-for']) ??
    pickHeader(req.headers['x-real-ip']) ??
    pickHeader(req.headers['x-forwarded-for']) ??
    req.socket?.remoteAddress ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (now - lastCleanup >= RATE_LIMIT_CLEANUP_INTERVAL) {
    lastCleanup = now;
    cleanupRateLimitStore(rateLimitStore, now, RATE_LIMIT_WINDOW_MS);
  }
  return rateLimitCheck(rateLimitStore, ip, now, {
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = pickHeader(req.headers.origin);
  if (!isAllowedOrigin(origin, {
    siteUrl: SITE_URL,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  })) {
    return res.status(403).json({ error: '許可されていない送信元です' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
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

  const body: Record<string, unknown> =
    req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  const input = parseContactBody(body);
  const result = validateContact(input);

  // Honeypot 反応時は送信せず success を装う
  if (result.ok === 'honeypot') {
    return res.status(200).json({ success: true });
  }
  if (result.ok === false) {
    return res.status(result.status).json({ error: result.error });
  }

  const { category, name, email, message } = result.data;

  try {
    const resend = new Resend(apiKey);
    const textBody = `カテゴリ: ${category === 'work' ? 'お仕事の相談' : 'その他'}\n名前: ${name}\nメール: ${email}\n\n${message}`;
    await resend.emails.send({
      from: 'はやしごと <noreply@send.shigoto.dev>',
      to: EMAIL,
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
