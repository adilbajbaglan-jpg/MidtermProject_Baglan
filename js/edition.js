(() => {
  const edition = document.querySelector('.edition');
  const stage = edition.querySelector('.edition-stage');
  const panels = Array.from(stage.querySelectorAll('.edition-panel'));
  const tabs = Array.from(stage.querySelectorAll('[data-chapter]'));
  const scrollLink = stage.querySelector('.edition-scroll');
  const scrollLabel = scrollLink.querySelector('span');
  const muse = stage.querySelector('.muse-layer');
  const curtain = stage.querySelector('.curtain-layer');
  const paper = stage.querySelector('.workshop');
  const garden = stage.querySelector('.garden');
  const chapters = [0, .52, 1];
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => n * n * (3 - 2 * n);
  const span = (value, from, to) => clamp((value - from) / (to - from));
  const motionOn = () => document.documentElement.classList.contains('motion-enabled');
  let current = 0;
  let frame = 0;
  let drawn = -1;
  let distance = 0;
  let stickyHeight = 0;
  let stageWidth = 0;

  function selectChapter(index) {
    const old = panels[current];
    current = index;
    stage.dataset.room = String(index);
    panels.forEach((panel, i) => {
      const active = i === index;
      if (!active && panel.contains(document.activeElement)) tabs[index].focus({preventScroll:true});
      panel.inert = !active;
      if (active) panel.removeAttribute('aria-hidden');
      else panel.setAttribute('aria-hidden', 'true');
      if (active) tabs[i].setAttribute('aria-current', 'step');
      else tabs[i].removeAttribute('aria-current');
    });
    scrollLabel.textContent = index === 2 ? 'Shop collection' : 'Scroll to explore';
    if (old !== panels[index] && motionOn()) {
      panels[index].querySelector('.edition-label').animate([
        { opacity: .4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }
      ], { duration: 320, easing: 'ease-out' });
    }
  }

  function paint(progress) {
    if (progress === drawn) return;
    drawn = progress;
    const firstCut = smooth(span(progress, .10, .44));
    const lastCut = smooth(span(progress, .58, .93));
    const pan = smooth(span(progress, 0, .46));
    paper.style.clipPath = 'inset(0 0 0 ' + ((1 - firstCut) * 100) + '%)';
    garden.style.clipPath = lastCut >= 1 ? 'none' : 'circle(' + (lastCut * 145) + '% at 71% 46%)';
    curtain.style.setProperty('--drape-x', (-firstCut * stageWidth) + 'px');
    curtain.style.setProperty('--drape-angle', (-7 * pan) + 'deg');
    muse.style.setProperty('--muse-x', (-pan * 19) + '%');
    muse.style.setProperty('--muse-y', (pan * 5) + '%');
    muse.style.setProperty('--muse-scale', 1 + pan * .58);
    panels[0].style.setProperty('--copy-y', (-pan * 36) + 'px');
    paper.style.setProperty('--paper-scale', 1 + .22 * (1 - firstCut) + .28 * lastCut);
    garden.style.setProperty('--garden-scale', 1 + .33 * (1 - lastCut));
    const visible = progress < .27 ? 0 : progress < .75 ? 1 : 2;
    if (visible !== current) selectChapter(visible);
  }

  function render() {
    frame = 0;
    const rect = edition.getBoundingClientRect();
    const progress = motionOn() && distance > 0 ? clamp(-rect.top / distance) : chapters[current];
    paint(progress);
    if (rect.bottom > stickyHeight - 1 && rect.top <= 1) document.body.dataset.headerRoom = String(current);
    else delete document.body.dataset.headerRoom;
  }

  function requestRender() { if (!frame) frame = requestAnimationFrame(render); }
  function measure() {
    stickyHeight = stage.offsetHeight;
    stageWidth = stage.clientWidth;
    distance = Math.max(0, edition.offsetHeight - stickyHeight);
    drawn = -1;
    requestRender();
  }

  function goTo(index) {
    if (!motionOn() || !distance) {
      selectChapter(index);
      render();
      return;
    }
    const top = window.scrollY + edition.getBoundingClientRect().top;
    window.scrollTo({ top: top + distance * chapters[index], behavior: 'smooth' });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => goTo(i));
    tab.addEventListener('keydown', event => {
      const steps = {ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1};
      if (!Object.hasOwn(steps, event.key)) return;
      event.preventDefault();
      tabs[steps[event.key]].focus({preventScroll: true});
      goTo(steps[event.key]);
    });
  });

  scrollLink.addEventListener('click', event => {
    if (current < 2) {
      event.preventDefault();
      goTo(current + 1);
    }
  });
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  stage.addEventListener('pointermove', event => {
    if (current || !motionOn() || !finePointer.matches) return;
    const box = stage.getBoundingClientRect();
    muse.style.setProperty('--look-x', ((event.clientX - box.left) / box.width - .5) * 13 + 'px');
    muse.style.setProperty('--look-y', ((event.clientY - box.top) / box.height - .5) * 9 + 'px');
  });
  stage.addEventListener('pointerleave', () => {
    muse.style.removeProperty('--look-x');
    muse.style.removeProperty('--look-y');
  });
  document.addEventListener('motionchange', () => {
    muse.style.removeProperty('--look-x');
    muse.style.removeProperty('--look-y');
    measure();
  });
  window.addEventListener('scroll', requestRender, {passive:true});
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  selectChapter(0);
  measure();
})();
