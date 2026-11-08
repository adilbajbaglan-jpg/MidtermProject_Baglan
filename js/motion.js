(() => {
  const root = document.documentElement;
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userMotion = true;
  try { userMotion = localStorage.getItem('bagashop-motion') !== 'off'; }
  catch {}
  function motionEnabled() { return userMotion && !systemMotion.matches; }
  function applyMotion() {
    const enabled = motionEnabled();
    root.classList.toggle('motion-enabled', enabled);
    root.classList.toggle('motion-off', !enabled);
    $.fx.off = !enabled;
    document.querySelectorAll('.motion-toggle').forEach(button => {
      button.setAttribute('aria-pressed', String(enabled));
      button.disabled = systemMotion.matches;
      button.querySelector('[data-motion-label]').textContent = systemMotion.matches ? 'Reduced motion' : enabled ? 'Motion on' : 'Motion off';
      button.setAttribute('aria-label', enabled ? 'Turn animations off' : 'Turn animations on');
    });
    if (!enabled) {
      document.getAnimations().forEach(animation => animation.cancel());
      document.querySelectorAll('.bag-flight, .click-ripple').forEach(element => element.remove());
    }
  }
  document.querySelectorAll('.motion-toggle').forEach(button => button.addEventListener('click', () => {
    userMotion = !userMotion;
    try { localStorage.setItem('bagashop-motion', userMotion ? 'on' : 'off'); }
    catch {}
    applyMotion();
  }));
  systemMotion.addEventListener('change', applyMotion);
  applyMotion();
  const observed = new WeakSet();
  function reveal(element, delay = 0) {
    if (!motionEnabled() || !element.animate) return;
    element.animate([
      { opacity: 0, transform: 'translateY(22px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 650, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      reveal(entry.target, Number(entry.target.dataset.revealDelay) || 0);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -12px 0px' }) : null;
  function observeElements(elements) {
    elements.forEach((element, index) => {
      if (observed.has(element)) return;
      observed.add(element);
      element.dataset.revealDelay = Math.min(index % 4, 3) * 65;
      if (observer) observer.observe(element);
      else reveal(element);
    });
  }
  observeElements(document.querySelectorAll('.hero-copy > *, .section-heading, .story-banner > div, .kit-intro, .kit-builder, .page-heading > *, .about-hero > *, .values-grid article, .faq-item, .credits-grid > div, .contact-main, .contact-sidebar, .small-banner'));
  observeElements(document.querySelectorAll('.product-card'));
  document.addEventListener('productsrendered', event => observeElements(event.detail.container.querySelectorAll('.product-card')));
  let scrollFrame = 0;
  const progress = document.querySelector('.reading-progress span');
  const header = document.querySelector('.site-header');
  function updateScroll() {
    const distance = root.scrollHeight - window.innerHeight;
    const amount = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
    progress.style.transform = 'scaleX(' + amount + ')';
    header.classList.toggle('is-scrolled', window.scrollY > 20);
    scrollFrame = 0;
  }
  function requestScrollUpdate() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  window.addEventListener('load', requestScrollUpdate);
  updateScroll();
  function pulse(element, strength = 1.2) {
    if (!motionEnabled() || !element?.animate) return;
    element.getAnimations().forEach(animation => animation.cancel());
    element.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + strength + ')' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  let addTrigger = null;
  document.addEventListener('click', event => {
    addTrigger = event.target.closest('[data-add]');
    const button = event.target.closest('.button, .filter-pill, .add-button');
    if (!button || !motionEnabled() || event.detail === 0) return;
    const bounds = button.getBoundingClientRect();
    const size = Math.max(bounds.width, bounds.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = event.clientX - bounds.left - size / 2 + 'px';
    ripple.style.top = event.clientY - bounds.top - size / 2 + 'px';
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    window.setTimeout(() => ripple.remove(), 750);
  }, true);
  document.addEventListener('productadded', event => {
    if (!motionEnabled() || !addTrigger) return;
    pulse(addTrigger, 1.13);
    if (document.querySelector('dialog[open]')) return;
    const photo = document.querySelector('[data-product-id="' + event.detail.id + '"] .product-image img');
    const target = document.querySelector('.bag-button');
    if (!photo || !target || !photo.animate) return;
    const start = photo.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    if (start.bottom < 0 || start.top > window.innerHeight) return;
    const flight = document.createElement('img');
    flight.src = photo.src;
    flight.alt = '';
    flight.setAttribute('aria-hidden', 'true');
    flight.className = 'bag-flight';
    const x = start.left + start.width / 2 - 26;
    const y = Math.max(0, start.top + start.height / 2 - 26);
    flight.style.left = x + 'px';
    flight.style.top = y + 'px';
    document.body.appendChild(flight);
    const dx = end.left + end.width / 2 - 26 - x;
    const dy = end.top + end.height / 2 - 26 - y;
    const animation = flight.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * .6 + 'px,' + (dy * .45 - 55) + 'px) scale(.8)', opacity: .95, offset: .55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.15)', opacity: 0 }
    ], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)' });
    animation.finished.then(() => { flight.remove(); pulse(target, 1.08); }).catch(() => flight.remove());
  });
  document.addEventListener('cartchange', () => {
    document.querySelectorAll('.cart-count').forEach(element => pulse(element, 1.3));
    requestScrollUpdate();
  });
  document.addEventListener('savedchange', () => {
    document.querySelectorAll('.save-button[aria-pressed=true]').forEach(element => pulse(element, 1.16));
    requestScrollUpdate();
  });
})();
