(() => {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const key = 'bagashop-theme';

  function apply(theme) {
    const light = theme === 'light';
    root.dataset.theme = light ? 'light' : 'dark';
    themeColor.content = light ? '#f7f4ed' : '#141416';
    const button = document.querySelector('.theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(light));
      button.title = light ? 'Switch to dark mode' : 'Switch to light mode';
    }
  }

  function restore() {
    let theme = 'dark';
    try { theme = localStorage.getItem(key) || 'dark'; } catch {}
    apply(theme);
  }

  restore();
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    let clearTransition;
    document.querySelector('.theme-toggle').addEventListener('click', () => {
      if (root.classList.contains('motion-enabled')) {
        root.classList.add('theme-changing');
        window.clearTimeout(clearTransition);
        clearTransition = window.setTimeout(() => root.classList.remove('theme-changing'), 450);
      }
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      apply(next);
      try { localStorage.setItem(key, next); } catch {}
    });
  });
  window.addEventListener('pageshow', event => { if (event.persisted) restore(); });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) restore(); });
})();
