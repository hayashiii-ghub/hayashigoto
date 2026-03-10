// はやしごと - メインの JavaScript

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initMarquee();
  initSmoothScroll();
  initScrollReveal();
  initDirToggle();
  initToggleAll();
  initContactForm();
  initTooltip();
});

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
  let counter = 0;

  const MARQUEE_SPEED = 50; // px per second（全行共通）

  document.querySelectorAll('.marquee').forEach(marquee => {
    const track = marquee.querySelector('.marquee-track');
    const original = track.querySelector('.marquee-content');
    if (!original) return;

    const isReverse = marquee.classList.contains('marquee--reverse');
    const trackGap = parseFloat(getComputedStyle(track).gap) || 16;

    function setup() {
      // 既存の複製を削除
      track.querySelectorAll('.marquee-content[aria-hidden]').forEach(el => el.remove());

      // 1セット分の幅を計測（トラックのgap込み）
      const oneSetWidth = original.scrollWidth + trackGap;
      const viewWidth = marquee.offsetWidth;

      // 画面を隙間なく埋めるのに必要な複製数（最低1つ）
      const copies = Math.ceil(viewWidth / oneSetWidth) + 1;

      for (let i = 0; i < copies; i++) {
        const clone = original.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      }

      // 1セット分だけ移動してループ
      const name = `marquee-${counter++}`;
      const from = isReverse ? `-${oneSetWidth}px` : '0px';
      const to = isReverse ? '0px' : `-${oneSetWidth}px`;

      const keyframes = new KeyframeEffect(
        track,
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

      // 既存アニメーションを停止
      track.getAnimations().forEach(a => a.cancel());

      const anim = new Animation(keyframes, document.timeline);
      anim.play();

      // ホバーで一時停止
      marquee.onmouseenter = () => anim.pause();
      marquee.onmouseleave = () => anim.play();
    }

    let lastWidth = marquee.offsetWidth;
    setup();
    window.addEventListener('resize', debounce(() => {
      const currentWidth = marquee.offsetWidth;
      if (currentWidth !== lastWidth) {
        lastWidth = currentWidth;
        setup();
      }
    }, 300));
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

// コンタクトフォーム（UIのみ）
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('.dir-submit');
    const original = btn.innerHTML;

    btn.innerHTML = './sending...<span class="cursor-blink">_</span>';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = 'sent <span style="color:#5a7f4f">&#10003;</span>';

      setTimeout(() => {
        form.reset();
        btn.innerHTML = original;
        btn.disabled = false;
      }, 2000);
    }, 1000);
  });
}
