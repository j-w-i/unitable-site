// Appearance: dark by default (recommended), light if the visitor picks it.
// The <head> sets data-theme before paint; this wires up the controls.
(function () {
  var root = document.documentElement;
  var meta = document.querySelector('meta[name=theme-color]');

  function current() { return root.dataset.theme === 'light' ? 'light' : 'dark'; }

  function apply(theme) {
    if (theme === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    try { localStorage.setItem('unitable-theme', theme); } catch (e) {}
    sync();
  }

  function sync() {
    var t = current();
    if (meta) meta.content = t === 'light' ? '#f8f9fa' : '#0e0f11';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', t === 'light' ? 'Use dark appearance (recommended)' : 'Use light appearance');
    });
    document.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.themeSet === t));
    });
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-theme-toggle]');
    if (toggle) return apply(current() === 'light' ? 'dark' : 'light');
    var set = e.target.closest('[data-theme-set]');
    if (set) apply(set.dataset.themeSet);
  });

  sync();
})();
