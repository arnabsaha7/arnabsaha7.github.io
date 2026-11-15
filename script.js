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
  const THEME_COLORS = { dark: '#090A0C', light: '#F5F4F0' };
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
          if (match) {
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

    /* ---------- 7. DewTask interactive preview ---------- */
    run('dewtask-preview', () => {
      const MAX_CUSTOM = 2;
      const tasks = [
        { id: 1, t: 'Draft release notes',  s: 'done',     w: 'DewTask', d: 'today',    day: 2, custom: false },
        { id: 2, t: 'Review import flow',   s: 'progress', w: 'DewTask', d: 'today',    day: 4, custom: false },
        { id: 3, t: 'Write API tests',      s: 'todo',     w: 'Backend', d: 'today',    day: 6, custom: false },
        { id: 4, t: 'Plan sync prototype',  s: 'todo',     w: 'R&D',     d: 'upcoming', day: 6, custom: false },
        { id: 5, t: 'Profile startup time', s: 'done',     w: 'DewTask', d: 'upcoming', day: 0, custom: false },
        { id: 6, t: 'Update documentation', s: 'todo',     w: 'Backend', d: 'upcoming', day: 6, custom: false }
      ];
      let nextId = 100;
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const nxt = { todo: 'progress', progress: 'done', done: 'todo' };
      const lab = { todo: 'To do', progress: 'In progress', done: 'Completed' };
      const esc = s => String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));

      const body = $('#dwBody'), nav = $('#dwNav'), qi = $('#dwq');
      const addBtn = $('#dwAddBtn'), quotaEl = $('#dwQuota');
      const pop = $('#dwPop'), form = $('#dwForm'), titleIn = $('#dwNewTitle');
      const tagIn = $('#dwNewTag'), cancelBtn = $('#dwCancel'), popLim = $('#dwPopLim');

      let view = 'overview', qs = '';
      const cnt = s => tasks.filter(t => t.s === s).length;
      const customCount = () => tasks.filter(t => t.custom).length;

      function updateQuotaUI() {
        const used = customCount();
        const left = Math.max(0, MAX_CUSTOM - used);
        quotaEl.textContent = used + '/' + MAX_CUSTOM;
        addBtn.classList.toggle('full', left === 0);
        popLim.textContent = left + ' of ' + MAX_CUSTOM + ' custom slot' + (left === 1 ? '' : 's') + ' left';
      }

      function openPop() {
        if (customCount() >= MAX_CUSTOM) {
          say('Sandbox limit: max 2 custom tasks. Delete a task to add another.');
          return;
        }
        updateQuotaUI();
        pop.hidden = false;
        addBtn.setAttribute('aria-expanded', 'true');
        titleIn.value = qi.value.trim().slice(0, 48);
        titleIn.focus();
      }

      function closePop(returnFocus) {
        pop.hidden = true;
        addBtn.setAttribute('aria-expanded', 'false');
        form.reset();
        if (returnFocus) addBtn.focus();
      }

      // `focusAfter` is a function returning the element to focus once the
      // list has been rebuilt, so keyboard users never lose their place.
      function render(focusAfter) {
        updateQuotaUI();
        nav.querySelectorAll('[data-v]').forEach(b => {
          const on = b.dataset.v === view;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        });

        const n = tasks.length || 1;
        const d = cnt('done'), p = cnt('progress'), td = cnt('todo');
        let h = '';

        if (view === 'overview') {
          const per = days.map((_, i) => tasks.filter(t => t.s === 'done' && t.day === i).length);
          const mx = Math.max(1, ...per);
          h = '<div class="dwc"><div class="dwh"><div><h4>Overall progress</h4><small>Completion · This week</small></div>' +
              '<b class="dw-pct">' + (tasks.length ? Math.round(d / n * 100) : 0) + '%</b></div>' +
              '<div class="dwg"><i class="s-done" style="width:' + (d / n * 100) + '%"></i>' +
              '<i class="s-progress" style="width:' + (p / n * 100) + '%"></i>' +
              '<i class="s-todo" style="width:' + (td / n * 100) + '%"></i></div>' +
              '<small>Completed (' + d + ') · In progress (' + p + ') · To do (' + td + ')</small></div>' +
              '<div class="dws">' +
                '<div class="dwc"><small>Total</small><b>' + tasks.length + '</b></div>' +
                '<div class="dwc"><small>Completed</small><b>' + d + '</b></div>' +
                '<div class="dwc"><small>In progress</small><b>' + p + '</b></div>' +
                '<div class="dwc"><small>To do</small><b>' + td + '</b></div>' +
              '</div>' +
              '<div class="dwc"><div class="dwh"><h4>Completed tasks</h4><small>' + d + ' completed</small></div>' +
              '<div class="dwch" aria-hidden="true">' + per.map(v => '<div><i style="height:' + (v / mx * 100) + '%"></i></div>').join('') + '</div>' +
              '<div class="dwd" aria-hidden="true">' + days.map(x => '<span>' + x + '</span>').join('') + '</div></div>' +
              '<small class="dw-hint">Tip: click + to name a new task (up to 2 custom) or switch to All Tasks.</small>';
        } else {
          const list = tasks.filter(t => (view === 'all' || t.d === view) && t.t.toLowerCase().includes(qs));
          h = list.length
            ? '<div class="dw-list">' + list.map(t =>
                '<div class="dwr">' +
                  '<button type="button" class="chip ' + t.s + '" data-toggle="' + t.id + '" aria-label="' + esc(t.t) + ': ' + lab[t.s] + '. Click to cycle status">' + lab[t.s] + '</button>' +
                  '<span class="' + (t.s === 'done' ? 'x' : '') + '">' + esc(t.t) + '</span>' +
                  '<small>' + esc(t.w) + '</small>' +
                  '<button type="button" class="dw-del" data-del="' + t.id + '" aria-label="Delete task ' + esc(t.t) + '" title="Delete task">×</button>' +
                '</div>').join('') +
              '</div><small class="dw-hint">Click status pill to cycle state, or × to remove a task.</small>'
            : '<div class="dwc"><small>No tasks match your filter.</small></div>';
        }
        body.innerHTML = h;

        if (typeof focusAfter === 'function') {
          const el = focusAfter();
          if (el) el.focus();
        }
      }

      nav.addEventListener('click', e => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        view = b.dataset.v;
        closePop(false);
        render();
      });

      body.addEventListener('click', e => {
        const tog = e.target.closest('[data-toggle]');
        if (tog) {
          const id = tog.dataset.toggle;
          const task = tasks.find(x => x.id === +id);
          if (task) {
            task.s = nxt[task.s];
            render(() => body.querySelector('[data-toggle="' + id + '"]'));
          }
          return;
        }
        const del = e.target.closest('[data-del]');
        if (del) {
          const position = [...body.querySelectorAll('[data-del]')].indexOf(del);
          const idx = tasks.findIndex(x => x.id === +del.dataset.del);
          if (idx > -1) {
            tasks.splice(idx, 1);
            say('Task deleted');
            render(() => {
              const rest = body.querySelectorAll('[data-del]');
              return rest.length ? rest[Math.min(position, rest.length - 1)] : qi;
            });
          }
        }
      });

      qi.addEventListener('input', () => {
        qs = qi.value.toLowerCase().trim();
        if (qs && view === 'overview') view = 'all';
        render();
      });

      addBtn.addEventListener('click', () => { pop.hidden ? openPop() : closePop(true); });
      cancelBtn.addEventListener('click', () => closePop(true));

      form.addEventListener('submit', e => {
        e.preventDefault();
        if (customCount() >= MAX_CUSTOM) {
          say('Maximum 2 custom tasks allowed.');
          closePop(true);
          return;
        }
        const val = titleIn.value.trim();
        if (!val) { titleIn.focus(); return; }
        tasks.unshift({
          id: ++nextId,
          t: val.slice(0, 48),
          s: 'todo',
          w: tagIn.value || 'DewTask',
          d: 'today',
          day: (new Date().getDay() + 6) % 7,
          custom: true
        });
        qi.value = '';
        qs = '';
        view = 'all';
        closePop(true);
        render();
        say('Task added');
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !pop.hidden) closePop(true);
      });

      render();
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
