const $ = id => document.getElementById(id);
const R = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Theme toggle (Dark Obsidian default)
const SUN_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const MOON_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

let dark = !matchMedia('(prefers-color-scheme: light)').matches;
const applyTheme = () => {
  R.dataset.theme = dark ? 'dark' : 'light';
  const btn = $('tt');
  btn.innerHTML = dark ? SUN_ICON : MOON_ICON;
  btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  btn.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
};
$('tt').addEventListener('click', () => {
  dark = !dark;
  // Cross-fade the whole page where supported; instant swap otherwise or with reduced motion
  if (document.startViewTransition && !calm) document.startViewTransition(applyTheme);
  else applyTheme();
});
applyTheme();

// Make a role="button" card act like a native button (click, Enter, Space)
const activate = (el, fn) => {
  el.addEventListener('click', fn);
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  });
};

// =========================================================
// HERO INTERACTIVE GLASS CARDS + CAREBOT ANIMATIONS
// =========================================================

// 1. 3D Tilt & Specular Glare on Floating Glass Cards
if (!calm) {
  document.querySelectorAll('.glass-float').forEach(card => {
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rx = ((y / rect.height) - 0.5) * -12;
      const ry = ((x / rect.width) - 0.5) * 12;
      card.style.setProperty('--gx', x + 'px');
      card.style.setProperty('--gy', y + 'px');
      card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.02)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  // 2. CareBot Cursor Eye-Tracking
  const pupils = document.querySelectorAll('.bot-pupil');
  const botAvatar = $('botAvatar');
  if (pupils.length && botAvatar) {
    document.addEventListener('pointermove', e => {
      const rect = botAvatar.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const dist = Math.min(2.3, Math.hypot(e.clientX - cx, e.clientY - cy) / 140);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      pupils.forEach(p => {
        p.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
      });
    }, { passive: true });
  }
}

// 3. CareBot Interactive Pulse Scan
const BOT_LINES = [
  'Sample data · 0 bytes sent',
  'Sample: 4 assets · hashes ready',
  'Sample insurance pack · AES-256',
  'Sample alert: Daikin AC warranty'
];
let botIdx = 0;
const runBotScan = () => {
  const avatar = $('botAvatar');
  const speech = $('botSpeech');
  avatar.classList.add('scanning');
  speech.textContent = 'Scanning local vault…';
  setTimeout(() => {
    botIdx = (botIdx + 1) % BOT_LINES.length;
    speech.textContent = BOT_LINES[botIdx];
    avatar.classList.remove('scanning');
  }, 650);
};
activate($('carebotCard'), runBotScan);

// 4. Interactive Warranty Radar Cycler
const WAR_DATA = [
  { title: 'Daikin 1.5T AC', sub: 'Expiring soon · 12 mo plan', offset: 108, color: 'var(--warn)', dot: 'warn' },
  { title: 'MacBook Pro 16" M3', sub: 'Protected · 36 mo AppleCare', offset: 28, color: 'var(--ok)', dot: '' },
  { title: 'LG C3 65" OLED TV', sub: 'Active · 24 mo warranty', offset: 62, color: 'var(--accent)', dot: 'cyan' }
];
let warIdx = 0;
const cycleWarranty = () => {
  warIdx = (warIdx + 1) % WAR_DATA.length;
  const w = WAR_DATA[warIdx];
  $('warTitle').textContent = w.title;
  $('warSub').textContent = w.sub;
  $('warRing').style.strokeDashoffset = w.offset;
  $('warRing').style.stroke = w.color;
  $('warDot').className = 'gf-dot ' + w.dot;
};
activate($('cardWarranty'), cycleWarranty);

// 5. Interactive SHA-256 Hash Scramble & Verify
const HASH_POOL = ['8e41…c90a', '3b19…f42d', '9f2c…b71e', '5a7d…108c'];
let hashIdx = 0;
const verifyHeroHash = () => {
  const el = $('hashText');
  const badge = $('hashBadge');
  badge.textContent = 'Demo…';
  badge.className = 'gf-chip';
  let steps = 0;
  const hex = '0123456789abcdef';
  const timer = setInterval(() => {
    const r = () => Array.from({ length: 4 }, () => hex[Math.floor(Math.random() * 16)]).join('');
    el.textContent = `${r()}…${r()}`;
    if (++steps >= 8) {
      clearInterval(timer);
      hashIdx = (hashIdx + 1) % HASH_POOL.length;
      el.textContent = HASH_POOL[hashIdx];
      badge.textContent = 'Sample';
      badge.className = 'gf-chip';
    }
  }, 55);
};
activate($('cardHash'), verifyHeroHash);

// 6. Interactive TCO Breakdown Toggle
let showTcoService = false;
const toggleTco = () => {
  showTcoService = !showTcoService;
  $('tcoVal').textContent = showTcoService ? '₹3,000' : '₹5,44,380';
  $('tcoSub').textContent = showTcoService
    ? 'Cumulative service across 2 appliances'
    : 'Purchase ₹5,41,380 + Service ₹3,000';
};
activate($('cardTco'), toggleTco);

// =========================================================
// INTERACTIVE DESKTOP MOCKUP
// =========================================================
const inr = n => '₹' + n.toLocaleString('en-IN');
const ITEMS = [
  { n: 'LG C3 65" OLED Evo TV', r: 'Living Room', p: 189990, s: '307NTRL1X842', d: '2025-03-14', m: 24, v: 'Croma', i: 'INV-25-08813', svc: 0, f: 'LG_C3_Manual.pdf', hash: '8e41…c90a', img: 'assets/products/lg-c3-oled-tv.svg' },
  { n: 'Bosch Serie 6 Washer', r: 'Kitchen', p: 54990, s: 'WGB-6620-7741', d: '2024-01-20', m: 24, v: 'Reliance Digital', i: 'RD-24-30192', svc: 1800, f: 'Bosch_Serie6_Manual.pdf', hash: '3b19…f42d', img: 'assets/products/bosch-serie6-washer.svg' },
  { n: 'Daikin 1.5T Inverter AC', r: 'Master Bedroom', p: 46500, s: 'DKN-1507-33A91', d: '2025-12-05', m: 12, v: 'Vijay Sales', i: 'VS-25-77120', svc: 1200, f: 'Daikin_FTKM_Manual.pdf', hash: '9f2c…b71e', img: 'assets/products/daikin-inverter-ac.svg' },
  { n: 'Apple MacBook Pro 16" M3', r: 'Master Bedroom', p: 249900, s: 'FVFXK3MNQ05D', d: '2024-11-30', m: 36, v: 'Apple Store', i: 'APL-24-559021', svc: 0, f: 'MacBookPro_Guide.pdf', hash: '5a7d…108c', img: 'assets/products/macbook-pro-16.svg' }
];
const ROOMS = ['All Items', 'Living Room', 'Kitchen', 'Master Bedroom'];
const left = x => {
  const [year, month, day] = x.d.split('-').map(Number);
  const monthIndex = month - 1 + x.m;
  const dueYear = year + Math.floor(monthIndex / 12);
  const dueMonth = monthIndex % 12;
  const dueDay = Math.min(day, new Date(dueYear, dueMonth + 1, 0).getDate());
  const due = new Date(dueYear, dueMonth, dueDay);
  const today = new Date();
  const dayNumber = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5;
  return dayNumber(due) - dayNumber(today);
};
const st = x => {
  const l = left(x);
  return l < 0 ? ['bad', 'Expired ' + (-l) + 'd ago'] : l <= 90 ? ['warn', 'Expiring in ' + l + 'd'] : ['ok', l + ' days left'];
};

let room = 0;
let sel = 0;
let mobileDetail = false;
const verified = new Set();
const totalVal = ITEMS.reduce((sum, x) => sum + x.p, 0);
const panes = document.querySelector('.panes');
const syncMobileDetail = () => panes.classList.toggle('mobile-detail', mobileDetail && matchMedia('(max-width: 900px)').matches);

function draw() {
  $('rooms').innerHTML =
    '<div class="side-label">Spaces</div>' +
    ROOMS.map((n, i) => {
      const count = i === 0 ? ITEMS.length : ITEMS.filter(x => x.r === n).length;
      return `<button type="button" class="${i === room ? 'on' : ''}" data-r="${i}" aria-pressed="${i === room}">${n}<span>${count}</span></button>`;
    }).join('') +
    `<div class="side-foot">Insured Portfolio<b class="mono">${inr(totalVal)}</b></div>`;

  const vis = ITEMS.filter(x => !room || x.r === ROOMS[room]);
  if (!vis.includes(ITEMS[sel])) sel = ITEMS.indexOf(vis[0]);

  $('grid').innerHTML =
    `<div class="mh"><h4>${ROOMS[room]}</h4><span class="mono">${vis.length} ${vis.length === 1 ? 'item' : 'items'}</span></div><div class="cg">` +
    vis.map(x => {
      const k = ITEMS.indexOf(x);
      const s = st(x);
      return `<button type="button" class="it ${k === sel ? 'on' : ''}" data-i="${k}" aria-pressed="${k === sel}"><span class="th"><img src="${x.img}" alt="" loading="lazy"></span><b>${x.n}</b><small>${x.r}</small><span class="badge ${s[0]}">${s[1]}</span></button>`;
    }).join('') +
    '</div>';

  const x = ITEMS[sel];
  const s = st(x);
  const isVerified = verified.has(sel);
  const row = (a, b) => `<div class="kv"><span>${a}</span><span class="mono">${b}</span></div>`;
  $('insp').innerHTML =
    '<button type="button" class="mobile-back" data-back-to-items>← Back to items</button>' +
    `<div class="th"><img src="${x.img}" alt="${x.n}"></div>` +
    `<h3 tabindex="-1">${x.n}</h3><p class="meta">${x.r} · ${x.v}</p>` +
    `<span class="badge ${s[0]}">Warranty: ${s[1]}</span>` +
    `<div>${row('Purchase price', inr(x.p))}${row('Service costs', inr(x.svc))}${row('Total cost of ownership', inr(x.p + x.svc))}${row('Serial', x.s)}${row('Invoice', x.i)}${row('Purchased', x.d)}</div>` +
    `<div class="doc"><div class="doc-left"><span class="doc-tag mono">PDF</span><span>${x.f}</span></div><button type="button" class="verify-btn ${isVerified ? 'done' : ''}" data-verify="${sel}">${isVerified ? 'Sample hash · ' + x.hash + ' ✓' : 'Show sample hash'}</button></div>`;
  syncMobileDetail();
}

$('rooms').addEventListener('click', e => {
  const b = e.target.closest('[data-r]');
  if (b) { room = +b.dataset.r; mobileDetail = false; draw(); $('rooms').querySelector(`[data-r="${room}"]`).focus(); }
});
$('grid').addEventListener('click', e => {
  const b = e.target.closest('[data-i]');
  if (b) {
    sel = +b.dataset.i;
    mobileDetail = true;
    draw();
    if (matchMedia('(max-width: 900px)').matches) $('insp').querySelector('h3').focus();
    else $('grid').querySelector(`[data-i="${sel}"]`).focus();
  }
});
$('insp').addEventListener('click', e => {
  if (e.target.closest('[data-back-to-items]')) {
    mobileDetail = false;
    draw();
    $('grid').querySelector(`[data-i="${sel}"]`).focus();
    return;
  }
  const b = e.target.closest('[data-verify]');
  if (b) { verified.add(+b.dataset.verify); draw(); $('insp').querySelector('[data-verify]').focus(); }
});
addEventListener('resize', syncMobileDetail);
draw();

// Bento capabilities
const B = [
  ['Asset & TCO Dashboard', 'Track purchase dates, retailers, invoice numbers, serial numbers, and Total Cost of Ownership: purchase price plus cumulative service costs.', 'M3 3v18h18M7 14l4-4 3 3 5-6', '<span>Portfolio TCO</span><strong>₹5,44,380</strong>'],
  ['Smart Warranty Center', 'Color-coded active, expiring-soon, and expired tracking with customizable alert thresholds and linked warranty certificates.', 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z', '<span>Daikin AC</span><span class="mini-pill warn">30d threshold</span>'],
  ['Preventive Maintenance Scheduler', 'Recurring routines (filter cleanings, descaling, annual service) with overdue indicators and complete service logs.', 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z', '<span>RO Filter</span><span class="mini-pill">Every 6 mo</span>'],
  ['SHA-256 Verified Document Vault', 'Category folders for Invoices, Warranty Certificates, User Manuals, Serial Photos, Service Receipts, Insurance and Property Documents, with tamper detection and full-text PDF page search.', 'M6 3h9l4 4v14H6zM14 3v5h5', '<span>SHA-256 · 9f2c…b71e</span><span class="mini-pill ok">Tamper Check ✓</span>'],
  ['Property Specifications Hub', 'Room paint swatches (brand, finish, hex), electrical DB breaker mappings, mesh Wi-Fi details, and utility/AMC contacts.', 'M3 11 12 3l9 8v10H3zM9 21v-6h6v6', '<span>MCB-7 · 16A</span><strong>#E8DCC8 Matt</strong>'],
  ['AES-256 Encrypted Insurance Packs', 'One-click password-protected .zip exports bundling CSV inventory, maintenance history, attachments, and an auto-generated PDF Valuation Report.', 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', '<span>Claim_Pack.zip</span><span class="mini-pill ok">AES-256</span>']
];
$('bento').innerHTML = B.map(b =>
  `<div class="card spotlight"><div class="ico"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${b[2]}"/></svg></div><h3>${b[0]}</h3><p>${b[1]}</p><div class="mini-ui">${b[3]}</div></div>`
).join('');

// Feature deep-dive tabs
const kv = (a, b) => `<div class="kv"><span>${a}</span><span class="mono">${b}</span></div>`;
const T = [
  {
    t: 'Asset & Warranty Tracking',
    c: ['Purchase date, retailer, invoice and serial per item', 'TCO = purchase price + every service cost', 'Active, expiring-soon, and expired status badges', 'Custom alert thresholds per category'],
    v: () => `<b>Daikin 1.5T Inverter AC</b>${kv('Price', '₹46,500')}${kv('Service', '₹1,200')}${kv('TCO', '₹47,700')}<p style="margin:14px 0 0"><span class="badge warn">Warranty expiring soon</span></p>`
  },
  {
    t: 'Document Vault & PDF Search',
    c: ['Seven structured category folders', 'SHA-256 hash stored per file with tamper detection on open', 'Full-text search across PDF pages', 'Link manuals and certificates directly to items'],
    v: () => `<b>Search: “compressor warranty”</b>${kv('Daikin_FTKM_Manual.pdf', 'p. 34')}${kv('Warranty_Certificate.pdf', 'p. 2')}${kv('SHA-256', '9f2c…b71e ✓ verified')}`
  },
  {
    t: 'Property Specs',
    c: ['Paint swatches: brand, finish, and hex per room', 'DB breaker-to-room mapping with amperage', 'Mesh Wi-Fi nodes, SSIDs, and router notes', 'Utility and AMC contact directory'],
    v: () => `<b>Master Bedroom</b>${kv('Paint', 'Asian Paints · Matt · #E8DCC8')}${kv('Breaker', 'MCB-7 · 16A · AC + sockets')}${kv('Wi-Fi node', 'Hall-2 · 5 GHz')}`
  },
  {
    t: 'Insurance Packs & Backups',
    c: ['One-click AES-256 password-protected .zip', 'CSV inventory, maintenance history, and attachments', 'Auto-generated PDF Valuation Report', '.hvbackup archives with SHA-256 verification'],
    v: () => `<b>ItemCare_Insurance_Pack.zip</b>${kv('Encryption', 'AES-256')}${kv('Items', '4 · ₹5,41,380 insured value')}${kv('Contents', 'CSV · PDF · 31 files')}`
  }
];
let tab = 0;
function drawTab() {
  $('tabs').innerHTML = T.map((x, i) =>
    `<button type="button" role="tab" id="workflow-tab-${i}" aria-selected="${i === tab}" tabindex="${i === tab ? 0 : -1}" class="btn ${i === tab ? 'on' : ''}" data-t="${i}">${x.t}</button>`
  ).join('');
  const x = T[tab];
  $('tabbody').setAttribute('aria-labelledby', `workflow-tab-${tab}`);
  $('tabbody').innerHTML =
    `<div><h3>${x.t}</h3><ul class="chk">${x.c.map(c => `<li>${c}</li>`).join('')}</ul></div>` +
    `<div><div class="tabcard">${x.v()}</div></div>`;
}
$('tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-t]');
  if (b) selectTab(+b.dataset.t);
});
const selectTab = index => {
  tab = (index + T.length) % T.length;
  drawTab();
  $(`workflow-tab-${tab}`).focus();
};
$('tabs').addEventListener('keydown', e => {
  const b = e.target.closest('[data-t]');
  if (!b) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); selectTab(tab + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); selectTab(tab - 1); }
  else if (e.key === 'Home') { e.preventDefault(); selectTab(0); }
  else if (e.key === 'End') { e.preventDefault(); selectTab(T.length - 1); }
});
drawTab();

// FAQ
const F = [
  ['Does ItemCare require an internet connection or account?', 'No. ItemCare is fully offline: there are no accounts, no sign-in, and no telemetry. The only network use is your own choice to download releases from GitHub.'],
  ['Where are my files and database stored?', 'By default in %APPDATA%\\com.itemcare.desktop\\ItemCare\\, with the database at itemcare.db and attachments in the vault folder. You can point ItemCare at any custom folder instead.'],
  ['How do encrypted insurance packs work?', 'With one click, ItemCare bundles your CSV inventory, maintenance history, attachments, and an auto-generated PDF Valuation Report into a .zip protected with AES-256 and a password you choose. Keep the password safe: it cannot be recovered.'],
  ['How do I back up or move my vault to a new PC?', 'Export a portable .hvbackup archive, copy it to the new PC, install ItemCare, and import it. SHA-256 checksums are verified during import so corrupted archives are caught.'],
  ['Why does Windows SmartScreen show a prompt on first launch?', 'Early open-source releases are not yet code-signed, so SmartScreen warns about unrecognized apps. Click More info, then Run anyway. You can also review the source on GitHub first.']
];
$('faqs').innerHTML = F.map(f => `<details class="f"><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join('');

// Cursor-tracking spotlight on cards
document.addEventListener('pointermove', e => {
  const card = e.target.closest('.spotlight');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
  card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
}, { passive: true });

// Scroll-driven navigation pill & progress bar
const nav = document.querySelector('nav');
const lk = $('lk');
const mb = $('mb');
const ind = document.createElement('span');
ind.className = 'ind';
lk.prepend(ind);
const as = [...lk.querySelectorAll('a')];
let cur = '';

function mark(id) {
  cur = id;
  const a = as.find(x => x.hash === '#' + id);
  as.forEach(x => x.classList.toggle('on', x === a));
  ind.style.opacity = a ? 1 : 0;
  if (a) {
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
  }
}

// Progress bar is CSS scroll-driven (styles.css); JS only toggles the nav state
let tick = false;
function onScroll() {
  tick = false;
  nav.classList.toggle('scrolled', scrollY > 12);
  if (scrollY < 180 && cur) mark('');
}
addEventListener('scroll', () => {
  if (!tick) { tick = true; requestAnimationFrame(onScroll); }
}, { passive: true });
addEventListener('resize', () => mark(cur));
onScroll();

const so = new IntersectionObserver(
  es => es.forEach(e => { if (e.isIntersecting && scrollY >= 180) mark(e.target.id); }),
  { rootMargin: '-42% 0px -50% 0px' }
);
['preview', 'features', 'deep-dive', 'privacy', 'download', 'faq'].forEach(id => so.observe($(id)));

// Mobile menu + Escape close
const shut = () => {
  lk.classList.remove('open');
  mb.setAttribute('aria-expanded', 'false');
  mb.textContent = 'Menu';
};
mb.addEventListener('click', () => {
  const o = lk.classList.toggle('open');
  mb.setAttribute('aria-expanded', String(o));
  mb.textContent = o ? 'Close' : 'Menu';
});
lk.addEventListener('click', e => { if (e.target.closest('a')) shut(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && lk.classList.contains('open')) shut(); });

// Download toast notification
const toast = $('toast');
let toastTimer;
document.querySelectorAll('a[download]').forEach(a => a.addEventListener('click', () => {
  toast.textContent = 'Download started: ItemCare_1.0.0_x64-setup.exe. If SmartScreen appears, choose More info, then Run anyway.';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 6000);
}));

// =========================================================
// SINGLE-LINE ROTATING HERO WORD ("Your [home. / assets. / control.]")
// =========================================================
const wordSlot = $('wordSlot');
if (wordSlot) {
  const words = [...wordSlot.querySelectorAll('.rot-word')];
  let wordIdx = 0;

  const syncSlotWidth = () => {
    const activeWord = words[wordIdx];
    if (activeWord) wordSlot.style.width = activeWord.offsetWidth + 'px';
  };

  // Measure once fonts are ready so the width fits each word cleanly
  syncSlotWidth();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncSlotWidth);
  }
  addEventListener('resize', syncSlotWidth);

  if (!calm && words.length > 1) {
    setInterval(() => {
      const prev = words[wordIdx];
      prev.classList.remove('active');
      prev.classList.add('exit');
      setTimeout(() => prev.classList.remove('exit'), 600);

      wordIdx = (wordIdx + 1) % words.length;
      const next = words[wordIdx];
      next.classList.add('active');
      syncSlotWidth();
    }, 2600);
  }
}
