// 名刺ビューアー — オーバーレイ方式でモバイル対応

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('card-overlay');
  const tilt = document.getElementById('card-tilt');
  const orientation = document.getElementById('card-orientation');
  const card = document.getElementById('card-body');
  if (!overlay || !tilt || !orientation || !card) return;

  const state = {
    side: 'front',
    orientation: 'portrait',
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
  let resetFrame = 0;
  let sideSwapTimer = 0;
  let sideCleanupTimer = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function renderTilt() {
    tilt.style.transform = `rotateX(${state.tiltX.toFixed(2)}deg) rotateY(${state.tiltY.toFixed(2)}deg)`;
  }

  function renderCard() {
    card.dataset.side = state.side;
    orientation.dataset.orientation = state.orientation;
    overlay.dataset.orientation = state.orientation;
  }

  function render() {
    renderTilt();
    renderCard();
  }

  function cancelReset() {
    if (!resetFrame) return;
    cancelAnimationFrame(resetFrame);
    resetFrame = 0;
  }

  function animateTiltToRest() {
    cancelReset();

    const startX = state.tiltX;
    const startY = state.tiltY;
    if (!startX && !startY) return;

    const startedAt = performance.now();

    function step(now) {
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

  function updateTiltFromDrag(clientX, clientY) {
    const rect = overlay.getBoundingClientRect();
    const deltaX = clientX - state.startX;
    const deltaY = clientY - state.startY;
    const normalizedX = rect.width ? (deltaX / rect.width) * DRAG_SENSITIVITY : 0;
    const normalizedY = rect.height ? (deltaY / rect.height) * DRAG_SENSITIVITY : 0;

    state.tiltY = clamp(state.startTiltY + normalizedX * MAX_TILT_Y, -MAX_TILT_Y, MAX_TILT_Y);
    state.tiltX = clamp(state.startTiltX - normalizedY * MAX_TILT_X, -MAX_TILT_X, MAX_TILT_X);
    renderTilt();
  }

  function toggleSide() {
    if (state.switching) return;

    state.switching = true;
    const nextSide = state.side === 'front' ? 'back' : 'front';
    const directionClass = nextSide === 'back' ? 'is-switching-forward' : 'is-switching-reverse';

    card.classList.remove('is-switching', 'is-switching-forward', 'is-switching-reverse');
    void card.offsetWidth; // force reflow to restart animation
    card.classList.add('is-switching', directionClass);

    clearTimeout(sideSwapTimer);
    clearTimeout(sideCleanupTimer);

    sideSwapTimer = window.setTimeout(() => {
      state.side = nextSide;
      renderCard();
    }, SIDE_SWITCH_DURATION / 2);

    sideCleanupTimer = window.setTimeout(() => {
      card.classList.remove('is-switching', 'is-switching-forward', 'is-switching-reverse');
      state.switching = false;
    }, SIDE_SWITCH_DURATION);
  }

  function toggleOrientation() {
    if (state.switching) return;
    state.orientation = state.orientation === 'landscape' ? 'portrait' : 'landscape';
    renderCard();
  }

  function resetCard() {
    clearTimeout(sideSwapTimer);
    clearTimeout(sideCleanupTimer);
    state.switching = false;
    card.classList.remove('is-switching', 'is-switching-forward', 'is-switching-reverse');
    state.side = 'front';
    state.orientation = 'portrait';
    renderCard();
    animateTiltToRest();
  }

  function finishDrag() {
    state.dragging = false;
    state.pointerId = null;
    state.startTiltX = state.tiltX;
    state.startTiltY = state.tiltY;
    overlay.classList.remove('is-dragging');
  }

  function endDrag(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;

    overlay.releasePointerCapture(event.pointerId);
    const wasTap = !state.moved;
    finishDrag();

    if (wasTap) {
      toggleSide();
    }

    animateTiltToRest();
  }

  // すべてのポインターイベントをオーバーレイで受け取る
  overlay.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    cancelReset();
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startTiltX = state.tiltX;
    state.startTiltY = state.tiltY;
    state.moved = false;

    overlay.setPointerCapture(event.pointerId);
    overlay.classList.add('is-dragging');
  });

  overlay.addEventListener('pointermove', (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;

    const movedX = Math.abs(event.clientX - state.startX);
    const movedY = Math.abs(event.clientY - state.startY);
    state.moved = state.moved || movedX > TAP_THRESHOLD || movedY > TAP_THRESHOLD;

    updateTiltFromDrag(event.clientX, event.clientY);
  });

  overlay.addEventListener('pointerup', endDrag);
  overlay.addEventListener('pointercancel', endDrag);
  overlay.addEventListener('lostpointercapture', (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    finishDrag();
    animateTiltToRest();
  });

  // キーボード操作（オーバーレイにフォーカスがある場合）
  overlay.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      toggleSide();
      return;
    }

    if (key === 'o') {
      event.preventDefault();
      toggleOrientation();
      return;
    }

    if (key === 'r') {
      event.preventDefault();
      resetCard();
    }
  });

  render();
  requestAnimationFrame(() => {
    orientation.classList.add('is-ready');
  });
});
