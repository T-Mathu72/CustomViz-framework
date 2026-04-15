// ===== THEME.JS — Dark / Light toggle =====

(function () {
  const html = document.documentElement;
  const btn  = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';

    // Smooth transition only during the switch
    html.classList.add('theme-transitioning');
    html.setAttribute('data-theme', next);
    localStorage.setItem('cv-theme', next);
    setTimeout(() => html.classList.remove('theme-transitioning'), 300);
  });
})();
