/* ==========================================================================
   Arnab Saha — portfolio scripts
   Loaded with `defer`. The saved/system theme is applied by a tiny inline
   script in <head> (no dark → light flash), so everything here can safely wait
   for the DOM. Each feature runs inside run(), so one failure never takes the
   others down.
   ========================================================================== */
(function () {
  'use strict';

  // Set your email address here. Leave empty to hide the email buttons.
  const EMAIL = 'arnab.work.7@protonmail.com';

  const root = document.documentElement;
  const THEME_COLORS = { dark: '#0A0E12', light: '#F1F5F9' };
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  const run = (name, fn) => {
    try { fn(); } catch (err) { console.error('[portfolio] ' + name + ' failed:', err); }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];

    /* ---------- 1. Toast ---------- */
    const toast = $('#toast');
    let toastTimer;
    function say(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    }

    /* ---------- 2. Theme switch ---------- */
    run('theme', () => {
      const themeBtn = $('#themeBtn');
      const meta = $('meta[name="theme-color"]');
      function paintTheme() {
        const light = root.dataset.theme === 'light';
        if (themeBtn) themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
        if (meta) meta.setAttribute('content', THEME_COLORS[light ? 'light' : 'dark']);
      }
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          const next = root.dataset.theme === 'light' ? 'dark' : 'light';
          root.dataset.theme = next;
          try { localStorage.setItem('theme', next); } catch (_) {}
          paintTheme();
        });
      }
      paintTheme();
    });

    /* ---------- 3. Mobile navigation ---------- */
    run('mobile-nav', () => {
      const bar = $('.bar');
      const navBtn = $('#navBtn');
      if (!bar || !navBtn) return;
      function setNav(open) {
        bar.classList.toggle('open', open);
        navBtn.setAttribute('aria-expanded', String(open));
        navBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      }
      navBtn.addEventListener('click', () => setNav(!bar.classList.contains('open')));
      $$('.top-nav a').forEach(a => a.addEventListener('click', () => setNav(false)));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && bar.classList.contains('open')) {
          setNav(false);
          navBtn.focus();
        }
      });
      // Tap outside the header closes the menu.
      document.addEventListener('click', e => {
        if (bar.classList.contains('open') && !bar.contains(e.target)) setNav(false);
      });
      window.matchMedia('(min-width: 981px)').addEventListener('change', e => {
        if (e.matches) setNav(false);
      });
    });

    /* ---------- 4. Footer "back to top" ---------- */
    run('to-top', () => {
      const toTop = $('#toTop');
      if (!toTop) return;
      toTop.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: REDUCED.matches ? 'auto' : 'smooth' });
      });
    });

    /* ---------- 5. Hero terminal tabs (click + arrow-key support) ---------- */
    run('terminal-tabs', () => {
      const tabs = $$('.term-tab');
      function select(btn, moveFocus) {
        tabs.forEach(b => {
          const active = b === btn;
          b.classList.toggle('on', active);
          b.setAttribute('aria-selected', String(active));
          b.tabIndex = active ? 0 : -1;
        });
        $$('.term-pane').forEach(pane => {
          const match = pane.id === 'pane-' + btn.dataset.tab;
          pane.classList.toggle('on', match);
          if (match && !REDUCED.matches) {
            // Restart the boot-in animation for the newly shown pane.
            pane.querySelectorAll('.t-block').forEach(blk => {
              blk.style.animation = 'none';
              void blk.offsetHeight;
              blk.style.animation = '';
            });
          }
        });
        if (moveFocus) btn.focus();
      }
      tabs.forEach((btn, i) => {
        btn.addEventListener('click', () => select(btn, false));
        btn.addEventListener('keydown', e => {
          let n = -1;
          if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') n = 0;
          else if (e.key === 'End') n = tabs.length - 1;
          if (n > -1) { e.preventDefault(); select(tabs[n], true); }
        });
      });
    });

    /* ---------- 6. Email buttons ---------- */
    run('email', () => {
      if (!EMAIL) return;
      const mail = $('#mailBtn');
      if (mail) {
        mail.hidden = false;
        mail.href = 'mailto:' + EMAIL;
      }
      const mailLink = $('#mailLink');
      if (mailLink) {
        mailLink.hidden = false;
        mailLink.href = 'mailto:' + EMAIL;
        mailLink.textContent = EMAIL;
      }
      const c = $('#copyBtn');
      if (!c) return;
      c.hidden = false;
      c.addEventListener('click', () => {
        if (!navigator.clipboard) return say(EMAIL);
        navigator.clipboard.writeText(EMAIL).then(() => say('Email copied'), () => say(EMAIL));
      });
    });

    /* ---------- 7. Project card tilt + sheen (pointer devices only) ---------- */
    run('project-cards', () => {
      if (REDUCED.matches || !matchMedia('(hover: hover)').matches) return;
      $$('.pc').forEach(card => {
        card.addEventListener('pointermove', e => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
          card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
        card.addEventListener('pointerleave', () => {
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
        });
      });
    });

    /* ---------- 8. Scroll spy for the top nav ----------
       Two sources of truth:
       1. Intent: when the visitor clicks a nav link (or any in-page link to a
          section), that section is highlighted immediately and stays
          highlighted until they scroll away themselves. This is what fixes
          "click About -> Contact lights up": About and Contact are short, so
          on a tall window the page bottoms out and both are on screen. Scroll
          position alone cannot tell which one was meant.
       2. Position: while the visitor scrolls on their own, the highlight
          follows whichever section is under the reading line. */
    run('scroll-spy', () => {
      const navLinks = $$('.top-nav a[href^="#"]');
      const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
      if (!sections.length) return;
      const sectionHashes = sections.map(s => '#' + s.id);

      let ticking = false;
      let locked = null;     // '#id' = clicked section, '' = hero/top, null = follow scroll
      let settled = false;   // has the jump/smooth-scroll to the clicked section finished?
      let settledY = 0;      // scroll position where it finished
      let settleTimer;

      function fromScroll() {
        const scrollY = window.scrollY;
        const viewportH = window.innerHeight;
        const docH = document.documentElement.scrollHeight;
        if (scrollY < 220) return '';                                        // hero: nothing highlighted
        if (scrollY + viewportH >= docH - 48) return sectionHashes[sectionHashes.length - 1]; // page bottom
        const trigger = scrollY + viewportH * 0.38;
        let id = '';
        for (const sec of sections) {
          if (sec.getBoundingClientRect().top + scrollY <= trigger) id = '#' + sec.id;
        }
        return id;
      }

      function update() {
        ticking = false;
        const currentId = locked !== null ? locked : fromScroll();
        navLinks.forEach(a => {
          const on = a.getAttribute('href') === currentId;
          a.classList.toggle('on', on);
          if (on) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      }
      function request() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }

      function markSettled() {
        if (locked === null || settled) return;
        settled = true;
        settledY = window.scrollY;
      }
      // No scroll events for a moment = the jump/animation is over.
      function settleSoon(ms) {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(markSettled, ms);
      }
      function lock(id) {
        locked = id;
        settled = false;
        settleSoon(500);   // generous: smooth scrolling can start a beat late
        request();
      }
      function release() {
        if (locked === null) return;
        locked = null;
        clearTimeout(settleTimer);
        request();
      }

      // Clicks on any in-page link that points at a nav section (nav, hero buttons, brand).
      document.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const hash = a.getAttribute('href');
        if (hash === '#top') lock('');
        else if (sectionHashes.includes(hash)) lock(hash);
      });
      // Back/forward buttons and pages opened with #about in the URL.
      function fromHash() {
        if (sectionHashes.includes(location.hash)) lock(location.hash);
      }
      window.addEventListener('hashchange', fromHash);

      window.addEventListener('scroll', () => {
        if (locked !== null) {
          if (!settled) settleSoon(150);                                  // still travelling
          else if (Math.abs(window.scrollY - settledY) > 8) release();    // visitor moved on
        }
        request();
      }, { passive: true });
      window.addEventListener('scrollend', markSettled);
      window.addEventListener('resize', request, { passive: true });

      // The visitor grabbing the wheel / screen / keyboard mid-jump cancels the lock.
      const interrupt = () => { if (locked !== null && !settled) release(); };
      window.addEventListener('wheel', interrupt, { passive: true });
      window.addEventListener('touchmove', interrupt, { passive: true });
      window.addEventListener('keydown', e => {
        if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) return;
        if (e.target.closest && e.target.closest('input, textarea, select, button, [contenteditable]')) return;
        interrupt();
      });

      fromHash();
      update();
    });

    /* ---------- 9. Pause the hero dot animation while off-screen ---------- */
    run('hero-pause', () => {
      const hero = $('.hero');
      if (!hero || !('IntersectionObserver' in window)) return;
      new IntersectionObserver(([entry]) => {
        hero.classList.toggle('paused', !entry.isIntersecting);
      }).observe(hero);
    });

    /* ---------- 10. GitHub release stats (installers only, cached 1 hour) ---------- */
    run('release-stats', () => {
      const KEY = 'dewtask_rel_v2', TTL = 36e5;
      const dl = $('#dl'), tagEl = $('#dewTag');
      const show = (n, tag) => {
        if (typeof n === 'number' && dl) dl.textContent = n.toLocaleString() + ' installer downloads';
        if (tag && tagEl) tagEl.textContent = tag + ' · live release';
      };
      // Only count real installers; updater files (.sig, latest.json, …) would inflate the number.
      const isInstaller = a => /\.(exe|msi)$/i.test((a && a.name) || '');

      (async () => {
        try {
          const c = JSON.parse(localStorage.getItem(KEY) || 'null');
          if (c && Date.now() - c.t < TTL) return show(c.n, c.tag);
        } catch (_) {}
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        try {
          const r = await fetch('https://api.github.com/repos/arnabsaha7/dewtask/releases?per_page=100', { signal: ctrl.signal });
          if (!r.ok) return;
          const rel = await r.json();
          if (!Array.isArray(rel) || !rel.length) return;
          const published = rel.filter(x => !x.draft);
          const n = published.reduce((s, x) =>
            s + (x.assets || []).filter(isInstaller).reduce((a, b) => a + (b.download_count || 0), 0), 0);
          const latest = published.find(x => !x.prerelease) || published[0];
          const tag = latest && latest.tag_name;
          show(n, tag);
          try { localStorage.setItem(KEY, JSON.stringify({ n, tag, t: Date.now() })); } catch (_) {}
        } catch (_) { /* offline, timed out or rate-limited: keep the em dash */
        } finally { clearTimeout(timer); }
      })();
    });
  });
})();