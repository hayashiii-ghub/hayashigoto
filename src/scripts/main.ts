// はやしごと - メインの JavaScript

// ViewTransitions で DOM が差し替わっても document/window の listener は残るため、
// 多重登録を防ぐためのモジュールレベルフラグ。
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

// astro:page-load fires on initial load AND every view transition.
document.addEventListener('astro:page-load', init);

// Hero ロゴ画像のフォールバック（CSP対応のため JS で処理）
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

// ローディング画面（実際の読み込み完了で消す）
function initLoader(): void {
  const loader = document.getElementById('loader');
  if (!loader) return;

  const dismiss = (): void => loader.classList.add('is-hidden');

  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss);
  }
}

// マーキー（画面幅に応じて動的に複製・アニメーション設定）
function initMarquee(): void {
  const MARQUEE_SPEED = 50; // px per second（全行共通）
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

    function stopAnimation(): void {
      animation?.cancel();
      animation = undefined;
    }

    function setup(): void {
      frameId = 0;
      const trackGap = parseFloat(getComputedStyle(track!).gap) || 16;

      // scrollWidth / offsetWidth は整数丸めされるため、ループ境界がずれてガクつきやすい
      const oneSetWidth = original!.getBoundingClientRect().width + trackGap;
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
        const clone = original!.cloneNode(true) as HTMLElement;
        clone.setAttribute('aria-hidden', 'true');
        track!.appendChild(clone);
      }

      // 1セット分だけ移動してループ
      const from = isReverse ? `-${oneSetWidth}px` : '0px';
      const to = isReverse ? '0px' : `-${oneSetWidth}px`;

      stopAnimation();

      animation = track!.animate(
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

    function queueSetup(): void {
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
      if (!_marqueeResizeAttached) {
        window.addEventListener('resize', debounce(queueSetup, 300));
        _marqueeResizeAttached = true;
      }
    }
  });
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// スムーズスクロール
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

// 各要素を個別に監視し、スクロール位置に合わせて1つずつ展開
function initScrollReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.cli-reveal'));
  if (items.length === 0) return;

  // セッション中2回目以降はアニメーションをスキップして即表示
  if (sessionStorage.getItem('revealed')) {
    items.forEach(el => {
      el.classList.add('is-visible');
      if (el.classList.contains('dir-entry')) {
        el.classList.add('is-open');
        const innerBtn = el.querySelector<HTMLButtonElement>(':scope > .dir-entry-toggle');
        if (innerBtn) innerBtn.setAttribute('aria-expanded', 'true');
      }
    });
    return;
  }

  sessionStorage.setItem('revealed', '1');

  // セクションごとに要素リストを事前構築（DOM順）
  const sectionItems = new Map<Element | string, HTMLElement[]>();
  items.forEach(el => {
    const section = el.closest('.dir-section');
    const key: Element | string = section || 'global';
    if (!sectionItems.has(key)) sectionItems.set(key, []);
    sectionItems.get(key)!.push(el);
  });

  // セクションごとの再生状態
  const sectionState = new Map<Element | string, { pending: HTMLElement[]; playing: boolean }>();
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
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    obs.observe(el);
  }

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

// コマンド行クリックでセクション内全エントリを一括開閉
function initToggleAll(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-toggle-all]').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.dir-section');
      if (!section) return;

      const entries = section.querySelectorAll('.dir-entry[data-toggle]');
      const allOpen = Array.from(entries).every(e => e.classList.contains('is-open'));

      entries.forEach((entry, i) => {
        setTimeout(() => {
          const isOpening = !allOpen;
          entry.classList.toggle('is-open', isOpening);
          const innerBtn = entry.querySelector<HTMLButtonElement>(':scope > .dir-entry-toggle');
          if (innerBtn) innerBtn.setAttribute('aria-expanded', String(isOpening));
        }, i * 80);
      });

      btn.setAttribute('aria-expanded', String(!allOpen));
    });
  });
}

// ライトボックス（画像オーバーレイ）
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

  // Click on backdrop (dialog itself, not the image) closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}

// フォームフィールド取得（null-safe）
function getField<T extends HTMLElement>(form: HTMLFormElement, name: string): T | null {
  const el = form.elements.namedItem(name);
  return el instanceof HTMLElement ? (el as T) : null;
}

// コンタクトフォーム
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
      const category = getField<HTMLSelectElement>(form, 'category');
      const name = getField<HTMLInputElement>(form, 'name');
      const email = getField<HTMLInputElement>(form, 'email');
      const message = getField<HTMLTextAreaElement>(form, 'message');
      const website = getField<HTMLInputElement>(form, 'website');

      // 必須フィールドが見つからない (HTML 壊れている)
      if (!category || !name || !email || !message) {
        btn.innerHTML = original;
        btn.disabled = false;
        throw new Error('フォーム要素が見つかりません');
      }

      const formData = {
        category: category.value,
        name: name.value,
        email: email.value,
        message: message.value,
        website: website?.value ?? '',
      };

      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: { error?: string; success?: boolean } = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || '送信失敗');
      }

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
