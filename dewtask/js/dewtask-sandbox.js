(() => {
  'use strict';

  const scriptUrl = document.currentScript?.src || new URL('js/dewtask-sandbox.js', window.location.href).href;
  const siteRoot = new URL('../', scriptUrl);
  const partialUrl = new URL('partials/dewtask-sandbox.html', siteRoot).href;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const initSandbox = rootEl => {
    if (!rootEl || rootEl.dataset.dwReady === 'true') return;
    rootEl.dataset.dwReady = 'true';

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

    const body = rootEl.querySelector('#dwBody');
    const nav = rootEl.querySelector('#dwNav');
    const qi = rootEl.querySelector('#dwq');
    const addBtn = rootEl.querySelector('#dwAddBtn');
    const quotaEl = rootEl.querySelector('#dwQuota');
    const pop = rootEl.querySelector('#dwPop');
    const form = rootEl.querySelector('#dwForm');
    const titleIn = rootEl.querySelector('#dwNewTitle');
    const tagIn = rootEl.querySelector('#dwNewTag');
    const cancelBtn = rootEl.querySelector('#dwCancel');
    const popLim = rootEl.querySelector('#dwPopLim');
    const toast = document.getElementById('toast') || rootEl.querySelector('#dwToast');

    let toastTimer;
    const say = msg => {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    };

    let view = 'overview';
    let qs = '';
    const cnt = s => tasks.filter(t => t.s === s).length;
    const customCount = () => tasks.filter(t => t.custom).length;

    const updateQuotaUI = () => {
      const used = customCount();
      const left = Math.max(0, MAX_CUSTOM - used);
      quotaEl.textContent = `${used}/${MAX_CUSTOM}`;
      addBtn.classList.toggle('full', left === 0);
      popLim.textContent = `${left} of ${MAX_CUSTOM} custom slot${left === 1 ? '' : 's'} left`;
    };

    const openPop = () => {
      if (customCount() >= MAX_CUSTOM) {
        say('Sandbox limit: max 2 custom tasks. Delete a task to add another.');
        return;
      }
      updateQuotaUI();
      pop.hidden = false;
      addBtn.setAttribute('aria-expanded', 'true');
      titleIn.value = qi.value.trim().slice(0, 48);
      titleIn.focus();
    };

    const closePop = returnFocus => {
      pop.hidden = true;
      addBtn.setAttribute('aria-expanded', 'false');
      form.reset();
      if (returnFocus) addBtn.focus();
    };

    const render = focusAfter => {
      updateQuotaUI();
      nav.querySelectorAll('[data-v]').forEach(b => {
        const on = b.dataset.v === view;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });

      const n = tasks.length || 1;
      const d = cnt('done');
      const p = cnt('progress');
      const td = cnt('todo');
      let h = '';

      if (view === 'overview') {
        const per = days.map((_, i) => tasks.filter(t => t.s === 'done' && t.day === i).length);
        const mx = Math.max(1, ...per);
        h = `<div class="dwc"><div class="dwh"><div><h4>Overall progress</h4><small>Completion · This week</small></div>` +
            `<b class="dw-pct">${tasks.length ? Math.round((d / n) * 100) : 0}%</b></div>` +
            `<div class="dwg"><i class="s-done" style="width:${(d / n) * 100}%"></i>` +
            `<i class="s-progress" style="width:${(p / n) * 100}%"></i>` +
            `<i class="s-todo" style="width:${(td / n) * 100}%"></i></div>` +
            `<small>Completed (${d}) · In progress (${p}) · To do (${td})</small></div>` +
            `<div class="dws">` +
              `<div class="dwc"><small>Total</small><b>${tasks.length}</b></div>` +
              `<div class="dwc"><small>Completed</small><b>${d}</b></div>` +
              `<div class="dwc"><small>In progress</small><b>${p}</b></div>` +
              `<div class="dwc"><small>To do</small><b>${td}</b></div>` +
            `</div>` +
            `<div class="dwc"><div class="dwh"><h4>Completed tasks</h4><small>${d} completed</small></div>` +
            `<div class="dwch" aria-hidden="true">${per.map(v => `<div><i style="height:${(v / mx) * 100}%"></i></div>`).join('')}</div>` +
            `<div class="dwd" aria-hidden="true">${days.map(x => `<span>${x}</span>`).join('')}</div></div>` +
            `<small class="dw-hint">Tip: click + to name a new task (up to 2 custom) or switch to All Tasks.</small>`;
      } else {
        const list = tasks.filter(t => (view === 'all' || t.d === view) && t.t.toLowerCase().includes(qs));
        h = list.length
          ? `<div class="dw-list">${list.map(t =>
              `<div class="dwr">` +
                `<button type="button" class="chip ${t.s}" data-toggle="${t.id}" aria-label="${esc(t.t)}: ${lab[t.s]}. Click to cycle status">${lab[t.s]}</button>` +
                `<span class="${t.s === 'done' ? 'x' : ''}">${esc(t.t)}</span>` +
                `<small>${esc(t.w)}</small>` +
                `<button type="button" class="dw-del" data-del="${t.id}" aria-label="Delete task ${esc(t.t)}" title="Delete task">×</button>` +
              `</div>`).join('')}</div>` +
            `<small class="dw-hint">Click status pill to cycle state, or × to remove a task.</small>`
          : `<div class="dwc"><small>No tasks match your filter.</small></div>`;
      }

      body.innerHTML = h;

      if (typeof focusAfter === 'function') {
        const el = focusAfter();
        if (el) el.focus();
      }
    };

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
          render(() => body.querySelector(`[data-toggle="${id}"]`));
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
      if (!val) {
        titleIn.focus();
        return;
      }
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
  };

  const mountSandboxes = async () => {
    const mounts = [...document.querySelectorAll('[data-dewtask-sandbox]')];
    if (!mounts.length) {
      const inline = document.getElementById('dw');
      if (inline) initSandbox(inline);
      return;
    }

    try {
      const res = await fetch(partialUrl, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      mounts.forEach(mount => {
        mount.innerHTML = html;
        const dw = mount.querySelector('#dw');
        if (dw) initSandbox(dw);
      });
    } catch (err) {
      console.error('[DewTask Sandbox] Failed to load partial:', err);
      mounts.forEach(mount => {
        mount.innerHTML = '<div class="p-6 font-mono text-xs text-slate-400">Interactive sandbox unavailable offline.</div>';
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSandboxes);
  } else {
    mountSandboxes();
  }
})();