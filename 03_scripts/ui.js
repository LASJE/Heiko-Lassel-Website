/* ============================================================
   Init - Ui
   ============================================================ */
export async function initUI() {

  initGlobalGridBackground();
  initUICard();
  initStatusbarClock();
  initFooterUnlock();

  // ---------- Helper  ----------
  function waitForEl(selector, timeout = 4000) {
    return new Promise((resolve, reject) => {
      const elNow = document.querySelector(selector);
      if (elNow) return resolve(elNow);
      const obs = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) { obs.disconnect(); resolve(el); }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); reject(new Error("timeout")); }, timeout);
    });
  }

  // ---------- Features-Heading morphen ----------
  try {
    if (!document.documentElement.dataset.morphInit) {
      const el = await waitForEl("#features .feat-h", 5000);
      if (el && window.InitUI && typeof window.InitUI.morphText === "function") {
        document.documentElement.dataset.morphInit = "1";
        window.InitUI.morphText({
          selector: "#features .feat-h",
          items: [
            "Core Planning",
            "Traditional Craft",
            "Quality Materials"
          ],
          interval: 2600
        });
      }
    }
  } catch (e) {
    console.warn("Morph-Heading nicht gefunden:", e?.message || e);
  }
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

        gPlus.appendChild(el('line',{
          x1: x, y1: y - plusSize, x2: x, y2: y + plusSize,
          stroke: 'rgba(255,255,255,.3)', 'stroke-width': 1
        }));

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
   Hero - Dnd board
   ============================================================ */

  import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/modular/sortable.esm.js";

  const board = document.getElementById("dnd-board");


  Sortable.create(board, {
    animation: 140,
    handle: ".handle",
    ghostClass: "ghost",
    dragClass: "sortable-chosen"
  });


  board.querySelectorAll(".stack").forEach((stack) => {
    Sortable.create(stack, {
      animation: 120,
      group: { name: "units", pull: true, put: true },
      ghostClass: "ghost",
      dragClass: "sortable-chosen"
    });
  });

  /* ============================================================
   Statusbar - Clock Livetime 
   ============================================================ */
function initStatusbarClock(root = document) {
  const hourEl = root.getElementById('hour');
  if (!hourEl) return; 

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
   Footer - Unlock Mail
   ============================================================ */
(() => {
  if (window.__footerUnlockBound) return;
  window.__footerUnlockBound = true;

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('#footer .footer-contact .unlock-btn[data-unlock-target="contact"]');
    if (!btn) return;

    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    const group = btn.closest('.footer-contact');
    const list  = group && group.querySelector('#contact-unlocked');
    if (!list) return;

    const showLabel = btn.dataset.labelShow || 'E-Mail anzeigen';
    const hideLabel = btn.dataset.labelHide || 'E-Mail verbergen';


    if (!btn.hasAttribute('aria-expanded')) {
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = showLabel;
      list.hidden = true;
    }

    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = showLabel;
    } else {
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.textContent = hideLabel;
    }
  }, true);
})();

/* ============================================================
   features - Morph Text 
   ============================================================ */
window.InitUI = window.InitUI || {};

InitUI.morphText = function (cfg) {
  const el = document.querySelector(cfg.selector);
  if (!el || !cfg.items || !cfg.items.length) return;

  const items = cfg.items.slice();
  const interval = cfg.interval || 3000;
  const chars = "!<>-_\\/[]{}—=+*^?#________";

  let frame = 0;
  let queue = [];
  let current = items[0];
  let i = 0;
  let requestId;

  function setText(newText) {
    const length = Math.max(current.length, newText.length);
    queue = [];
    for (let j = 0; j < length; j++) {
      const from = current[j] || "";
      const to = newText[j] || "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      queue.push({ from, to, start, end, char: null });
    }
    cancelAnimationFrame(requestId);
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
    if (complete === queue.length) {
      setTimeout(next, interval);
    } else {
      frame++;
      requestId = requestAnimationFrame(update);
    }
  }

  function next() {
    i = (i + 1) % items.length;
    setText(items[i]);
  }

  setText(items[0]);
};

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





