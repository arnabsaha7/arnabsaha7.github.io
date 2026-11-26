(function () {
  'use strict';

  // Leave the résumé URL empty to hide the résumé links.
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

    run('hero-network', () => {
      const cv = $('#heroBg');
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const hero = cv.parentElement;
      const term = $('.hero .term');
      const U = 32; // grid cell in px; must match the background-size on .hero::after
      const mouse = { x: -1e4, y: -1e4 };
      const t0 = performance.now();
      let w, h, chip, traces = [], rgb = '85,214,232', last = t0, raf = 0, visible = true;

      const rnd = (a, b) => a + Math.random() * (b - a);
      const cells = (a, b) => Math.round(rnd(a, b));

      // Orthogonal route that leaves the pin along (ox,oy), jogging sideways between forward legs.
      function route(px, py, ox, oy, xmin) {
        const pts = [[px, py]];
        let x = ox ? (ox > 0 ? Math.ceil(px / U) : Math.floor(px / U)) * U : px;
        let y = oy ? (oy > 0 ? Math.ceil(py / U) : Math.floor(py / U)) * U : py;
        if (x === px && y === py) { x += ox * U; y += oy * U; }
        pts.push([x, y]);
        const legs = cells(3, 6);
        for (let i = 0; i < legs; i++) {
          const side = Math.random() < 0.5 ? -1 : 1;
          const j = i % 2 ? [oy ? side : 0, ox ? side : 0] : [ox, oy];
          const n = (i % 2 ? cells(1, 3) : cells(2, 5)) * U;
          const nx = x + j[0] * n, ny = y + j[1] * n;
          if (nx < xmin || nx > w || ny < 0 || ny > h) break;
          x = nx; y = ny; pts.push([x, y]);
        }
        return pts;
      }

      function build() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        w = hero.clientWidth; h = hero.clientHeight;
        cv.width = w * dpr; cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const hr = hero.getBoundingClientRect(), tr = term && term.getBoundingClientRect();
        chip = tr && tr.width > 0 ? { x: tr.left - hr.left, y: tr.top - hr.top, w: tr.width, h: tr.height } : null;
        const pins = [];
        if (chip) {
          const { x, y, w: cw, h: ch } = chip;
          for (let g = Math.ceil((y + U) / U) * U; g < y + ch - U; g += U * 2) {
            pins.push([x, g, -1, 0], [x + cw, g, 1, 0]);
          }
          for (let g = Math.ceil((x + U) / U) * U; g < x + cw - U; g += U * 2) {
            pins.push([g, y, 0, -1], [g, y + ch, 0, 1]);
          }
        } else {
          for (let g = U; g < h; g += U * 3) pins.push([w, g, -1, 0]);
        }
        const xmin = w * (chip ? 0.4 : 0.75); // keep traces off the headline column
        traces = pins.filter(() => Math.random() < 0.55).slice(0, 26).map(([px, py, ox, oy]) => {
          const pts = route(px, py, ox, oy, xmin);
          const cum = [0];
          for (let i = 1; i < pts.length; i++) {
            cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
          }
          const total = cum[cum.length - 1];
          return { pts, cum, total, pulse: 0, s: total, wait: rnd(0.5, 4), speed: rnd(90, 170) };
        }).filter(t => t.pts.length > 2);
      }

      function at(t, s) {
        let i = 1;
        while (i < t.cum.length - 1 && t.cum[i] < s) i++;
        const k = (s - t.cum[i - 1]) / (t.cum[i] - t.cum[i - 1] || 1);
        const a = t.pts[i - 1], b = t.pts[i];
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      }

      function frame(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const still = REDUCED.matches;
        const p = still ? 1 : Math.min(1, Math.max(0, (now - t0 - 500) / 1400));
        const ease = 1 - Math.pow(1 - p, 3);
        rgb = root.dataset.theme === 'light' ? '15,110,130' : '85,214,232';
        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = 'round';
        ctx.lineWidth = 1;

        if (chip) { // keep-out outline, like the courtyard line around a chip on a PCB
          const o = 14;
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = `rgba(${rgb},${0.22 * ease})`;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(chip.x - o, chip.y - o, chip.w + o * 2, chip.h + o * 2, 12);
          else ctx.rect(chip.x - o, chip.y - o, chip.w + o * 2, chip.h + o * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        for (const t of traces) {
          const reach = t.total * ease;
          for (let i = 1; i < t.pts.length && t.cum[i - 1] < reach; i++) {
            const a = t.pts[i - 1], b = t.pts[i];
            const f = Math.min(1, (reach - t.cum[i - 1]) / (t.cum[i] - t.cum[i - 1]));
            const ex = a[0] + (b[0] - a[0]) * f, ey = a[1] + (b[1] - a[1]) * f;
            const m = Math.hypot((a[0] + ex) / 2 - mouse.x, (a[1] + ey) / 2 - mouse.y);
            ctx.strokeStyle = `rgba(${rgb},${0.2 + (m < 180 ? (1 - m / 180) * 0.5 : 0)})`;
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
          }
          const [px, py] = t.pts[0], [vx, vy] = t.pts[t.pts.length - 1];
          if (p >= 1) { // via at the far end
            ctx.strokeStyle = `rgba(${rgb},0.45)`;
            ctx.beginPath(); ctx.arc(vx, vy, 3, 0, 6.283); ctx.stroke();
          }
          t.pulse = Math.max(0, t.pulse - dt * 1.6);
          ctx.fillStyle = `rgba(${rgb},${(0.35 + 0.65 * t.pulse) * ease})`;
          ctx.fillRect(px - 3, py - 3, 6, 6);

          if (still || p < 1) continue;
          if (t.wait > 0) { t.wait -= dt; continue; }
          t.s -= t.speed * dt; // data flows in from the far end toward the chip
          if (t.s <= 0) { t.pulse = 1; t.s = t.total; t.wait = rnd(1, 5); continue; }
          let prev = at(t, t.s);
          for (let k = 1; k <= 8; k++) {
            const q = at(t, Math.min(t.total, t.s + k * 5));
            ctx.strokeStyle = `rgba(${rgb},${0.9 * (1 - k / 9)})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
            prev = q;
          }
          ctx.lineWidth = 1;
          const hd = at(t, t.s);
          ctx.fillStyle = `rgba(${rgb},1)`;
          ctx.beginPath(); ctx.arc(hd[0], hd[1], 2.2, 0, 6.283); ctx.fill();
        }
        raf = visible && !still ? requestAnimationFrame(frame) : 0;
      }

      const redraw = () => { build(); if (!raf) frame(performance.now()); };
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) { last = performance.now(); frame(last); }
      }).observe(hero);
      // shortcut: any size change re-rolls the traces; fine while the terminal height is stable
      const ro = new ResizeObserver(redraw);
      ro.observe(hero);
      if (term) ro.observe(term);
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
      let grab; // set while the mouse button is held on the card
      let dragged = false;
      let frame = 0;
      let last = 0;
      let width = 1;
      // Spring state: position (px) and tilt (deg), with velocities and the pointer-driven target.
      const s = { x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, tx: 0, ty: 0 };
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      // Rubber band: 1:1 near rest, easing to the limit instead of stopping dead at a wall.
      const soft = (v, neg, pos) => v >= 0 ? pos * Math.tanh(v / pos) : -neg * Math.tanh(-v / neg);
      const unsoft = (v, neg, pos) => v >= 0 ? pos * Math.atanh(Math.min(v / pos, 0.98)) : -neg * Math.atanh(Math.min(-v / neg, 0.98));

      function apply() {
        hanger.style.setProperty('--about-offset', `${s.x}px ${s.y}px`);
        hanger.style.setProperty('--about-pull', `calc(var(--about-rest) + ${s.a}deg)`);
        // The cord runs from (124, 63) to the hanger pivot 48 SVG units below.
        const k = 296 / width;
        const horizontal = s.x * k;
        const vertical = 48 + s.y * k;
        const angle = -Math.atan2(horizontal, vertical) * 180 / Math.PI;
        const stretch = Math.hypot(horizontal, vertical) / 48;
        cord.setAttribute('transform', `translate(124 63) rotate(${angle}) scale(1 ${stretch}) translate(-124 -63)`);
      }

      function step(h) {
        // Held: stiff, well-damped follow. Released: softer and underdamped, so it swings back and settles.
        const held = !!grab;
        const k = held ? 260 : 85;
        s.vx += (k * (s.tx - s.x) - (held ? 26 : 9) * s.vx) * h;
        s.vy += (k * (s.ty - s.y) - (held ? 26 : 12) * s.vy) * h;
        s.x += s.vx * h;
        s.y += s.vy * h;
        // Tilt follows the cord direction, plus a little lag from inertia.
        const target = -s.x * 0.12 + clamp(s.vx * 0.004, -5, 5);
        s.va += (220 * (target - s.a) - 16 * s.va) * h;
        s.a += s.va * h;
      }

      function settled() {
        return Math.abs(s.x) + Math.abs(s.y) < 0.1 && Math.abs(s.vx) + Math.abs(s.vy) < 1 &&
          Math.abs(s.a) < 0.02 && Math.abs(s.va) < 0.2;
      }

      function finish() {
        frame = 0;
        Object.assign(s, { x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, tx: 0, ty: 0 });
        hanger.style.removeProperty('--about-offset');
        hanger.style.removeProperty('--about-pull');
        cord.removeAttribute('transform');
        badge.classList.remove('about-dragging');
      }

      function tick(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const n = Math.max(1, Math.ceil(dt / 0.008));
        for (let i = 0; i < n; i++) step(dt / n);
        apply();
        if (!grab && settled()) return finish();
        frame = requestAnimationFrame(tick);
      }

      function animate() {
        if (frame) return;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }

      function release(event) {
        if (grab?.pointerId !== event.pointerId) return;
        grab = null;
        s.tx = 0;
        s.ty = 0;
        if (badge.classList.contains('about-dragging')) animate();
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
      // The portrait <img> would otherwise start a native image drag and cancel ours mid-pull.
      card.addEventListener('dragstart', event => event.preventDefault());
      badge.classList.add('about-badge-interactive');
      hanger.disabled = false;

      card.addEventListener('pointerdown', event => {
        pointerType = event.pointerType;
        if (pointerType !== 'mouse' || event.button !== 0 || REDUCED.matches || !card.setPointerCapture) return;
        dragged = false;
        width = badge.clientWidth;
        // Start from where the card is now (it may still be swinging), so grabbing never jumps.
        grab = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          bx: unsoft(s.x, width * 0.4, width * 0.4),
          by: unsoft(s.y, width * 0.1, width * 0.5)
        };
        card.setPointerCapture(event.pointerId);
      });

      card.addEventListener('pointermove', event => {
        if (!grab || grab.pointerId !== event.pointerId || REDUCED.matches) return;
        const dx = event.clientX - grab.x;
        const dy = event.clientY - grab.y;
        if (Math.hypot(dx, dy) < 4 && !dragged) return;
        dragged = true;
        badge.classList.add('about-dragging');
        s.tx = soft(grab.bx + dx, width * 0.4, width * 0.4);
        s.ty = soft(grab.by + dy, width * 0.1, width * 0.5);
        animate();
      });

      card.addEventListener('pointerup', release);
      card.addEventListener('pointercancel', release);
      card.addEventListener('lostpointercapture', release);
    });

    run('experience-entrance', () => {
      const timeline = $('#experience .experience-timeline');
      if (!timeline || !('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('experience-revealed');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px 32px' });

      [...timeline.children].forEach(item => observer.observe(item));
      timeline.setAttribute('data-experience-reveal', '');
    });

    run('stack-card-entrance', () => {
      if (REDUCED.matches || !('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('card-revealed');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px 32px' });

      $$('.stack > .stack-card').forEach(card => observer.observe(card));
    });

    run('project-card-drag', () => {
      if (!('PointerEvent' in window)) return;

      const cards = $$('#work .pc');
      if (!cards.length) return;

      cards.forEach(card => {
        const visitButton = card.querySelector('.pc-actions > .btn');
        let drag;
        let frame = 0;
        let x = 0;
        let y = 0;
        let suppressClick = false;

        function move(nextX, nextY) {
          x = nextX;
          y = nextY;
          card.style.setProperty('--pc-drag-x', x + 'px');
          card.style.setProperty('--pc-drag-y', y + 'px');
        }

        function reset() {
          frame = 0;
          x = y = 0;
          card.style.removeProperty('--pc-drag-x');
          card.style.removeProperty('--pc-drag-y');
          card.removeAttribute('data-project-dragging');
        }

        function release(event) {
          if (!drag || event.pointerId !== drag.id) return;
          const { minX, maxX, movedAt, velocityX, velocityY } = drag;
          suppressClick = event.type === 'pointerup' && drag.moved;
          drag = null;
          if (REDUCED.matches || (!x && !y)) {
            reset();
            return;
          }

          const startX = x;
          const startY = y;
          const releasedAt = performance.now();
          const moving = event.type === 'pointerup' && releasedAt - movedAt < 80;
          const damping = 8;
          const frequency = 18;
          const amplitudeX = ((moving ? velocityX : 0) + damping * startX) / frequency;
          const amplitudeY = ((moving ? velocityY : 0) + damping * startY) / frequency;

          function spring(now) {
            const seconds = (now - releasedAt) / 1000;
            if (seconds >= 1 || REDUCED.matches) {
              reset();
              return;
            }
            const decay = Math.exp(-damping * seconds);
            const cosine = Math.cos(frequency * seconds);
            const sine = Math.sin(frequency * seconds);
            const nextX = decay * (startX * cosine + amplitudeX * sine);
            const nextY = decay * (startY * cosine + amplitudeY * sine);
            move(Math.max(minX, Math.min(maxX, nextX)), nextY);
            frame = requestAnimationFrame(spring);
          }

          frame = requestAnimationFrame(spring);
        }

        card.setAttribute('data-project-drag-handle', '');
        card.addEventListener('pointerdown', event => {
          if (drag || !event.isPrimary || event.button !== 0) return;
          suppressClick = false;
          if (visitButton?.contains(event.target)) return;
          cancelAnimationFrame(frame);
          card.setAttribute('data-project-dragging', '');
          const bounds = card.getBoundingClientRect();
          drag = {
            id: event.pointerId,
            offsetX: event.clientX - x,
            offsetY: event.clientY - y,
            minX: Math.min(0, x - bounds.left),
            maxX: Math.max(0, x + document.documentElement.clientWidth - bounds.right),
            moved: false,
            movedAt: performance.now(),
            velocityX: 0,
            velocityY: 0
          };
          // Keep taps on the original target so the Stars link still works.
          event.target.setPointerCapture(event.pointerId);
        });

        card.addEventListener('pointermove', event => {
          if (!drag || event.pointerId !== drag.id) return;
          const nextX = Math.max(drag.minX, Math.min(drag.maxX, event.clientX - drag.offsetX));
          const nextY = event.clientY - drag.offsetY;
          if (!drag.moved && Math.hypot(nextX - x, nextY - y) < 4) return;
          drag.moved = true;
          const now = performance.now();
          const seconds = Math.max(0.008, (now - drag.movedAt) / 1000);
          drag.velocityX = Math.max(-1800, Math.min(1800, (nextX - x) / seconds));
          drag.velocityY = Math.max(-1800, Math.min(1800, (nextY - y) / seconds));
          drag.movedAt = now;
          move(nextX, nextY);
        });

        card.addEventListener('pointerup', release);
        card.addEventListener('pointercancel', release);
        card.addEventListener('lostpointercapture', release);
        card.addEventListener('dragstart', event => {
          if (!visitButton?.contains(event.target)) event.preventDefault();
        });
        card.addEventListener('click', event => {
          if (!suppressClick || !event.detail) return;
          suppressClick = false;
          event.preventDefault();
        }, true);
      });

      const hint = $('#work-drag-hint');
      if (hint) hint.hidden = false;
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

    run('scroll-spy', () => {
      const navLinks = $$('.bar :is(.brand, .top-nav a)[href^="#"]');
      const sections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
      if (!sections.length) return;

      const sectionHashes = sections.map(section => '#' + section.id);
      let sectionOffsets = [];
      let ticking = false;
      let locked = null;
      let settled = false;
      let settledY = 0;
      let settleTimer;

      function cacheOffsets() {
        sectionOffsets = sections.map(section => ({
          id: '#' + section.id,
          top: section.getBoundingClientRect().top + window.scrollY
        }));
      }

      cacheOffsets();

      if ('ResizeObserver' in window) {
        new ResizeObserver(cacheOffsets).observe(document.body);
      }

      function fromScroll() {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollY < 220) return '#top';
        if (scrollY + viewportHeight >= documentHeight - 48) {
          return sectionOffsets[sectionOffsets.length - 1]?.id || sectionHashes[sectionHashes.length - 1];
        }

        const trigger = scrollY + viewportHeight * 0.38;
        let hash = '';
        for (const { id, top } of sectionOffsets) {
          if (top <= trigger) {
            hash = id;
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
      window.addEventListener('resize', () => {
        if (!('ResizeObserver' in window)) cacheOffsets();
        requestUpdate();
      }, { passive: true });

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
        
        if (!Array.isArray(releases) || !releases.length) {
          const fallback = project.label.getAttribute('data-fallback-tag');
          if (fallback) project.label.textContent = 'Live · ' + fallback;
          return;
        }

        const published = releases.filter(release => !release.draft);
        const latest = project.tags
          ? releases[0]
          : published.find(release => !release.prerelease) || published[0];
        
        const tag = project.tags ? latest?.name : latest?.tag_name;
        if (!tag) {
          const fallback = project.label.getAttribute('data-fallback-tag');
          if (fallback) project.label.textContent = 'Live · ' + fallback;
          return;
        }
        
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
          const text = repository.description.trim().replace(/\s+/gu, ' ');
          const characters = [...text];
          const maxDescriptionLength = 120;
          if (characters.length > maxDescriptionLength) {
            const prefix = characters.slice(0, maxDescriptionLength - 1).join('');
            const preview = characters[maxDescriptionLength - 1] === ' '
              ? prefix
              : prefix.replace(/ \S*$/u, '');
            description.textContent = preview + '…';
          } else {
            description.textContent = text;
          }
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