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
            <span>DewTask · Local-First Windows Task Manager</span>
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

    // Give the first section a selected state even before the first scroll event.
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

  const initializeShareLinks = () => {
    document.querySelectorAll('[data-share-desktop]').forEach(button => {
      button.addEventListener('click', async () => {
        const url = window.location.origin + window.location.pathname;
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'DewTask — Offline-First Windows Task Manager',
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
    let releasePromise;

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

    getRelease().then(release => {
      const badge = document.getElementById('nav-version');
      if (badge && release.tag_name) badge.textContent = release.tag_name;
    }).catch(error => console.warn('[DewTask] Release version unavailable.', error));

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
          const installers = (Array.isArray(release.assets) ? release.assets : [])
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

    initializeMobileMenu();
    initializeActiveNavigation();
    initializeLegalToc();
    initializeViewSwitcher();
    initializeShareLinks();
    initializeReleaseLinks();
  };

  Promise.all([
    loadPartial('[data-site-header]', 'partials/navbar.html', 'header'),
    loadPartial('[data-site-footer]', 'partials/footer.html', 'footer')
  ]).then(initializeShell).catch(error => {
    // A final guard keeps page content usable if shell initialization itself fails.
    console.error('[DewTask] Shared shell initialization failed.', error);
  });
})();
