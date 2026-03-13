// はやしごと - メインの JavaScript

// Fontsource (self-hosted fonts)
import '@fontsource/ibm-plex-mono/300.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/noto-sans-jp/300.css';
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/500.css';
import '@fontsource/noto-sans-jp/600.css';

// Vercel Analytics
import { inject } from '@vercel/analytics';
inject();

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initHeroLogoFallback();
  initMarquee();
  initSmoothScroll();
  initScrollReveal();
  initDirToggle();
  initToggleAll();
  initContactForm();
  initTooltip();
});

// Hero ロゴ画像のフォールバック（CSP対応のため JS で処理）
function initHeroLogoFallback() {
  const img = document.querySelector('.hero-logo-img');
  if (!img) return;
  img.addEventListener('error', () => {
    img.parentElement.style.display = 'none';
    img.parentElement.nextElementSibling.style.display = 'block';
  });
}

// ローディング画面（実際の読み込み完了で消す）
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  const dismiss = () => loader.classList.add('is-hidden');

  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss);
  }
}

// マーキー（画面幅に応じて動的に複製・アニメーション設定）
function initMarquee() {
  const MARQUEE_SPEED = 50; // px per second（全行共通）

  document.querySelectorAll('.marquee').forEach(marquee => {
    const track = marquee.querySelector('.marquee-track');
    if (!track) return;
    const original = track.querySelector('.marquee-content');
    if (!original) return;

    const isReverse = marquee.classList.contains('marquee--reverse');
    let animation;
    let frameId = 0;
    let lastSignature = '';

    function clearClones() {
      track.querySelectorAll('.marquee-content[aria-hidden]').forEach(el => el.remove());
    }

    function stopAnimation() {
      animation?.cancel();
      animation = undefined;
    }

    function setup() {
      frameId = 0;
      const trackGap = parseFloat(getComputedStyle(track).gap) || 16;

      // scrollWidth / offsetWidth は整数丸めされるため、ループ境界がずれてガクつきやすい
      const oneSetWidth = original.getBoundingClientRect().width + trackGap;
      const viewWidth = marquee.getBoundingClientRect().width;

      if (!oneSetWidth || !viewWidth) {
        clearClones();
        stopAnimation();
        lastSignature = '';
        return;
      }

      // 画面を隙間なく埋めるのに必要な複製数（最低1つ）
      const copies = Math.ceil(viewWidth / oneSetWidth) + 1;
      const signature = `${oneSetWidth.toFixed(2)}:${viewWidth.toFixed(2)}:${copies}`;

      if (signature === lastSignature && animation) return;
      lastSignature = signature;

      clearClones();

      for (let i = 0; i < copies; i++) {
        const clone = original.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      }

      // 1セット分だけ移動してループ
      const from = isReverse ? `-${oneSetWidth}px` : '0px';
      const to = isReverse ? '0px' : `-${oneSetWidth}px`;

      stopAnimation();

      animation = track.animate(
        [
          { transform: `translateX(${from})` },
          { transform: `translateX(${to})` }
        ],
        {
          duration: (oneSetWidth / MARQUEE_SPEED) * 1000,
          iterations: Infinity,
          easing: 'linear'
        }
      );
    }

    function queueSetup() {
      if (frameId) return;
      frameId = window.requestAnimationFrame(setup);
    }

    marquee.addEventListener('mouseenter', () => animation?.pause());
    marquee.addEventListener('mouseleave', () => animation?.play());

    queueSetup();

    // Webフォント読み込みでもコンテンツ幅が変わるため、初期化後に再計測する
    if (document.fonts?.ready) {
      document.fonts.ready.then(queueSetup).catch(() => {});
    }

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(queueSetup);
      observer.observe(marquee);
      observer.observe(original);
    } else {
      window.addEventListener('resize', debounce(queueSetup, 300));
    }
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// スムーズスクロール
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// 各要素を個別に監視し、スクロール位置に合わせて1つずつ展開
function initScrollReveal() {
  const items = Array.from(document.querySelectorAll('.cli-reveal'));

  // セクションごとに要素リストを事前構築（DOM順）
  const sectionItems = new Map();
  items.forEach(el => {
    const section = el.closest('.dir-section');
    const key = section || 'global';
    if (!sectionItems.has(key)) sectionItems.set(key, []);
    sectionItems.get(key).push(el);
  });

  // セクションごとの再生状態
  const sectionState = new Map();
  sectionItems.forEach((els, key) => {
    sectionState.set(key, { pending: [...els], playing: false });
  });

  // セクション外の要素用
  const globalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      globalObserver.unobserve(entry.target);
      entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.15 });

  // セクション内の要素用：1つ表示したら次の1つだけを監視
  function observeNext(section) {
    const state = sectionState.get(section);
    if (!state || state.pending.length === 0) {
      if (state) state.playing = false;
      return;
    }

    const el = state.pending.shift();
    state.playing = true;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        revealElement(el, () => observeNext(section));
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    obs.observe(el);
  }

  function revealElement(el, onDone) {
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

  // 各セクションの最初の要素を監視開始
  sectionItems.forEach((els, key) => {
    if (key === 'global') {
      els.forEach(el => globalObserver.observe(el));
    } else {
      observeNext(key);
    }
  });
}

// 個別エントリのクリック開閉
function initDirToggle() {
  document.querySelectorAll('.dir-entry[data-toggle]').forEach(entry => {
    const name = entry.querySelector(':scope > .dir-name');
    if (!name) return;

    name.addEventListener('click', (e) => {
      e.stopPropagation();
      const opening = !entry.classList.contains('is-open');
      entry.classList.toggle('is-open');
      entry.setAttribute('aria-expanded', String(opening));
    });
  });
}

// コマンド行クリックでセクション内全エントリを一括開閉
function initToggleAll() {
  document.querySelectorAll('[data-toggle-all]').forEach(cliLine => {
    cliLine.addEventListener('click', () => {
      const section = cliLine.closest('.dir-section');
      if (!section) return;

      const entries = section.querySelectorAll('.dir-entry[data-toggle]');
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

      cliLine.setAttribute('aria-expanded', String(!allOpen));
    });

    // キーボード対応
    cliLine.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cliLine.click();
      }
    });
  });
}

// ツールチップ（技術スタック）
function initTooltip() {
  const tooltip = document.getElementById('tooltip');
  const wrapper = document.querySelector('.marquee-wrapper');
  if (!tooltip || !wrapper) return;

  const isTouchDevice = () => 'ontouchstart' in window;
  let activeSpan = null;

  function show(span) {
    const tip = span.dataset.tip;
    if (!tip) return;

    tooltip.textContent = tip;
    tooltip.classList.add('is-visible');
    tooltip.setAttribute('aria-hidden', 'false');
    activeSpan = span;

    const rect = span.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
    const top = rect.top - tooltip.offsetHeight - 8;

    // viewport clamp
    left = Math.max(8, Math.min(left, window.innerWidth - tooltip.offsetWidth - 8));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hide() {
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
    activeSpan = null;
  }

  // Desktop: mouseover/mouseleave via event delegation
  wrapper.addEventListener('mouseover', (e) => {
    if (isTouchDevice()) return;
    const span = e.target.closest('.marquee-content span[data-tip]');
    if (span) show(span);
  });

  wrapper.addEventListener('mouseleave', () => {
    if (isTouchDevice()) return;
    hide();
  });

  wrapper.addEventListener('mouseout', (e) => {
    if (isTouchDevice()) return;
    const span = e.target.closest('.marquee-content span[data-tip]');
    if (span) hide();
  });

  // Mobile: tap toggle
  wrapper.addEventListener('click', (e) => {
    if (!isTouchDevice()) return;
    const span = e.target.closest('.marquee-content span[data-tip]');
    if (!span) { hide(); return; }
    if (activeSpan === span) { hide(); return; }
    show(span);
  });

  // Close on outside tap (mobile)
  document.addEventListener('click', (e) => {
    if (!activeSpan) return;
    if (!wrapper.contains(e.target)) hide();
  });

  // Hide on scroll
  window.addEventListener('scroll', hide, { passive: true });
}

// コンタクトフォーム
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('.dir-submit');
    const original = btn.innerHTML;

    btn.innerHTML = './sending...<span class="cursor-blink">_</span>';
    btn.disabled = true;

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.value,
          email: form.email.value,
          message: form.message.value,
          website: form.website?.value || '',
        }),
      });

      if (!res.ok) throw new Error('送信失敗');

      btn.innerHTML = 'sent <span class="status-ok">&#10003;</span>';
      setTimeout(() => {
        form.reset();
        btn.innerHTML = original;
        btn.disabled = false;
      }, 2000);
    } catch {
      btn.innerHTML = 'error <span class="status-error">&#10007;</span>';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 2000);
    }
  });
}
