// Theme toggle for legal pages: follows OS setting, stores nothing
const R = document.documentElement;
const tt = document.getElementById('tt');
const SUN_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const MOON_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

let dark = matchMedia('(prefers-color-scheme: dark)').matches;
const apply = () => {
  R.dataset.theme = dark ? 'dark' : 'light';
  tt.innerHTML = dark ? SUN_ICON : MOON_ICON;
  tt.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  tt.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
};
tt.addEventListener('click', () => {
  dark = !dark;
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(apply);
  else apply();
});
apply();