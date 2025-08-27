/* ============================================================
   Öffentliche Init (von deinem bootstrap.js aufrufen)
   ============================================================ */
export async function initUI() {
  // deine bestehenden Inits zuerst
  try { initGlobalGridBackground(); } catch(e){}
  try { initUICard(); } catch(e){}
  try { initStatusbarClock(); } catch(e){}
  try { initFooterUnlock(); } catch(e){}

  await Promise.allSettled([
    initMorphHeading(),
    initDnDBoard()
  ]);
}

/* ============================================================
   Utilities
   ============================================================ */
async function waitForEl(selector, timeout = 6000) {
  return new Promise((resolve, reject) => {
    const now = document.querySelector(selector);
    if (now) return resolve(now);
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); reject(new Error('timeout')); }, timeout);
  });
}

// Init-Guard
function guardOnce(key) {
  const root = document.documentElement;
  if (root.dataset[key]) return false;
  root.dataset[key] = '1';
  return true;
}

/* ============================================================
   Global - Grid background 
   ============================================================ */
export function initGlobalGridBackground(selector = 'body'){
  const NS = 'http://www.w3.org/2000/svg';
  const container = document.createElement('div');
  container.id = 'bg-stage';
  document.body.prepend(container);

  let svg, gGrid, gPlus, W = 0, H = 0;

  function el(tag, attrs){
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function build(){
    container.innerHTML = '';
    const rect = container.getBoundingClientRect();
    W = Math.max(1, Math.round(window.innerWidth));
    H = Math.max(1, Math.round(window.innerHeight));

    svg   = el('svg', { width:'100%', height:'100%', viewBox:`0 0 ${W} ${H}`, 'aria-hidden':'true' });
    gGrid = el('g', {});
    gPlus = el('g', {});
    svg.append(gGrid, gPlus);
    container.appendChild(svg);

    const step = 48;

    // Linien
    const seg = [];
    for (let x = 0.5; x <= W - 0.5; x += step) seg.push(`M${x} 0 V${H}`);
    for (let y = 0.5; y <= H - 0.5; y += step) seg.push(`M0 ${y} H${W}`);
    gGrid.appendChild(el('path',{
      d: seg.join(' '),
      stroke: 'rgba(255,255,255,.05)',
      'stroke-width': '1',
      'shape-rendering': 'crispEdges',
      fill: 'none'
    }));

    
    const plusStep = step * 4;
    const plusSize = 3;

    for (let x = plusStep; x < W; x += plusStep){
      for (let y = plusStep; y < H; y += plusStep){
        // vertikal
        gPlus.appendChild(el('line',{
          x1: x, y1: y - plusSize, x2: x, y2: y + plusSize,
          stroke: 'rgba(255,255,255,.3)', 'stroke-width': 1
        }));
        // horizontal
        gPlus.appendChild(el('line',{
          x1: x - plusSize, y1: y, x2: x + plusSize, y2: y,
          stroke: 'rgba(255,255,255,.3)', 'stroke-width': 1
        }));
      }
    }
  }

  build();
  window.addEventListener('resize', build);
}

/* ============================================================
   Hero - initUICard
   ============================================================ */
export function initUICard() {
  const card   = document.querySelector('.ui-card');
  if (!card) return;

  const chk    = card.querySelector('#uiSwitch');
  const skills = document.querySelector('.tech-skill');
  const welcome = document.querySelector('.hero-welcome');
  const topLed  = document.querySelector('.top-led');
  if (!chk) return;

  const apply = () => {
    const on = chk.checked;
    card.classList.toggle('is-on', on);
    if (skills)  skills.classList.toggle('active', on);
    if (welcome) welcome.classList.toggle('active', on);
    if (topLed)  topLed.classList.toggle('active', on);
  };

  chk.addEventListener('change', apply, { passive: true });
  apply();
}

/* ============================================================
   DnD-Board — init erst NACHDEM das Board existiert
   ============================================================ */
async function initDnDBoard() {
  if (!guardOnce('dndInit')) return;


  let board;
  try {
    board = await waitForEl('#dnd-board', 8000);
  } catch {

    return;
  }


  let Sortable;
  try {
    ({ default: Sortable } = await import('https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/modular/sortable.esm.js'));
  } catch (e) {
    console.error('SortableJS Import fehlgeschlagen:', e);
    return;
  }


  try {
    Sortable.create(board, {
      animation: 140,
      handle: '.handle',
      ghostClass: 'ghost',
      dragClass: 'sortable-chosen'
    });
  } catch (e) {
    console.error('Sortable Board-Init fehlgeschlagen:', e);
  }


  board.querySelectorAll('.stack').forEach(stack => {
    try {
      Sortable.create(stack, {
        animation: 120,
        group: { name: 'units', pull: true, put: true },
        ghostClass: 'ghost',
        dragClass: 'sortable-chosen'
      });
    } catch (e) {
      console.error('Sortable Stack-Init fehlgeschlagen:', e);
    }
  });
}

  /* ============================================================
   Statusbar - Clock Livetime 
   ============================================================ */
function initStatusbarClock(root = document) {
  const hourEl = root.getElementById('hour');
  if (!hourEl) return; // kein Ziel-Element -> kein Update

  const fmt = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const tick = () => {
    hourEl.textContent = fmt();
    const now = new Date();

    const msToNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(tick, msToNextMinute);
  };

  tick();
}

/* ============================================================
   Footer: Unlock-Mail stabil & einmalig
   ============================================================ */
function initFooterUnlock() {
  if (!guardOnce('footerUnlockInit')) return;

  const footer = document.getElementById('footer');
  if (!footer) return;

  const btn = footer.querySelector('.unlock-btn[data-unlock-target="contact"]') || footer.querySelector('.unlock-btn');
  const unlocked = document.getElementById('contact-unlocked');
  const lockedWrap = document.getElementById('contact-locked');
  if (!btn || !unlocked || !lockedWrap) return;

  // Initialzustand
  btn.setAttribute('aria-expanded', 'false');
  unlocked.hidden = true;
  lockedWrap.hidden = false;

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const next = !expanded;
    btn.setAttribute('aria-expanded', String(next));
    unlocked.hidden = !next;
    lockedWrap.hidden = next;

    // Optional: Button-Label
    const showLbl = btn.dataset.labelShow || 'E-Mail anzeigen';
    const hideLbl = btn.dataset.labelHide || 'E-Mail verbergen';
    btn.textContent = next ? hideLbl : showLbl;
  }, { passive: true });
}

/* ============================================================
   features - Morph Text (robust, kein Flackern, single instance)
   ============================================================ */
window.InitUI = window.InitUI || {};

window.InitUI.morphText = function (cfg) {
  const el = document.querySelector(cfg.selector);
  if (!el || !cfg.items || !cfg.items.length) return;

  // Vorherige Instanz stoppen (falls doppelt initialisiert)
  if (el._morph?.raf)   cancelAnimationFrame(el._morph.raf);
  if (el._morph?.timer) clearTimeout(el._morph.timer);

  const items    = cfg.items.slice();
  const interval = cfg.interval || 3000;
  const chars    = "!<>-_\\/[]{}—=+*^?#________";

  let frame = 0;
  let queue = [];
  let current = items[0];
  let i = 0;
  let rafId = 0;
  let timerId = 0;
  let firstPaintShown = false;

  // Inhalt bis zum ersten „update“ verstecken → kein kurzzeitiges Mehrfach-Rendering
  const prevVisibility = el.style.visibility;
  el.style.visibility = "hidden";

  function setText(newText) {
    const length = Math.max(current.length, newText.length);
    queue = [];
    for (let j = 0; j < length; j++) {
      const from  = current[j] || "";
      const to    = newText[j] || "";
      const start = Math.floor(Math.random() * 40);
      const end   = start + Math.floor(Math.random() * 40);
      queue.push({ from, to, start, end, char: null });
    }
    cancelAnimationFrame(rafId);
    frame = 0;
    update();
    current = newText;
  }

  function update() {
    let output = "";
    let complete = 0;

    for (let j = 0; j < queue.length; j++) {
      let { from, to, start, end, char } = queue[j];
      if (frame >= end) {
        complete++;
        output += to;
      } else if (frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = chars[Math.floor(Math.random() * chars.length)];
          queue[j].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }

    el.innerHTML = output;

    // Ab dem ersten Frame wieder anzeigen
    if (!firstPaintShown) {
      el.style.visibility = prevVisibility || "";
      firstPaintShown = true;
    }

    if (complete === queue.length) {
      timerId = setTimeout(next, interval);
    } else {
      frame++;
      rafId = requestAnimationFrame(update);
    }
  }

  function next() {
    i = (i + 1) % items.length;
    setText(items[i]);
  }

  // State auf dem Element merken, damit eine spätere Init sauber abbrechen kann
  el._morph = { raf: rafId, timer: timerId };

  // sofort starten
  setText(items[0]);
};

// ============================================================
// Showcase - karussell (defensiv gekapselt)
// ============================================================
(() => {
  try {
    const isCoarse = matchMedia('(pointer: coarse)').matches;
    const board = document.getElementById('dnd-board');

    if (!board || isCoarse || typeof Sortable === 'undefined') return;

    // Haupt-Board
    Sortable.create(board, {
      animation: 140,
      handle: ".handle",
      ghostClass: "ghost",
      dragClass: "sortable-chosen"
    });

    // Stacks
    board.querySelectorAll(".stack").forEach((stack) => {
      Sortable.create(stack, {
        animation: 120,
        group: { name: "units", pull: true, put: true },
        ghostClass: "ghost",
        dragClass: "sortable-chosen"
      });
    });
  } catch (e) {
    console.warn('Karussell-Init übersprungen:', e);
  }
})();





