// 名刺ビューアー — オーバーレイ方式でモバイル対応
// astro:page-load で毎回再 init し、古い window/document リスナは AbortController で破棄する。

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

  const initialOrientation: CardOrientation = ((orientation.dataset.orientation as CardOrientation | undefined) ?? 'portrait');

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
    void card!.offsetWidth; // force reflow to restart animation
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

  function beginDrag(pointerId: number | string, clientX: number, clientY: number): void {
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

  function moveDrag(pointerId: number | string, clientX: number, clientY: number): boolean {
    if (!state.dragging || pointerId !== state.pointerId) return false;

    const movedX = Math.abs(clientX - state.startX);
    const movedY = Math.abs(clientY - state.startY);
    state.moved = state.moved || movedX > TAP_THRESHOLD || movedY > TAP_THRESHOLD;

    updateTiltFromDrag(clientX, clientY);
    return true;
  }

  function endDrag(pointerId: number | string, { toggleTap = true }: { toggleTap?: boolean } = {}): boolean {
    if (!state.dragging || pointerId !== state.pointerId) return false;

    const wasTap = !state.moved;
    finishDrag();

    if (toggleTap && wasTap) {
      toggleSide();
    }

    animateTiltToRest();
    return true;
  }

  function cancelDrag(pointerId: number | string): boolean {
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
      // Safari can expose the API but reject capture depending on pointer state.
    }
  }

  function safeReleasePointerCapture(pointerId: number): void {
    if (!supportsPointerCapture) return;

    if (typeof overlay!.hasPointerCapture === 'function' && !overlay!.hasPointerCapture(pointerId)) {
      return;
    }

    try {
      overlay!.releasePointerCapture(pointerId);
    } catch {
      // Some browsers implicitly release capture before pointerup.
    }
  }

  function findTouchById(touchList: TouchList, identifier: number): Touch | null {
    for (const touch of touchList) {
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

  if (supportsPointerEvents) {
    overlay.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      beginDrag(event.pointerId, event.clientX, event.clientY);
      safeSetPointerCapture(event.pointerId);
    }, { signal });

    overlay.addEventListener('pointermove', (event: PointerEvent) => {
      moveDrag(event.pointerId, event.clientX, event.clientY);
    }, { signal });

    overlay.addEventListener('pointerup', (event: PointerEvent) => {
      endDrag(event.pointerId);
      safeReleasePointerCapture(event.pointerId);
    }, { signal });

    overlay.addEventListener('pointercancel', (event: PointerEvent) => {
      cancelDrag(event.pointerId);
      safeReleasePointerCapture(event.pointerId);
    }, { signal });
  } else {
    overlay.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button !== 0) return;

      beginDrag('mouse', event.clientX, event.clientY);

      if (!legacyMouseListenersAttached) {
        window.addEventListener('mousemove', onLegacyMouseMove, { signal });
        window.addEventListener('mouseup', onLegacyMouseUp, { signal });
        legacyMouseListenersAttached = true;
      }
    }, { signal });

    overlay.addEventListener('touchstart', (event: TouchEvent) => {
      const [touch] = event.changedTouches;
      if (!touch) return;

      event.preventDefault();
      beginDrag(touch.identifier, touch.clientX, touch.clientY);
    }, { passive: false, signal });

    overlay.addEventListener('touchmove', (event: TouchEvent) => {
      if (state.pointerId !== null && typeof state.pointerId === 'number') {
        const touch = findTouchById(event.changedTouches, state.pointerId);
        if (!touch) return;

        event.preventDefault();
        moveDrag(touch.identifier, touch.clientX, touch.clientY);
      }
    }, { passive: false, signal });

    overlay.addEventListener('touchend', (event: TouchEvent) => {
      if (state.pointerId !== null && typeof state.pointerId === 'number') {
        const touch = findTouchById(event.changedTouches, state.pointerId);
        if (!touch) return;

        event.preventDefault();
        endDrag(touch.identifier);
      }
    }, { passive: false, signal });

    overlay.addEventListener('touchcancel', (event: TouchEvent) => {
      if (state.pointerId !== null && typeof state.pointerId === 'number') {
        const touch = findTouchById(event.changedTouches, state.pointerId);
        if (!touch) return;

        cancelDrag(touch.identifier);
      }
    }, { passive: false, signal });
  }

  window.addEventListener('blur', handleInterruptedInteraction, { signal });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    handleInterruptedInteraction();
  }, { signal });

  // キーボード操作（オーバーレイにフォーカスがある場合）
  overlay.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      toggleSide();
      return;
    }

    if (key === 'o') {
      event.preventDefault();
      event.stopPropagation();
      toggleOrientation();
      return;
    }

    if (key === 'r') {
      event.preventDefault();
      event.stopPropagation();
      resetCard();
    }
  }, { signal });

  render();
  requestAnimationFrame(() => {
    orientation!.classList.add('is-ready');
  });
}

document.addEventListener('astro:page-load', initCard);
