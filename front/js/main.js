(() => {
  const root = document.querySelector('.js-bonus-slider');
  if (!root) return;

  const sliderRow = root.querySelector('.js-bonus-slider-row');
  const prevBtn = root.querySelector('.js-bonus-slider-prev');
  const nextBtn = root.querySelector('.js-bonus-slider-next');
  const sliderContainer = root.querySelector('.js-bonus-slider-container');
  const leftFade = root.querySelector('.js-bonus-slider-fade-left');
  const rightFade = root.querySelector('.js-bonus-slider-fade-right');

  if (
    !sliderRow ||
    !prevBtn ||
    !nextBtn ||
    !sliderContainer ||
    !leftFade ||
    !rightFade
  )
    return;

  const items = Array.from(sliderRow.children).filter((el) =>
    el.classList.contains('bonus-card')
  );
  if (!items.length) return;

  const mql = window.matchMedia('(max-width: 1388px)');

  let currentStep = 0;
  let maxSteps = 0;
  let slideStep = 0;

  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;
  let isMouseDown = false;
  const minSwipeDistance = 50;

  let isEnabled = false;

  const runWithAnimation = (fn) => {
    // Transition should never affect initial render/recalc; only user-driven moves.
    root.classList.add('bonusCas__bonusSlider--animating');
    fn();

    const cleanup = () => root.classList.remove('bonusCas__bonusSlider--animating');
    sliderRow.addEventListener('transitionend', cleanup, { once: true });
    window.setTimeout(cleanup, 400);
  };

  const getEdgeInset = () => {
    const styles = window.getComputedStyle(root);
    const raw = styles.getPropertyValue('--slider-edge-inset') || '0px';
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : 0;
  };

  const getRowGap = () => {
    const styles = window.getComputedStyle(sliderRow);
    const gap = styles.gap || styles.columnGap || '0px';
    const gapValue = parseFloat(gap);
    return Number.isFinite(gapValue) ? gapValue : 0;
  };

  const resetDesktop = () => {
    currentStep = 0;
    maxSteps = 0;
    slideStep = 0;
    sliderRow.style.transform = '';
    leftFade.classList.remove('visible');
    rightFade.classList.remove('visible');
  };

  const recalc = () => {
    if (!isEnabled) return;
    const first = items[0];
    const gap = getRowGap();
    // Avoid rounding: on some breakpoints it can hide small overflow (fractional px),
    // which incorrectly disables the "next" arrow.
    slideStep = first.getBoundingClientRect().width + gap;

    const containerWidth = sliderContainer.getBoundingClientRect().width;
    const totalSlidesWidth = items.length * slideStep - gap;
    const edgeInset = getEdgeInset();

    // How far (px) we can/should translate to show the last card fully.
    // Note: the last-step positioning includes `-edgeInset` (see update()).
    const maxTranslateAbs = totalSlidesWidth - containerWidth + edgeInset;
    maxSteps = maxTranslateAbs > 1 ? Math.ceil(maxTranslateAbs / slideStep) : 0;

    if (currentStep > maxSteps) currentStep = maxSteps;
    update();
  };

  const updateFadeOverlays = () => {
    if (currentStep > 0) leftFade.classList.add('visible');
    else leftFade.classList.remove('visible');

    if (currentStep < maxSteps && maxSteps > 0) rightFade.classList.add('visible');
    else rightFade.classList.remove('visible');
  };

  const update = () => {
    if (!isEnabled) return;
    if (!slideStep) return;

    const edgeInset = getEdgeInset();
    let translateX = -currentStep * slideStep;

    if (currentStep === 0 && edgeInset > 0) {
      translateX += edgeInset;
    }

    if (currentStep === maxSteps && maxSteps > 0) {
      const gap = getRowGap();
      const containerWidth = sliderContainer.getBoundingClientRect().width;
      const totalSlidesWidth = items.length * slideStep - gap;
      translateX = -(totalSlidesWidth - containerWidth) - edgeInset;
    }

    sliderRow.style.transform = `translateX(${translateX}px)`;

    prevBtn.style.opacity = currentStep === 0 ? '0.5' : '1';
    prevBtn.style.pointerEvents = currentStep === 0 ? 'none' : 'auto';
    nextBtn.style.opacity = currentStep >= maxSteps ? '0.5' : '1';
    nextBtn.style.pointerEvents = currentStep >= maxSteps ? 'none' : 'auto';

    updateFadeOverlays();
  };

  const handleSwipe = () => {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (
      Math.abs(deltaX) > minSwipeDistance &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      if (deltaX > 0) {
        if (currentStep > 0) currentStep -= 1;
      } else {
        if (currentStep < maxSteps) currentStep += 1;
      }
      runWithAnimation(update);
    }
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);

    if (deltaX > deltaY) e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;
    handleSwipe();
  };

  const handleMouseDown = (e) => {
    isMouseDown = true;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown) return;
    const deltaX = Math.abs(e.clientX - touchStartX);
    const deltaY = Math.abs(e.clientY - touchStartY);
    if (deltaX > deltaY) e.preventDefault();
  };

  const handleMouseUp = (e) => {
    if (!isMouseDown) return;
    isMouseDown = false;
    touchEndX = e.clientX;
    touchEndY = e.clientY;
    handleSwipe();
  };

  const handleMouseLeave = () => {
    if (isMouseDown) isMouseDown = false;
  };

  prevBtn.addEventListener('click', () => {
    if (!isEnabled) return;
    if (currentStep > 0) {
      currentStep -= 1;
      runWithAnimation(update);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!isEnabled) return;
    if (currentStep < maxSteps) {
      currentStep += 1;
      runWithAnimation(update);
    }
  });

  const attach = () => {
    if (isEnabled) return;
    isEnabled = true;
    root.classList.remove('bonusCas__bonusSlider--animating');

    sliderContainer.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    sliderContainer.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    sliderContainer.addEventListener('touchend', handleTouchEnd, {
      passive: false,
    });

    sliderContainer.addEventListener('mousedown', handleMouseDown);
    sliderContainer.addEventListener('mousemove', handleMouseMove);
    sliderContainer.addEventListener('mouseup', handleMouseUp);
    sliderContainer.addEventListener('mouseleave', handleMouseLeave);

    window.addEventListener('resize', recalc);
    recalc();
  };

  const detach = () => {
    if (!isEnabled) return;
    isEnabled = false;
    root.classList.remove('bonusCas__bonusSlider--animating');

    sliderContainer.removeEventListener('touchstart', handleTouchStart);
    sliderContainer.removeEventListener('touchmove', handleTouchMove);
    sliderContainer.removeEventListener('touchend', handleTouchEnd);

    sliderContainer.removeEventListener('mousedown', handleMouseDown);
    sliderContainer.removeEventListener('mousemove', handleMouseMove);
    sliderContainer.removeEventListener('mouseup', handleMouseUp);
    sliderContainer.removeEventListener('mouseleave', handleMouseLeave);

    window.removeEventListener('resize', recalc);
    resetDesktop();
  };

  const syncByBreakpoint = () => {
    if (mql.matches) attach();
    else detach();
  };

  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', syncByBreakpoint);
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(syncByBreakpoint);
  }

  syncByBreakpoint();
})();
