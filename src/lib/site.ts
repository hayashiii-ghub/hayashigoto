// サイト共通のプロフィール / 連絡先 / SNS データ。
// コンポーネント・JSON-LD・API が同じ source を参照するための単一の真実。
// astro 依存を持たないので api/ (Vercel Serverless) からも安全に import できる。

export const EMAIL = 'hay@shigoto.dev';
export const WEBSITE_URL = 'https://shigoto.website';

// SNS リンク。href は SnsLinks コンポーネントと Layout の JSON-LD sameAs の両方が参照する。
// 挿入順がそのまま表示順 / sameAs の順序になる。
export const SNS = {
  instagram: 'https://instagram.com/hayashiii_inst',
  x: 'https://x.com/hayashiii_X',
  github: 'https://github.com/hayashiii-ghub',
  note: 'https://note.com/hayashiii_note',
} as const;

export const SNS_URLS: readonly string[] = Object.values(SNS);

// ---- ナビゲーション ----
export interface NavItem {
  href: string;
  label: string;
}

// トップページ用（同一ページ内アンカー）
export const HOME_NAV: NavItem[] = [
  { href: '#about', label: '/about' },
  { href: '#works', label: '/works' },
  { href: '#contact', label: '/contact' },
];

// 下層ページ用（トップへ戻るリンク + トップ内アンカー）
export const SUB_NAV: NavItem[] = [
  { href: '/', label: '/home' },
  { href: '/#about', label: '/about' },
  { href: '/#works', label: '/works' },
  { href: '/#contact', label: '/contact' },
];
