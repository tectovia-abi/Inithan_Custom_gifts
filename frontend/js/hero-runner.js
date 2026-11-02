/**
 * Hero Banner Runner Auto-Cycling Logic
 * Inithan Custom Gifts
 */
document.addEventListener('DOMContentLoaded', function () {
  const runner = document.getElementById('heroBannerRunner');
  if (!runner) return;

  const slides = runner.querySelectorAll('.runner-slide');
  const dots = runner.querySelectorAll('.runner-dot');
  const prevBtn = document.getElementById('runnerPrevBtn');
  const nextBtn = document.getElementById('runnerNextBtn');
  const progressBar = document.getElementById('runnerProgressBar');
  if (!slides.length) return;

  let currentIndex = 0;
  const slideDuration = 3400; // 3.4 seconds per slide
  let intervalTimer = null;
  let isPaused = false;

  function showSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentIndex = index;

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentIndex);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });

    resetProgress();
  }

  function resetProgress() {
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      // Force reflow
      void progressBar.offsetWidth;
      progressBar.style.transition = `width ${slideDuration}ms linear`;
      progressBar.style.width = '100%';
    }
  }

  function nextSlide() {
    showSlide(currentIndex + 1);
  }

  function prevSlide() {
    showSlide(currentIndex - 1);
  }

  function startAutoRun() {
    stopAutoRun();
    resetProgress();
    intervalTimer = setInterval(() => {
      if (!isPaused) {
        nextSlide();
      }
    }, slideDuration);
  }

  function stopAutoRun() {
    if (intervalTimer) clearInterval(intervalTimer);
  }

  // Prev / Next button clicks
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      prevSlide();
      startAutoRun();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      nextSlide();
      startAutoRun();
    });
  }

  // Dots click
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetIndex = parseInt(dot.getAttribute('data-slide'), 10);
      showSlide(targetIndex);
      startAutoRun();
    });
  });

  // Pause on hover
  runner.addEventListener('mouseenter', () => {
    isPaused = true;
  });

  runner.addEventListener('mouseleave', () => {
    isPaused = false;
  });

  // Touch Swipe for Mobile
  let startX = 0;
  runner.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isPaused = true;
  }, { passive: true });

  runner.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    isPaused = false;
    const diff = startX - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
      startAutoRun();
    }
  }, { passive: true });

  // Initialize
  showSlide(0);
  startAutoRun();
});
