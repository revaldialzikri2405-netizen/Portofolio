(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.motion-toggle');
  let userPaused = false;
  try { userPaused = localStorage.getItem('portfolio-motion') === 'paused'; } catch {}

  const animations = new Set();
  const isMotionEnabled = () => !userPaused && !reducedMotion.matches;
  const isIndonesian = () => root.lang === 'id';

  function updateMotion() {
    const enabled = isMotionEnabled();
    root.dataset.motion = enabled ? 'on' : 'off';
    toggle.hidden = reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.querySelector('.motion-icon').textContent = userPaused ? '▷' : 'Ⅱ';
    toggle.querySelector('.motion-label').textContent = userPaused
      ? (isIndonesian() ? 'Lanjutkan animasi' : 'Resume motion')
      : (isIndonesian() ? 'Jeda animasi' : 'Pause motion');
    if (!enabled) {
      animations.forEach(animation => animation.finish());
      animations.clear();
    }
  }

  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('portfolio-motion', userPaused ? 'paused' : 'on'); } catch {}
    updateMotion();
  });
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('portfolio:languagechange', updateMotion);
  updateMotion();

  const revealTargets = document.querySelectorAll('.hero-copy-wrap, .hero-art, .about-panel, .section-heading-row, .project-card, .gallery-card, .timeline li, .education-card, .skills-panel, .contact-panel');
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        element.classList.add('has-entered');
        if (isMotionEnabled() && typeof element.animate === 'function') {
          const animation = element.animate([
            { opacity: 0, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
        reveal.unobserve(element);
      });
    }, { threshold: .08 });
    revealTargets.forEach(element => reveal.observe(element));

    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
    });
    document.querySelectorAll('.hero-art, .contact-panel').forEach(element => visibility.observe(element));
  }

  const links = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-links a[href^="#"]')];
  const sections = [...document.querySelectorAll('main > section[id]')];
  let framePending = false;
  function updateReadingPosition() {
    const maxScroll = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--reading-progress', maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0);
    let current = '';
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= window.innerHeight * .35) current = section.id;
    });
    links.forEach(link => {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    framePending = false;
  }
  function queueReadingUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateReadingPosition);
  }
  window.addEventListener('scroll', queueReadingUpdate, { passive: true });
  window.addEventListener('resize', queueReadingUpdate);
  window.addEventListener('load', queueReadingUpdate);
  document.addEventListener('portfolio:languagechange', queueReadingUpdate);
  updateReadingPosition();

  const menu = document.querySelector('.mobile-menu');
  document.querySelectorAll('.mobile-links a').forEach(link => {
    link.addEventListener('click', () => {
      menu.open = false;
      if (link.hash) document.querySelector(link.hash)?.focus({ preventScroll: true });
    });
  });
  sections.forEach(section => section.setAttribute('tabindex', '-1'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });

  // The native dialog supplies Escape handling, focus containment, and focus return.
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-dialog';
  dialog.setAttribute('aria-labelledby', 'photo-dialog-caption');
  dialog.innerHTML = '<div class="photo-dialog-inner"><button class="photo-close" type="button">×</button><img alt=""><p class="photo-dialog-caption" id="photo-dialog-caption"></p></div>';
  document.body.append(dialog);
  const dialogImage = dialog.querySelector('img');
  const caption = dialog.querySelector('.photo-dialog-caption');
  const close = dialog.querySelector('.photo-close');
  let previousOverflow = '';
  let openedFrom;

  const photoButtons = document.querySelectorAll('.gallery-open');
  function updatePhotoLabels() {
    photoButtons.forEach(button => {
      button.setAttribute('aria-label', `${isIndonesian() ? 'Perbesar foto' : 'Enlarge photo'}: ${button.querySelector('img').alt}`);
    });
    close.setAttribute('aria-label', isIndonesian() ? 'Tutup foto' : 'Close photo');
  }
  updatePhotoLabels();
  document.addEventListener('portfolio:languagechange', updatePhotoLabels);
  photoButtons.forEach(button => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      dialogImage.src = image.currentSrc || image.src;
      dialogImage.alt = image.alt;
      caption.textContent = button.closest('figure').querySelector('figcaption').innerText.replace(/\s+/g, ' ').trim();
      openedFrom = button;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    openedFrom?.focus({ preventScroll: true });
  });
})();
