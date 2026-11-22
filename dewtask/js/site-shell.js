(() => {
  'use strict';

  const scriptUrl = document.currentScript?.src || new URL('js/site-shell.js', window.location.href).href;
  const siteRoot = new URL('../', scriptUrl);

  const resolveSiteUrl = path => new URL(path, siteRoot).href;

  const normalizePartialUrls = mount => {
    mount.querySelectorAll('[href], [src]').forEach(element => {
      ['href', 'src'].forEach(attribute => {
        const value = element.getAttribute(attribute);
        if (value && !/^(?:[a-z][a-z\d+.-]*:|\/|#|data:|javascript:)/i.test(value)) {
          element.setAttribute(attribute, resolveSiteUrl(value));
        }
      });
    });
  };

  const renderShellFallback = (mount, type) => {
    if (type === 'header') {
      mount.innerHTML = `
        <header class="site-header site-shell-fallback">
          <div class="site-container">
            <a class="fallback-brand" href="${resolveSiteUrl('index.html')}">DewTask</a>
            <nav aria-label="Main navigation">
              <a href="${resolveSiteUrl('index.html')}#features">Architecture</a>
              <a href="${resolveSiteUrl('index.html')}#views">Views</a>
              <a href="${resolveSiteUrl('index.html')}#why-dewtask">Philosophy</a>
              <a href="${resolveSiteUrl('privacy.html')}">Privacy</a>
              <a href="${resolveSiteUrl('terms.html')}">Terms</a>
            </nav>
          </div>
        </header>`;
    } else {
      mount.innerHTML = `
        <footer class="site-shell-fallback site-shell-fallback-footer">
          <div class="site-container">
            <span>DewTask - Local-First Windows Task Manager</span>
            <a href="${resolveSiteUrl('index.html')}">Overview</a>
            <a href="${resolveSiteUrl('privacy.html')}">Privacy</a>
            <a href="${resolveSiteUrl('terms.html')}">Terms</a>
          </div>
        </footer>`;
    }
  };

  const loadPartial = async (selector, path, fallbackType) => {
    const mount = document.querySelector(selector);
    if (!mount) return;

    try {
      const response = await fetch(resolveSiteUrl(path), { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Unable to load ${path}: HTTP ${response.status}`);
      mount.innerHTML = await response.text();
      normalizePartialUrls(mount);
    } catch (error) {
      console.error(`[DewTask] ${error.message}`);
      renderShellFallback(mount, fallbackType);
    }
  };

  const initializeHeroPause = () => {
    const hero = document.querySelector('.hero-stage');
    if (!hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([entry]) => {
      hero.classList.toggle('paused', !entry.isIntersecting);
    }).observe(hero);
  };

  const initializeHeroMark = () => {
    const mark = document.querySelector('.hero-mark');
    if (!mark || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ripple = mark.querySelector('.hero-mark__ripple');
    let started = false;
    let entranceDone = false;
    let interactionRunning = false;
    let inViewport = false;

    const updatePaused = () => mark.classList.toggle('is-paused', !inViewport || document.hidden);
    const startEntrance = () => {
      if (started) return;
      started = true;
      mark.classList.add('is-entering');
    };
    const interact = () => {
      if (!entranceDone || interactionRunning || !inViewport || document.hidden) return;
      interactionRunning = true;
      mark.classList.add('is-interacting');
    };

    mark.addEventListener('animationend', event => {
      if (event.target !== ripple || event.animationName !== 'hero-mark-ripple') return;
      if (mark.classList.contains('is-entering')) {
        mark.classList.remove('is-entering');
        mark.classList.add('is-entrance-done');
        entranceDone = true;
      } else if (mark.classList.contains('is-interacting')) {
        mark.classList.remove('is-interacting');
        interactionRunning = false;
      }
    });

    mark.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') interact();
    });
    mark.addEventListener('click', interact);
    document.addEventListener('visibilitychange', updatePaused);

    if ('IntersectionObserver' in window) {
      mark.classList.add('is-paused');
      new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting;
        if (inViewport) startEntrance();
        updatePaused();
      }, { threshold: 0.1 }).observe(mark);
    } else {
      inViewport = true;
      startEntrance();
      updatePaused();
    }
  };

  const initializeMobileMenu = () => {
    const button = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const bars = document.getElementById('menu-icon-bars');
    const close = document.getElementById('menu-icon-close');
    if (!button || !menu) return;

    const setOpen = open => {
      menu.classList.toggle('hidden', !open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      bars?.classList.toggle('hidden', open);
      close?.classList.toggle('hidden', !open);
    };

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
      if (open) menu.querySelector('a')?.focus({ preventScroll: true });
    });

    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));

    document.addEventListener('click', event => {
      if (button.getAttribute('aria-expanded') !== 'true') return;
      if (!menu.contains(event.target) && !button.contains(event.target)) setOpen(false);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        button.focus();
      }
    });
  };

  const initializeActiveNavigation = () => {
    const page = document.body.dataset.page;
    const links = Array.from(document.querySelectorAll('[data-nav]'));

    const setActive = key => {
      links.forEach(link => {
        const active = link.dataset.nav === key;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', page === 'home' ? 'location' : 'page');
        else link.removeAttribute('aria-current');
      });
    };

    if (page === 'privacy' || page === 'terms') {
      setActive(page);
      return;
    }

    if (page !== 'home') return;

    const sections = ['features', 'views', 'why-dewtask']
      .map(id => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return;

    setActive(sections[0].id);

    let scheduled = false;
    const update = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        const header = document.querySelector('.site-header');
        const headerHeight = header?.getBoundingClientRect().height || 0;
        const marker = window.scrollY + headerHeight + Math.max(72, window.innerHeight * 0.24);
        let current = sections[0].id;

        for (const section of sections) {
          const top = section.getBoundingClientRect().top + window.scrollY;
          if (top <= marker) current = section.id;
          else break;
        }

        const atPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atPageBottom) current = sections[sections.length - 1].id;
        setActive(current);
      });
    };

    links.filter(link => sections.some(section => section.id === link.dataset.nav))
      .forEach(link => link.addEventListener('click', () => setActive(link.dataset.nav)));

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('hashchange', update);
    update();
  };

  const initializeLegalToc = () => {
    const links = Array.from(document.querySelectorAll('[data-toc-link]'));
    if (!links.length) return;

    const sections = links
      .map(link => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    if (!sections.length) return;

    const setActive = activeId => {
      links.forEach(link => {
        const active = link.getAttribute('href') === `#${activeId}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    let scheduled = false;
    const update = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        const header = document.querySelector('.site-header');
        const marker = (header?.getBoundingClientRect().height || 0) + 120;
        let active = sections[0].id;

        for (const section of sections) {
          if (section.getBoundingClientRect().top <= marker) active = section.id;
          else break;
        }

        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
          active = sections[sections.length - 1].id;
        }
        setActive(active);
      });
    };

    links.forEach(link => link.addEventListener('click', () => {
      const target = link.getAttribute('href').slice(1);
      setActive(target);
    }));

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('hashchange', update);
    update();
  };

  const initializeViewSwitcher = () => {
    const tabs = Array.from(document.querySelectorAll('[data-view-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-view-panel]'));
    if (!tabs.length || !panels.length) return;

    const activate = (key, moveFocus = false) => {
      tabs.forEach(tab => {
        const selected = tab.dataset.viewTab === key;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && moveFocus) tab.focus();
      });

      panels.forEach(panel => {
        const selected = panel.dataset.viewPanel === key;
        panel.classList.toggle('hidden', !selected);
        panel.setAttribute('aria-hidden', String(!selected));
      });
    };

    tabs.forEach((tab, index) => {
      const key = tab.dataset.viewTab;
      const panel = panels.find(item => item.dataset.viewPanel === key);
      tab.id ||= `view-tab-${key}`;
      tab.setAttribute('aria-controls', panel ? (panel.id ||= `view-panel-${key}`) : '');
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
      }

      tab.addEventListener('click', () => activate(tab.dataset.viewTab));
      tab.addEventListener('keydown', event => {
        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        activate(tabs[nextIndex].dataset.viewTab, true);
      });
    });

    const initiallySelected = tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0];
    activate(initiallySelected.dataset.viewTab);
  };

  const initializeArchitectureViews = () => {
    const tablist = document.querySelector('[data-architecture-tabs]');
    if (!tablist) return;
    const tabs = Array.from(tablist.querySelectorAll('[data-architecture-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-architecture-panel]'));
    if (!tabs.length || !panels.length) return;

    const activate = (tab, moveFocus = false) => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(panel => {
        panel.hidden = panel.dataset.architecturePanel !== tab.dataset.architectureTab;
      });
      if (moveFocus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', event => {
        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        activate(tabs[nextIndex], true);
      });
    });

    activate(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
  };

  const initializeCalendarView = () => {
    document.querySelectorAll('[data-calendar-mode]').forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.calendarMode;
        const section = button.closest('[data-view-panel="calendar"]');
        section?.querySelectorAll('[data-calendar-mode]').forEach(tab => {
          tab.setAttribute('aria-pressed', String(tab === button));
        });
        section?.querySelectorAll('[data-calendar-panel]').forEach(panel => {
          panel.hidden = panel.dataset.calendarPanel !== mode;
        });
      });
    });
  };

  const initializeCopyPath = () => {
    document.querySelectorAll('[data-copy-path]').forEach(button => {
      const label = button.querySelector('[data-copy-label]');
      const path = button.closest('.path-chip')?.querySelector('code');
      let resetTimer;
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copyPath);
          if (label) label.textContent = 'Copied';
        } catch (_) {
          if (path) {
            const range = document.createRange();
            range.selectNodeContents(path);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
          if (label) label.textContent = 'Press Ctrl+C';
        }
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          if (label) label.textContent = 'Copy';
        }, 1800);
      });
    });
  };

  const initializeShareLinks = () => {
    document.querySelectorAll('[data-share-desktop]').forEach(button => {
      button.addEventListener('click', async () => {
        const url = window.location.origin + window.location.pathname;
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'DewTask - Offline-First Windows Task Manager',
              text: 'Check out DewTask on your Windows PC:',
              url
            });
            return;
          } catch (error) {
            if (error?.name === 'AbortError') return;
          }
        }

        try {
          await navigator.clipboard.writeText(url);
          const original = button.textContent;
          button.textContent = 'Link copied for your PC ✓';
          window.setTimeout(() => { button.textContent = original; }, 2200);
        } catch (error) {
          console.warn('[DewTask] Unable to share or copy the page URL.', error);
        }
      });
    });
  };

  const initializeReleaseLinks = () => {
    const releaseUrl = 'https://api.github.com/repos/arnabsaha7/dewtask/releases/latest';
    const releaseCacheKey = 'dewtask-latest-release';
    let releasePromise;
    const versionBadge = document.getElementById('nav-version');
    const liveStatus = document.getElementById('nav-version-status');

    if (versionBadge) {
      try {
        const cachedVersion = localStorage.getItem(releaseCacheKey);
        if (cachedVersion) versionBadge.textContent = cachedVersion;
      } catch (_) {}
    }

    const getRelease = () => {
      if (!releasePromise) {
        releasePromise = fetch(releaseUrl, {
          headers: { Accept: 'application/vnd.github+json' }
        }).then(response => {
          if (!response.ok) throw new Error(`GitHub release lookup failed: HTTP ${response.status}`);
          return response.json();
        });
      }
      return releasePromise;
    };

    const getWindowsInstallers = release => (Array.isArray(release.assets) ? release.assets : [])
      .filter(asset => /\.(exe|msi)$/i.test(asset.name) && asset.browser_download_url)
      .sort((a, b) => {
        const score = asset => {
          const name = asset.name.toLowerCase();
          let value = name.endsWith('.exe') ? 30 : 20;
          if (/setup|installer/.test(name)) value += 100;
          if (/windows|win64|win-x64|x64|x86_64/.test(name)) value += 20;
          return value;
        };
        return score(b) - score(a);
      });

    getRelease().then(release => {
      if (!release || typeof release.tag_name !== 'string' || !release.tag_name.trim()) {
        throw new Error('GitHub returned a release without a version tag.');
      }
      if (versionBadge && release.tag_name) {
        versionBadge.textContent = release.tag_name;
        try { localStorage.setItem(releaseCacheKey, release.tag_name); } catch (_) {}
      }
      if (liveStatus) liveStatus.hidden = false;
      const versionPill = document.querySelector('[data-release-version]');
      if (versionPill && release.tag_name) {
        versionPill.querySelector('strong').textContent = release.tag_name;
        versionPill.hidden = false;
      }
      const installerPill = document.querySelector('[data-installer-size]');
      const installerSize = Number(getWindowsInstallers(release)[0]?.size);
      if (installerPill && Number.isFinite(installerSize) && installerSize > 0) {
        installerPill.querySelector('strong').textContent = (installerSize / (1024 * 1024)).toFixed(1) + ' MB';
        installerPill.hidden = false;
      }
    }).catch(error => {
      if (liveStatus) liveStatus.hidden = true;
      console.warn('[DewTask] Release version unavailable.', error);
    });

    document.querySelectorAll('[data-download-link]').forEach(link => {
      link.addEventListener('click', async event => {
        event.preventDefault();
        if (link.getAttribute('aria-busy') === 'true') return;

        const label = link.querySelector('[data-download-label]');
        const original = label?.textContent;
        link.setAttribute('aria-busy', 'true');
        if (label) label.textContent = 'Fetching installer…';

        try {
          const release = await getRelease();
          const installers = getWindowsInstallers(release);

          if (!installers.length) throw new Error('No Windows installer was found in the latest release.');
          window.location.assign(installers[0].browser_download_url);
        } catch (error) {
          console.error('[DewTask] Download lookup failed; opening the releases page.', error);
          window.location.assign('https://github.com/arnabsaha7/dewtask/releases/latest');
        } finally {
          if (label && original) label.textContent = original;
          link.removeAttribute('aria-busy');
        }
      });
    });
  };

  const initializeShell = () => {
    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());

    initializeHeroPause();
    initializeMobileMenu();
    initializeActiveNavigation();
    initializeLegalToc();
    initializeViewSwitcher();
    initializeArchitectureViews();
    initializeCalendarView();
    initializeCopyPath();
    initializeShareLinks();
    initializeReleaseLinks();
  };

  initializeHeroMark();

  Promise.all([
    loadPartial('[data-site-header]', 'partials/navbar.html', 'header'),
    loadPartial('[data-site-footer]', 'partials/footer.html', 'footer')
  ]).then(initializeShell).catch(error => {
    console.error('[DewTask] Shared shell initialization failed.', error);
  });
})();
