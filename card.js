// 名刺ビューアー — 表裏・縦横・チルトを分離して操作性を安定化

document.addEventListener('DOMContentLoaded', () => {
  const tilt = document.getElementById('card-tilt');
  const orientation = document.getElementById('card-orientation');
  const card = document.getElementById('card-body');
  if (!tilt || !orientation || !card) return;

  const buttons = {
    flip: document.querySelector('[data-card-action="flip"]'),
    orientation: document.querySelector('[data-card-action="orientation"]'),
    reset: document.querySelector('[data-card-action="reset"]'),
  };

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
    dragRect: null,
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

    if (buttons.flip) {
      buttons.flip.textContent = state.side === 'front' ? 'show back' : 'show front';
      buttons.flip.setAttribute('aria-pressed', String(state.side === 'back'));
    }

    if (buttons.orientation) {
      buttons.orientation.textContent = state.orientation === 'landscape' ? 'portrait' : 'landscape';
      buttons.orientation.setAttribute('aria-pressed', String(state.orientation === 'landscape'));
    }
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

  function updateTiltFromDrag(clientX, clientY, rect = card.getBoundingClientRect()) {
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
    state.dragRect = null;
    state.startTiltX = state.tiltX;
    state.startTiltY = state.tiltY;
    card.classList.remove('is-dragging');
    tilt.classList.remove('is-dragging');
  }

  function endDrag(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;

    card.releasePointerCapture(event.pointerId);
    const wasTap = !state.moved;
    finishDrag();

    if (wasTap) {
      toggleSide();
    }

    animateTiltToRest();
  }

  card.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    cancelReset();
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startTiltX = state.tiltX;
    state.startTiltY = state.tiltY;
    state.dragRect = card.getBoundingClientRect();
    state.moved = false;

    card.setPointerCapture(event.pointerId);
    card.classList.add('is-dragging');
    tilt.classList.add('is-dragging');
  });

  card.addEventListener('pointermove', (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;

    const movedX = Math.abs(event.clientX - state.startX);
    const movedY = Math.abs(event.clientY - state.startY);
    state.moved = state.moved || movedX > TAP_THRESHOLD || movedY > TAP_THRESHOLD;

    updateTiltFromDrag(event.clientX, event.clientY, state.dragRect || undefined);
  });

  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
  card.addEventListener('lostpointercapture', (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    finishDrag();
    animateTiltToRest();
  });

  card.addEventListener('keydown', (event) => {
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

  Object.entries(buttons).forEach(([action, button]) => {
    if (!button) return;

    button.addEventListener('click', () => {
      if (action === 'flip') toggleSide();
      if (action === 'orientation') toggleOrientation();
      if (action === 'reset') resetCard();
      card.focus();
    });
  });

  render();
  requestAnimationFrame(() => {
    orientation.classList.add('is-ready');
  });
});
