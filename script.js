(function () {
  'use strict';

  // Leave the résumé URL empty to hide the résumé links.
  const RESUME_URL = '';
  const EMAIL = (() => {
    try {
      return atob('YXJuYWIud29yay43QHByb3Rvbm1haWwuY29t');
    } catch (_) {
      return '';
    }
  })();

  const root = document.documentElement;
  const THEME_COLORS = { dark: '#0A0E12', light: '#F1F5F9' };
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  function run(name, feature) {
    try {
      feature();
    } catch (error) {
      console.error('[portfolio] ' + name + ' failed:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];

    const toast = $('#toast');
    let toastTimer;

    function say(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    }

    run('theme', () => {
      const themeBtn = $('#themeBtn');
      const meta = $('meta[name="theme-color"]');

      function paintTheme() {
        const light = root.dataset.theme === 'light';
        if (themeBtn) {
          themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
        }
        if (meta) {
          meta.setAttribute('content', THEME_COLORS[light ? 'light' : 'dark']);
        }
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
      $$('.top-nav a').forEach(link => link.addEventListener('click', () => setNav(false)));

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && bar.classList.contains('open')) {
          setNav(false);
          navBtn.focus();
        }
      });

      document.addEventListener('click', event => {
        if (bar.classList.contains('open') && !bar.contains(event.target)) setNav(false);
      });

      window.matchMedia('(min-width: 981px)').addEventListener('change', event => {
        if (event.matches) setNav(false);
      });
    });

    run('to-top', () => {
      const toTop = $('#toTop');
      if (!toTop) return;
      toTop.addEventListener('click', event => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: REDUCED.matches ? 'auto' : 'smooth' });
      });
    });

    run('engineering-notes', () => {
      const notes = $('#engineeringNotes');
      if (!notes) return;
      const desktop = window.matchMedia('(min-width: 981px)');
      let mobileOpen = false;

      function syncNotes() {
        if (notes.dataset.desktop !== undefined && desktop.matches) return;
        if (desktop.matches) {
          mobileOpen = notes.open;
          notes.dataset.desktop = '';
          notes.open = true;
        } else {
          delete notes.dataset.desktop;
          notes.open = mobileOpen;
        }
      }

      syncNotes();
      desktop.addEventListener('change', syncNotes);
    });

    run('terminal-tabs', () => {
      const tabs = $$('.term-tab');

      function select(button, moveFocus) {
        tabs.forEach(tab => {
          const active = tab === button;
          tab.classList.toggle('on', active);
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
        });

        $$('.term-pane').forEach(pane => {
          const active = pane.id === 'pane-' + button.dataset.tab;
          pane.classList.toggle('on', active);

          if (active && !REDUCED.matches) {
            pane.querySelectorAll('.t-block, .t-res').forEach(element => {
              element.style.animation = 'none';
              void element.offsetHeight;
              element.style.animation = '';
            });
          }
        });

        if (moveFocus) button.focus();
      }

      tabs.forEach((button, index) => {
        button.addEventListener('click', () => select(button, false));
        button.addEventListener('keydown', event => {
          let next = -1;
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;

          if (next >= 0) {
            event.preventDefault();
            select(tabs[next], true);
          }
        });
      });
    });

    run('terminal-clock', () => {
      const clock = $('#termClock');
      if (!clock) return;

      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      function tick() {
        clock.textContent = formatter.format(new Date());
      }

      tick();
      setInterval(tick, 15000);
    });

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

      const copy = $('#copyBtn');
      if (!copy) return;
      copy.hidden = false;
      copy.addEventListener('click', () => {
        if (!navigator.clipboard) return say(EMAIL);
        navigator.clipboard.writeText(EMAIL).then(
          () => say('Email copied'),
          () => say(EMAIL)
        );
      });
    });

    run('resume', () => {
      if (!RESUME_URL) return;
      $$('.resume-link').forEach(link => {
        link.hidden = false;
        link.href = RESUME_URL;
      });
    });

    // Keep the clicked section active until the visitor scrolls away.
    run('scroll-spy', () => {
      const navLinks = $$('.top-nav a[href^="#"]');
      const sections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
      if (!sections.length) return;

      const sectionHashes = sections.map(section => '#' + section.id);
      let ticking = false;
      let locked = null;
      let settled = false;
      let settledY = 0;
      let settleTimer;

      function fromScroll() {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollY < 220) return '#top';
        if (scrollY + viewportHeight >= documentHeight - 48) {
          return sectionHashes[sectionHashes.length - 1];
        }

        const trigger = scrollY + viewportHeight * 0.38;
        let hash = '';
        for (const section of sections) {
          if (section.getBoundingClientRect().top + scrollY <= trigger) {
            hash = '#' + section.id;
          }
        }
        return hash;
      }

      function update() {
        ticking = false;
        const hash = locked !== null ? locked : fromScroll();
        navLinks.forEach(link => {
          const current = link.getAttribute('href') === hash;
          link.classList.toggle('on', current);
          if (current) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }

      function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      }

      function markSettled() {
        if (locked === null || settled) return;
        settled = true;
        settledY = window.scrollY;
      }

      function settleSoon(delay) {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(markSettled, delay);
      }

      function lock(hash) {
        locked = hash;
        settled = false;
        settleSoon(500);
        requestUpdate();
      }

      function release() {
        if (locked === null) return;
        locked = null;
        clearTimeout(settleTimer);
        requestUpdate();
      }

      document.addEventListener('click', event => {
        const link = event.target.closest && event.target.closest('a[href^="#"]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const hash = link.getAttribute('href');
        if (sectionHashes.includes(hash)) lock(hash);
      });

      function fromHash() {
        if (sectionHashes.includes(location.hash)) lock(location.hash);
      }

      window.addEventListener('hashchange', fromHash);
      window.addEventListener('scroll', () => {
        if (locked !== null) {
          if (!settled) settleSoon(150);
          else if (Math.abs(window.scrollY - settledY) > 8) release();
        }
        requestUpdate();
      }, { passive: true });

      window.addEventListener('scrollend', markSettled);
      window.addEventListener('resize', requestUpdate, { passive: true });

      function interrupt() {
        if (locked !== null && !settled) release();
      }

      window.addEventListener('wheel', interrupt, { passive: true });
      window.addEventListener('touchmove', interrupt, { passive: true });
      window.addEventListener('keydown', event => {
        const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
        if (!scrollKeys.includes(event.key)) return;
        if (event.target.closest && event.target.closest('input, textarea, select, button, [contenteditable]')) return;
        interrupt();
      });

      fromHash();
      update();
    });

    run('release-tag', () => {
      const cacheLifetime = 36e5;
      const projects = [
        { label: $('#dewTag'), repository: 'dewtask', cacheKey: 'dewtask_rel_v2' },
        { label: $('#itemcareTag'), repository: 'ItemCare', cacheKey: 'itemcare_tag_v1', tags: true }
      ];

      async function loadVersion(project) {
        if (!project.label) return;
        try {
          const cached = JSON.parse(localStorage.getItem(project.cacheKey) || 'null');
          if (cached && Date.now() - cached.t < cacheLifetime) {
            project.label.textContent = 'Live · ' + cached.tag;
            return;
          }
        } catch (_) {}

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);

        try {
          const response = await fetch(
            `https://api.github.com/repos/arnabsaha7/${project.repository}/${project.tags ? 'tags?per_page=1' : 'releases?per_page=100'}`,
            { signal: controller.signal, priority: 'low' }
          );
          if (!response.ok) return;

          const releases = await response.json();
          if (!Array.isArray(releases) || !releases.length) return;

          const published = releases.filter(release => !release.draft);
          const latest = project.tags
            ? releases[0]
            : published.find(release => !release.prerelease) || published[0];
          const tag = project.tags ? latest.name : latest.tag_name;
          if (!tag) return;
          project.label.textContent = 'Live · ' + tag;

          try {
            localStorage.setItem(project.cacheKey, JSON.stringify({ tag, t: Date.now() }));
          } catch (_) {}
        } catch (_) {
          // The card already displays its default Live label.
        } finally {
          clearTimeout(timer);
        }
      }

      projects.forEach(loadVersion);
    });
  });
})();
