/* ============================================================
   Öffentliche Init (von deinem bootstrap.js aufrufen)
   ============================================================ */
export async function initUI() {
  // deine bestehenden Inits zuerst
  try { initGlobalGridBackground(); } catch(e){}
  try { initUICard(); } catch(e){}
  try { initStatusbarClock(); } catch(e){}
  try { initFooterUnlock(); } catch(e){}   // stabilisiert

  // danach: warten bis DOM da ist, dann Feature-Inits
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

// Einmal-Init-Guard
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

    const step = 48; // Abstand zwischen Gridlinien

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

    // Plusse (nicht jedes Feld, nur jedes 4.)
    const plusStep = step * 4;
    const plusSize = 3; // Länge der Plus-Striche

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

  // Board abwarten (Bootstrap hängt DOM ein)
  let board;
  try {
    board = await waitForEl('#dnd-board', 8000);
  } catch {
    // Kein Board? dann raus.
    return;
  }

  // Sortable erst laden, wenn wirklich gebraucht
  let Sortable;
  try {
    ({ default: Sortable } = await import('https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/modular/sortable.esm.js'));
  } catch (e) {
    console.error('SortableJS Import fehlgeschlagen:', e);
    return;
  }

  // Sektionen (Cluster) via Handle sortieren
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

  // Items zwischen Stacks verschieben
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
    // Genau bis zur nächsten vollen Minute warten
    const msToNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(tick, msToNextMinute);
  };

  tick(); // Initiales Setzen
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

    // Optional: Button-Label aus data-Attributen nehmen, falls vorhanden
    const showLbl = btn.dataset.labelShow || 'E-Mail anzeigen';
    const hideLbl = btn.dataset.labelHide || 'E-Mail verbergen';
    btn.textContent = next ? hideLbl : showLbl;
  }, { passive: true });
}


/* ============================================================
   MorphText robust starten (egal ob .feat-h oder .feat-title)
   ============================================================ */
async function initMorphHeading() {
  // nur 1x
  if (!guardOnce('morphInit')) return;

  // suche flexibel: zuerst .feat-h, sonst .feat-title
  let sel = '#features .feat-h';
  if (!document.querySelector(sel)) sel = '#features .feat-title';

  try {
    await waitForEl(sel, 6000);
    if (window.InitUI && typeof window.InitUI.morphText === 'function') {
      window.InitUI.morphText({
        selector: sel,
        items: ["Core Planning", "Traditional Craft", "Quality Materials"],
        interval: 2600
      });
    } else {
      console.warn('InitUI.morphText fehlt (Reihenfolge!)');
    }
  } catch (e) {
    console.warn('Morph-Heading nicht gefunden:', e?.message || e);
  }
}

/* ============================================================
   Showcase - karussell
   ============================================================ */

const isCoarse = matchMedia('(pointer: coarse)').matches;

if (!isCoarse) {

  Sortable.create(board, { animation:140, handle: ".handle", ghostClass:"ghost", dragClass:"sortable-chosen" });
  board.querySelectorAll(".stack").forEach((stack) => {
    Sortable.create(stack, { animation:120, group:{name:"units", pull:true, put:true}, ghostClass:"ghost", dragClass:"sortable-chosen" });
  });
}

document.querySelectorAll('.unlock-btn[data-unlock-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-unlock-target');
    const locked = document.getElementById(`${target}-locked`);
    const unlocked = document.getElementById(`${target}-unlocked`);
    if (locked && unlocked) {
      locked.hidden = true;
      unlocked.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});








