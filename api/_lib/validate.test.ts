import { test, expect, describe } from 'bun:test';
import {
  cleanupRateLimitStore,
  escapeHtml,
  isAllowedOrigin,
  parseContactBody,
  pickHeader,
  rateLimitCheck,
  sanitizeLine,
  validateContact,
  type RateLimitEntry,
} from './validate';

describe('sanitizeLine', () => {
  test('改行を空白に潰して trim する', () => {
    expect(sanitizeLine('  hello\r\nworld  ')).toBe('hello world');
  });
  test('null / undefined は空文字', () => {
    expect(sanitizeLine(null)).toBe('');
    expect(sanitizeLine(undefined)).toBe('');
  });
});

describe('escapeHtml', () => {
  test('HTML 特殊文字をエスケープ', () => {
    expect(escapeHtml('<b> & </b>')).toBe('&lt;b&gt; &amp; &lt;/b&gt;');
  });
});

describe('pickHeader', () => {
  test('配列は先頭、カンマ区切りは最初の値を trim', () => {
    expect(pickHeader(['1.2.3.4', '5.6.7.8'])).toBe('1.2.3.4');
    expect(pickHeader('1.2.3.4, 5.6.7.8')).toBe('1.2.3.4');
  });
  test('空・undefined は undefined', () => {
    expect(pickHeader('')).toBeUndefined();
    expect(pickHeader(undefined)).toBeUndefined();
  });
});

describe('isAllowedOrigin', () => {
  const ctx = { siteUrl: 'https://shigoto.dev' };
  test('同一ホストを許可', () => {
    expect(isAllowedOrigin('https://shigoto.dev', ctx)).toBe(true);
  });
  test('localhost を許可', () => {
    expect(isAllowedOrigin('http://localhost:4322', ctx)).toBe(true);
  });
  test('別ホストは拒否', () => {
    expect(isAllowedOrigin('https://evil.example.com', ctx)).toBe(false);
  });
  test('origin 無し / 不正 URL は拒否', () => {
    expect(isAllowedOrigin(undefined, ctx)).toBe(false);
    expect(isAllowedOrigin('not a url', ctx)).toBe(false);
  });
  test('preview 環境では VERCEL_URL を許可、production では拒否', () => {
    const preview = { siteUrl: 'https://shigoto.dev', vercelEnv: 'preview', vercelUrl: 'foo.vercel.app' };
    expect(isAllowedOrigin('https://foo.vercel.app', preview)).toBe(true);
    const prod = { siteUrl: 'https://shigoto.dev', vercelEnv: 'production', vercelUrl: 'foo.vercel.app' };
    expect(isAllowedOrigin('https://foo.vercel.app', prod)).toBe(false);
  });
});

describe('parseContactBody', () => {
  test('email を小文字化し各値を sanitize', () => {
    const input = parseContactBody({
      category: 'work',
      name: '  林 \n祐太  ',
      email: 'HAY@Shigoto.Dev',
      message: '  本文  ',
      website: '',
    });
    expect(input.email).toBe('hay@shigoto.dev');
    expect(input.name).toBe('林  祐太');
    expect(input.message).toBe('本文');
  });
});

describe('validateContact', () => {
  const valid = { category: 'work', name: '林', email: 'a@b.co', message: 'hi', website: '' };

  test('正常系は ok:true', () => {
    expect(validateContact(valid)).toEqual({ ok: true, data: valid });
  });
  test('honeypot 充填で ok:honeypot', () => {
    expect(validateContact({ ...valid, website: 'bot' })).toEqual({ ok: 'honeypot' });
  });
  test('不正カテゴリは 400', () => {
    const r = validateContact({ ...valid, category: 'spam' });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });
  test('必須欠落は 400', () => {
    expect(validateContact({ ...valid, name: '' })).toMatchObject({ ok: false, status: 400 });
    expect(validateContact({ ...valid, email: '' })).toMatchObject({ ok: false, status: 400 });
    expect(validateContact({ ...valid, message: '' })).toMatchObject({ ok: false, status: 400 });
  });
  test('名前 100 文字超は 400', () => {
    expect(validateContact({ ...valid, name: 'あ'.repeat(101) })).toMatchObject({ ok: false, status: 400 });
  });
  test('本文 5000 文字超は 400', () => {
    expect(validateContact({ ...valid, message: 'a'.repeat(5001) })).toMatchObject({ ok: false, status: 400 });
  });
  test('不正メール形式は 400', () => {
    expect(validateContact({ ...valid, email: 'no-at-sign' })).toMatchObject({ ok: false, status: 400 });
  });
  test('honeypot は他の不正より優先', () => {
    expect(validateContact({ ...valid, website: 'bot', category: 'spam' })).toEqual({ ok: 'honeypot' });
  });
});

describe('rateLimitCheck', () => {
  const opts = { windowMs: 1000, max: 3 };
  test('上限以内は false、超過で true', () => {
    const store = new Map<string, RateLimitEntry>();
    expect(rateLimitCheck(store, 'ip', 0, opts)).toBe(false); // count 1
    expect(rateLimitCheck(store, 'ip', 0, opts)).toBe(false); // 2
    expect(rateLimitCheck(store, 'ip', 0, opts)).toBe(false); // 3
    expect(rateLimitCheck(store, 'ip', 0, opts)).toBe(true);  // 4 > max
  });
  test('ウィンドウ経過でリセット', () => {
    const store = new Map<string, RateLimitEntry>();
    rateLimitCheck(store, 'ip', 0, opts);
    rateLimitCheck(store, 'ip', 0, opts);
    rateLimitCheck(store, 'ip', 0, opts);
    expect(rateLimitCheck(store, 'ip', 2000, opts)).toBe(false); // 窓を超えたので count リセット
  });
  test('IP ごとに独立', () => {
    const store = new Map<string, RateLimitEntry>();
    for (let i = 0; i < 4; i++) rateLimitCheck(store, 'a', 0, opts);
    expect(rateLimitCheck(store, 'b', 0, opts)).toBe(false);
  });
});

describe('cleanupRateLimitStore', () => {
  test('期限切れのみ削除', () => {
    const store = new Map<string, RateLimitEntry>([
      ['old', { count: 1, startedAt: 0 }],
      ['fresh', { count: 1, startedAt: 900 }],
    ]);
    cleanupRateLimitStore(store, 1000, 500);
    expect(store.has('old')).toBe(false);
    expect(store.has('fresh')).toBe(true);
  });
});
