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

    run('theme', () => {
      const themeBtn = $('#themeBtn');
      const meta = $('meta[name="theme-color"]');

      function paintTheme() {
        const light = root.dataset.theme === 'light';
        if (themeBtn) {
          const mode = light ? 'Light' : 'Dark';
          const next = light ? 'dark' : 'light';
          themeBtn.setAttribute('aria-label', `${mode} mode. Switch to ${next} theme`);
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
      bar.querySelectorAll('.brand, .top-nav a').forEach(link => link.addEventListener('click', () => setNav(false)));

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
    });

    run('resume', () => {
      if (!RESUME_URL) return;
      $$('.resume-link').forEach(link => {
        link.hidden = false;
        link.href = RESUME_URL;
      });
    });

    run('about-entrance', () => {
      const about = $('#about');
      if (!about || REDUCED.matches || !('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver(([entry]) => {
        const inView = entry.isIntersecting && entry.intersectionRatio >= 0.18;
        about.classList.toggle('about-in-view', inView);
        if (inView) about.classList.add('about-entered');
      }, { threshold: 0.18 });

      observer.observe(about);
    });

    run('about-badge', () => {
      const badge = $('#about-badge');
      if (!badge) return;

      const hanger = badge.querySelector('.about-hanger');
      const card = badge.querySelector('.about-card');
      const cord = badge.querySelector('.about-cord');
      let pointerType;
      let grab;
      let dragged = false;
      let pullX = 0;
      let pullY = 0;
      let retractFrame;

      function moveBadge(x, y) {
        pullX = x;
        pullY = y;
        hanger.style.setProperty('--about-offset', `${x}px ${y}px`);
        hanger.style.setProperty('--about-pull', `calc(var(--about-rest) + ${-x * 0.12}deg)`);

        // The cord runs from (124, 63) to the hanger pivot 48 SVG units below.
        const svgUnits = 296 / grab.width;
        const horizontal = x * svgUnits;
        const vertical = 48 + y * svgUnits;
        const angle = -Math.atan2(horizontal, vertical) * 180 / Math.PI;
        const stretch = Math.hypot(horizontal, vertical) / 48;
        cord.setAttribute('transform', `translate(124 63) rotate(${angle}) scale(1 ${stretch}) translate(-124 -63)`);
      }

      function retract() {
        if (!badge.classList.contains('about-dragging')) return;
        const releasedX = pullX;
        const releasedY = pullY;
        const releasedAt = performance.now();

        function step(now) {
          const seconds = (now - releasedAt) / 1000;
          if (seconds >= 0.8 || REDUCED.matches) {
            pullX = 0;
            pullY = 0;
            hanger.style.removeProperty('--about-offset');
            hanger.style.removeProperty('--about-pull');
            cord.removeAttribute('transform');
            badge.classList.remove('about-dragging');
            return;
          }
          const remaining = Math.exp(-7 * seconds) * Math.cos(10 * seconds);
          moveBadge(releasedX * remaining, releasedY * remaining);
          retractFrame = requestAnimationFrame(step);
        }

        retractFrame = requestAnimationFrame(step);
      }

      function flip() {
        const flipped = badge.toggleAttribute('data-flipped');
        hanger.setAttribute('aria-pressed', String(flipped));
      }

      hanger.addEventListener('click', event => {
        if (event.detail === 0 || pointerType === 'touch') flip();
      });
      hanger.addEventListener('dblclick', () => {
        if (pointerType !== 'touch' && !dragged) flip();
      });
      hanger.addEventListener('contextmenu', event => {
        if (pointerType === 'touch' && event.pointerType === 'touch') return;
        event.preventDefault();
        flip();
      });
      badge.classList.add('about-badge-interactive');
      hanger.disabled = false;

      card.addEventListener('pointerdown', event => {
        pointerType = event.pointerType;
        if (pointerType !== 'mouse' || event.button !== 0 || REDUCED.matches || !card.setPointerCapture) return;
        cancelAnimationFrame(retractFrame);
        dragged = false;
        grab = { x: event.clientX, y: event.clientY, pullX, pullY, width: badge.clientWidth };
        card.setPointerCapture(event.pointerId);
      });

      card.addEventListener('pointermove', event => {
        if (!card.hasPointerCapture?.(event.pointerId) || REDUCED.matches) return;
        const dx = event.clientX - grab.x;
        const dy = event.clientY - grab.y;
        if (Math.hypot(dx, dy) < 4 && !dragged) return;
        dragged = true;
        badge.classList.add('about-dragging');
        const horizontalLimit = grab.width * 0.32;
        const verticalLimit = grab.width * 0.36;
        const x = Math.max(-horizontalLimit, Math.min(horizontalLimit, grab.pullX + dx));
        const y = Math.max(-grab.width * 0.06, Math.min(verticalLimit, grab.pullY + dy));
        moveBadge(x, y);
      });

      card.addEventListener('lostpointercapture', retract);
    });

    run('project-card-entrance', () => {
      if (REDUCED.matches || !('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('pc--revealed');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px 32px' });

      $$('.pcards > .pc').forEach(card => observer.observe(card));
    });

    run('work-principles', () => {
      const principles = $('.principles');
      if (!principles) return;

      const map = principles.querySelector('.principle-map');
      const items = [...map.querySelectorAll('.principle-item')];
      const paths = map.querySelectorAll('.principle-connectors path');
      let active = map.querySelector('[aria-current="true"]');

      items.forEach(item => {
        const card = item.querySelector('.principle-card');
        function activate() {
          if (card === active) return;
          active.removeAttribute('aria-current');
          card.setAttribute('aria-current', 'true');
          active = card;
        }

        card.addEventListener('pointerenter', event => {
          if (event.pointerType === 'mouse') activate();
        });
        card.addEventListener('focus', activate);
        card.addEventListener('click', activate);
      });

      function drawConnectors() {
        const boxes = items.map(item => ({
          x: item.offsetLeft + item.offsetWidth / 2,
          y: item.offsetTop + item.offsetHeight / 2,
          halfWidth: item.offsetWidth / 2 - 8,
          halfHeight: item.offsetHeight / 2 - 8
        }));

        // End just inside each card so the connector still meets it as it floats.
        function edgePoint(box, dx, dy) {
          const scale = Math.max(Math.abs(dx) / box.halfWidth, Math.abs(dy) / box.halfHeight);
          return [box.x + dx / scale, box.y + dy / scale];
        }

        const path = boxes.slice(1).map((end, index) => {
          const start = boxes[index];
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const [fromX, fromY] = edgePoint(start, dx, dy);
          const [toX, toY] = edgePoint(end, -dx, -dy);
          const bendX = (fromX + toX) / 2;
          return `M ${fromX} ${fromY} C ${bendX} ${fromY} ${bendX} ${toY} ${toX} ${toY}`;
        }).join(' ');

        paths.forEach(line => line.setAttribute('d', path));
      }

      drawConnectors();
      if ('ResizeObserver' in window) {
        const resize = new ResizeObserver(drawConnectors);
        resize.observe(map);
        items.forEach(item => resize.observe(item));
      } else {
        window.addEventListener('resize', drawConnectors);
        document.fonts?.ready.then(drawConnectors);
      }

      if (!('IntersectionObserver' in window)) return;
      principles.classList.add('principles-ready');

      const entrance = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        principles.classList.add('principles-revealed');
        entrance.disconnect();
      }, { threshold: 0.12 });
      entrance.observe(map);
    });

    // Keep the clicked section active until the visitor scrolls away.
    run('scroll-spy', () => {
      const navLinks = $$('.bar :is(.brand, .top-nav a)[href^="#"]');
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

    run('project-metadata', () => {
      const cacheLifetime = 36e5;
      const projects = [
        { label: $('#dewTag'), repository: 'dewtask', cacheKey: 'dewtask_rel_v2' },
        { label: $('#itemcareTag'), repository: 'ItemCare', cacheKey: 'itemcare_tag_v1', tags: true }
      ];

      async function getRepositoryData(path) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);

        try {
          const response = await fetch(`https://api.github.com/repos/arnabsaha7/${path}`, {
            signal: controller.signal, priority: 'low'
          });
          return response.ok ? await response.json() : null;
        } catch (_) {
          return null;
        } finally {
          clearTimeout(timer);
        }
      }

      async function loadVersion(project) {
        try {
          const cached = JSON.parse(localStorage.getItem(project.cacheKey) || 'null');
          if (cached?.tag && Date.now() - cached.t < cacheLifetime) {
            project.label.textContent = 'Live · ' + cached.tag;
            return;
          }
        } catch (_) {}

        const endpoint = project.tags ? 'tags?per_page=1' : 'releases?per_page=100';
        const releases = await getRepositoryData(`${project.repository}/${endpoint}`);
        if (!Array.isArray(releases) || !releases.length) return;

        const published = releases.filter(release => !release.draft);
        const latest = project.tags
          ? releases[0]
          : published.find(release => !release.prerelease) || published[0];
        const tag = project.tags ? latest?.name : latest?.tag_name;
        if (!tag) return;
        project.label.textContent = 'Live · ' + tag;

        try {
          localStorage.setItem(project.cacheKey, JSON.stringify({ tag, t: Date.now() }));
        } catch (_) {}
      }

      async function loadRepository(project) {
        const repository = await getRepositoryData(project.repository);
        if (!repository) return;

        const card = project.label.closest('.pc');
        const description = card.querySelector('.pc-description');
        if (typeof repository.description === 'string' && repository.description.trim()) {
          description.textContent = repository.description;
        }

        const count = repository.stargazers_count;
        if (!Number.isSafeInteger(count) || count < 0) return;
        const stars = card.querySelector('.pc-stars');
        const formatted = count.toLocaleString();
        const name = card.querySelector('h3').textContent;
        stars.querySelector('span').textContent = formatted;
        stars.setAttribute('aria-label', `${name}: ${formatted} ${count === 1 ? 'star' : 'stars'} on GitHub`);
      }

      projects.forEach(project => {
        if (!project.label) return;
        loadVersion(project);
        loadRepository(project);
      });
    });
  });
})();
