/* ============================================================
   initUI
   ============================================================ */

export function initUI() {
  /* Stage-Layer */
  createStage('#hero-stage');
  createStage('#showcase-stage');   
  createStage('#vision-stage');     

  /* UI Interaktionen */
  wireSettingsButton();
  wireUnlockSlider();

  /* Module / Features */
  initShowcase();     
  mountVisorText();
  wireFooterUnlocks();
}

/* ============================================================
   SECTION 0 - Button
   ============================================================ */

function wireSettingsButton() {

  const btn   = document.querySelector('.settings-btn');
  const icon  = btn?.querySelector('.fa-gear');
  const panel = document.querySelector('.tech-skill');

  // ------- Button - Safty -------
  if (!btn) { 
    requestAnimationFrame(wireSettingsButton); 
    return; 
  }
  if (btn.dataset.wired === '1') return;
  btn.dataset.wired = '1';

  // ------- Settings -------
  const MIN_PRESS_MS = 675;
  let pressStart = 0;
  let clearTimer = null;


  const addPress = () => {
    if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
    pressStart = performance.now();
    btn.classList.add('is-press');
  };

  const clearPress = () => {
    const elapsed = performance.now() - pressStart;
    const remain  = Math.max(0, MIN_PRESS_MS - elapsed);
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      btn.classList.remove('is-press');
      clearTimer = null;
    }, remain);
  };

  // ------- Klick - Icon -------
  btn.addEventListener('click', () => {
    if (icon) {
      icon.classList.remove('spin');
      void icon.offsetWidth;
      icon.classList.add('spin');
    }
    if (panel) {
      panel.classList.toggle('active');
    }
  });
  
  // ------- Press-State (Desktop + Mobile) -------
  btn.addEventListener('pointerdown',   addPress,    { passive: true });
  btn.addEventListener('pointerup',     clearPress,  { passive: true });
  btn.addEventListener('pointerleave',  clearPress,  { passive: true });
  btn.addEventListener('pointercancel', clearPress,  { passive: true });
  btn.addEventListener('blur',          clearPress);

  // ------- Animation Ende -------
  icon?.addEventListener('animationend', () => icon.classList.remove('spin'));
}

/* ============================================================
   SECTION 1 — Unlock-Slider (final)
   ============================================================ */
function wireUnlockSlider(){
  const wrap  = document.querySelector('.unlock');
  if(!wrap || wrap.dataset.wired === '1') return;  
  wrap.dataset.wired = '1';

  // ------- DOM-Hooks -------
  const track = wrap.querySelector('.unlock__track');
  const thumb = wrap.querySelector('.unlock__button');
  const fill  = wrap.querySelector('.unlock__fill');
  const hint  = wrap.querySelector('.unlock__hint');
  if(!track || !thumb || !fill) return;
  
  // ------- Under-Layer Safe Zone -------
  let under = track.querySelector('.unlock__under');
  if(!under){
    under = document.createElement('div');
    under.className = 'unlock__under';
    track.appendChild(under);
  }
  
  // ------- Animation - Background Button -------
  let thrust = track.querySelector('.unlock__thrust');
  if(!thrust){
    thrust = document.createElement('div');
    thrust.className = 'unlock__thrust';
    track.insertBefore(thrust, thumb); 
  }
  // ------- Animation - Background Button - Glow -------
  let nozzle = thrust.querySelector('.unlock__nozzle');
  if(!nozzle){
    nozzle = document.createElement('div');
    nozzle.className = 'unlock__nozzle';
    thrust.appendChild(nozzle);
  }

  // ------- Tweak-Points -------
  const SNAP_ACTIVATE   = 0.60; 
  const SNAP_DEACTIVATE = 0.40;  
  const BASE_OPACITY    = 0.60;  
  const SPEED_GAIN      = 4.00;  
  const HINT_FADE_MAX   = 0.80;  

  // ------- Timezone - State -------
  let trackRect, thumbW, maxTravel;
  let p = 0;
  let active = false, dragging = false;
  let startX = 0, startP = 0;
  let rafRender = 0;

  // ------- Smooth Animation Points -------
  let lastRenderT = 0, lastX = 0, speed = 0;

  // ------- Maße / Size -------
  function measure(){
    trackRect = track.getBoundingClientRect();
    thumbW    = thumb.offsetWidth || 36;
    maxTravel = Math.max(0, trackRect.width - 8 - thumbW); 

    under.style.width  = thumbW + 'px';
    under.style.height = thumbW + 'px';
    under.style.top    = '4px';
    under.style.left   = '4px';


    thrust.style.top   = '4px';
    thrust.style.left  = '4px';
    thrust.style.height= thumbW + 'px';

    fixLayering();
  }
  measure();
  window.addEventListener('resize', measure, {passive:true});

  // ------- Layering -------
  function fixLayering(){
  track.style.position = 'relative';

  if (fill)   fill.style.zIndex   = '1';
  if (thrust) thrust.style.zIndex = '2';
  if (under)  under.style.zIndex  = '3';
  if (thumb)  thumb.style.zIndex  = '5'; 

  if (hint){
    hint.style.position = 'absolute';
    hint.style.inset = '0';
    hint.style.zIndex = '99';
    hint.style.pointerEvents = 'none';
  }
}

  // ------- Render  -------
  function render(){
    rafRender = 0;
    const x = maxTravel * p;
    const t = `translate3d(${x}px,0,0)`;

    thumb.style.transform = t;
    under.style.transform = t;

    fill.style.transform  = `scaleX(${p})`;

    thrust.style.width = (x + thumbW * 0.5) + 'px';

    const now = performance.now();
    const dt  = Math.max(16, now - lastRenderT);
    const vx  = Math.abs(x - lastX) / dt; 
    speed     = speed * 0.85 + vx * 0.15;
    lastX = x; lastRenderT = now;

    const op = Math.min(1, BASE_OPACITY + SPEED_GAIN * speed);
    thrust.style.opacity = op.toFixed(3);
    nozzle.style.filter  = `blur(${(0.8 + speed * 3).toFixed(2)}px)`;

    if(hint){

    const o = Math.max(0.85, 1 - p * 0.30);
    hint.style.opacity = o.toFixed(3);
}

    thumb.setAttribute('aria-valuenow', Math.round(p*100));
    wrap.classList.toggle('is-active', active);
  }
  const schedule = ()=> { if(!rafRender) rafRender = requestAnimationFrame(render); };

  // ------- Animation - Snap -------
  function animateTo(target, ms=240){
    const p0 = p, dp = target - p0, t0 = performance.now();
    (function step(t){
      const k = Math.min(1, (t - t0)/ms);
      const e = 1 - Math.pow(1 - k, 3);   
      p = p0 + dp * e;
      schedule();
      if(k < 1) requestAnimationFrame(step);
    })(t0);
  }

  // ------- Pointer/Touch -------
  function onDown(e){
    e.preventDefault();
    measure();
    dragging = true;
    const cx = (e.clientX ?? e.touches?.[0]?.clientX ?? 0);
    startX = cx; startP = p;
    wrap.classList.add('unlock--active');
    if(e.pointerId!=null && thumb.setPointerCapture) thumb.setPointerCapture(e.pointerId);
  }
  function onMove(e){
    if(!dragging) return;
    const cx = (e.clientX ?? e.touches?.[0]?.clientX ?? 0);
    const dx = cx - startX;
    const np = startP + (dx / Math.max(1, maxTravel));
    p = Math.max(0, Math.min(1, np));
    schedule();
  }
  function onUp(){
    if(!dragging) return;
    dragging = false;
    wrap.classList.remove('unlock--active');

    if(!active){
      if(p >= SNAP_ACTIVATE){ active = true;  animateTo(1); }
      else                  { active = false; animateTo(0); }
    }else{
      if(p <= SNAP_DEACTIVATE){ active = false; animateTo(0); }
      else                    { active = true;  animateTo(1); }
    }

    document.dispatchEvent(new CustomEvent('unlock:changed', {
      detail:{ active, value: Math.round(p*100) }
    }));
  }

  // ------- Track - Klick -------
  track.addEventListener('click', ()=>{
    if(dragging) return;
    active = !active;
    animateTo(active ? 1 : 0);
    document.dispatchEvent(new CustomEvent('unlock:changed', {
      detail:{ active, value: active ? 100 : 0 }
    }));
  });

  // ------- Pointer - Touch -------
  thumb.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, {passive:false});
  window.addEventListener('pointerup',   onUp,   {passive:true});
  window.addEventListener('pointercancel', onUp, {passive:true});

  thumb.addEventListener('touchstart', onDown, {passive:false});
  window.addEventListener('touchmove',  onMove, {passive:false});
  window.addEventListener('touchend',   onUp,   {passive:true});
  
  render();
}

/* ============================================================
   SECTION 2 — STAGE & GRID (final)
   ============================================================ */
function createStage(selector){
  const NS = 'http://www.w3.org/2000/svg';
  const stage = document.querySelector(selector);
  if (!stage) return null;
  if (stage.clientHeight < 10) stage.style.minHeight = '360px';

  let svg, gGrid, gLines, W = 0, H = 0;
  const resizeHandlers = new Set();

  
  // ------- Helpers -------
  function el(tag, attrs){
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function gridPath(w, h, step){
    const seg = [];
    const ox = 0.5, oy = 0.5;
    const maxX = w - 0.5;
    const maxY = h - 0.5;

    for (let x = ox; x <= maxX; x += step) seg.push(`M${x} ${oy} V${maxY}`);
    for (let y = oy; y <= maxY; y += step) seg.push(`M${ox} ${y} H${maxX}`);
    return seg.join(' ');
  }

  function chooseGridStep(W, H){
    const target  = Math.min(W, H) / 24;               
    const choices = [12,14,16,18,20,22,24,26,28,32];    
    let best = choices[0];
    for (const c of choices){
      if (Math.abs(c - target) < Math.abs(best - target)) best = c;
    }
    return best;
  }
  // ------- Builds -------
  function build(){

    stage.innerHTML = '';
    const rect = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));

    svg    = el('svg', { width:'100%', height:'100%', viewBox:`0 0 ${W} ${H}`, role:'img', 'aria-hidden':'true' });
    gGrid  = el('g', {});
    gLines = el('g', {});
    svg.append(gGrid, gLines);
    stage.appendChild(svg);

    const step = chooseGridStep(W, H);
    gGrid.appendChild(el('path',{
      d: gridPath(W, H, step),
      stroke: 'rgba(255,255,255,.06)',
      'stroke-width': '1',
      'shape-rendering': 'crispEdges',
      fill: 'none'
    }));

    for (const cb of resizeHandlers) cb({ svg, gGrid, gLines, W, H });
  }

  // ------- Resize -------
  const ro = new ResizeObserver(build);
  ro.observe(stage);
  build();

  // ------- Public Api -------
  return {
    svg:      ()=> svg,
    gGrid:    ()=> gGrid,
    gLines:   ()=> gLines,
    size:     ()=> ({ W, H }),
    onResize(cb){
      resizeHandlers.add(cb);
      cb({ svg, gGrid, gLines, W, H });
      return ()=> resizeHandlers.delete(cb);
    }
  };
}

/* ============================================================
   SECTION 3 — ICON MESH 
   ============================================================ */
export function initShowcase(){
  const root  = document.querySelector('#showcase');
  if (!root) return;

  const slideEl = root.querySelector('.sc-panel');
  const prevBtn = root.querySelector('.sc-prev');
  const nextBtn = root.querySelector('.sc-next');
  const ticksEl = root.querySelector('.sc-nav-tick');

  if (slideEl && !slideEl.hasAttribute('tabindex')) {
    slideEl.setAttribute('tabindex', '0');
  }

  // ------- Font Awesome Icons -------
  const slides = [
  {
    icon: 'fa-solid fa-code',
    title: 'Frontend Engineering',
    text: 'Semantisches HTML, modernes CSS, performantes JS'
  },
  {
    icon: 'fa-solid fa-pen-ruler',
    title: 'UI · UX Design',
    text: 'Flows, Prototypen, Micro-Interactions, Accessibility'
  },
  {
    icon: 'fa-solid fa-database',
    title: 'Datenarchitektur',
    text: 'Modelle, Normalisierung, Indexing, Caching'
  },
  {
    icon: 'fa-solid fa-server',
    title: 'Backend & APIs',
    text: 'REST/GraphQL, Auth, saubere Schnittstellen'
  },
  {
    icon: 'fa-solid fa-network-wired',
    title: 'Network Protocols',
    text: 'HTTP/2–3, WebSockets, TLS, Latenz-Optimierung'
  },
  {
    icon: 'fa-solid fa-robot',
    title: 'Robotics Prototyping',
    text: 'Sensorik, Steuerung, modulare Prototypen'
  },
  {
    icon: 'fa-solid fa-cube',
    title: 'Realtime Graphics',
    text: 'Shading, Interaktion, Performance-Tuning'
  }
];

  let current = 0;

  ticksEl.innerHTML = '';
  slides.forEach((_, i) => {
    const t = document.createElement('span');
    if (i === 0) t.classList.add('active');
    ticksEl.appendChild(t);
  });

  function render(){
    const s = slides[current];
    slideEl.innerHTML = `
      <i class="${s.icon}"></i>
      <h3>${s.title}</h3>
      <p>${s.text}</p>
    `;
    ticksEl.querySelectorAll('span').forEach((el, i) => {
      el.classList.toggle('active', i === current);
    });
  }

  function go(delta){
    current = (current + delta + slides.length) % slides.length;
    render();
  }

  // ------- Klick -------
  if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => go(+1));

  // ---------- Keyboard ----------
  if (slideEl){
    slideEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  go(-1);
      if (e.key === 'ArrowRight') go(+1);
    });
  }

  // ---------- Touch - Swipe ----------
  let tStartX = null, tStartY = null, swipeLock = false;
  const SWIPE_THRESHOLD = 36;  // mehr Weg nötig -> ruhiger
  const SWIPE_COOLDOWN  = 280; // kurze Sperre zwischen Slides

  root.addEventListener('touchstart', (e)=>{
    if (swipeLock) return;
    const t = e.touches[0];
    tStartX = t.clientX; tStartY = t.clientY;
  }, {passive:true});

  root.addEventListener('touchmove', (e)=>{
    if (tStartX == null) return;
    const t = e.touches[0];
    const dx = t.clientX - tStartX;
    const dy = t.clientY - tStartY;

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)*1.3){
      swipeLock = true;
      go(dx < 0 ? +1 : -1);
      tStartX = tStartY = null;
      setTimeout(()=> (swipeLock = false), SWIPE_COOLDOWN);
    }
  }, {passive:true});

  root.addEventListener('touchend', ()=>{
    tStartX = tStartY = null;
  }, {passive:true});

  // ---------- Mouse Click ----------
  let dragging = false, startX = 0, startY = 0, dragLock = false;
  const DRAG_THRESHOLD = 34;
  const DRAG_COOLDOWN  = 260;

  root.addEventListener('pointerdown', (e)=>{
    if (dragLock || e.button !== 0) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
  });

  window.addEventListener('pointermove', (e)=>{
    if (!dragging || dragLock) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy)*1.3){
      dragLock = true;
      dragging = false;
      go(dx < 0 ? +1 : -1);
      setTimeout(()=> (dragLock = false), DRAG_COOLDOWN);
    }
  });

  window.addEventListener('pointerup', ()=>{
    dragging = false;
  });

  // ---------- Trackpad ----------
  let wheelAccum = 0;
  let wheelLock  = false;
  const WHEEL_THRESHOLD = 90;  
  const WHEEL_COOLDOWN  = 420; 

  root.addEventListener('wheel', (e)=>{

    const dx = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : 0;
    if (!dx) return;               
    e.preventDefault();            

    if (wheelLock) return;

    const scale = (e.deltaMode === 1) ? 16 : (e.deltaMode === 2 ? root.clientWidth : 1);
    wheelAccum += dx * scale;

    if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD){
      go(wheelAccum > 0 ? +1 : -1);
      wheelAccum = 0;
      wheelLock = true;
      setTimeout(()=> (wheelLock = false), WHEEL_COOLDOWN);
    }
  }, {passive:false});

  render();
}

/* ============================================================
   SECTION 4 —  Mount Visor 
   ============================================================ */
function mountVisorText() {
  const about = document.getElementById('vision');
  if (!about) return;

  const wrap = about.querySelector('.vg-wrap');
  const svg  = about.querySelector('.vision-goggles .vg');
  const clip = about.querySelector('#vg-clip');
  if (!wrap || !svg || !clip) return;

  // ------- Animation - Text Box -------
  let box = about.querySelector('.visor-box');
  if (!box) {
    box = document.createElement('div');
    box.className = 'visor-box visor-text';
    box.innerHTML = `
      <div class="tape-mask">
        <div class="tape">
          <article class="lead">
            <h3>From Insight to Interface</h3>
            <p>Die Vier-Phasen-Säule repräsentiert nicht nur Gestaltung</p>
            <p>sie steht für ein gestalterisches Bild, das Ihr Unternehmen festigt und gezielt voranbringt.</p>
            <p>Wir stärken Ihre Position und eröffnen Weitblick durch gezielte, präzise Analysen.</p>
            <p>Wir legen Ihr Fundament fest, formen Ihre Identität und konstruieren eine persönliche Gestaltung</p>
            <p>mit klarem Wiedererkennungswert.</p>
          </article>

          <article class="step">
            <div class="num">01.</div>
            <h4>Brand &amp; Insight</h4>
            <ul>
              <li>Zielgruppenmodelle analysieren,</li>
              <li>Marktumfelder evaluieren,</li>
              <li>Markenpositionierungen differenzieren.</li>
            </ul>
          </article>

          <article class="step">
            <div class="num">02.</div>
            <h4>Strategic Concepting</h4>
            <ul>
              <li>Positionierungsmodelle entwickeln,</li>
              <li>Kommunikationsarchitektur definieren,</li>
              <li>Designprinzipien systematisieren.</li>
            </ul>
          </article>

          <article class="step">
            <div class="num">03.</div>
            <h4>Prototype &amp; Validate</h4>
            <ul>
              <li>Interaktionsmodelle modellieren,</li>
              <li>Prototypenszenarien entwickeln,</li>
              <li>Designhypothesen überprüfen.</li>
            </ul>
          </article>

          <article class="step">
            <div class="num">04.</div>
            <h4>Interface &amp; Experience</h4>
            <ul>
              <li>User Interfaces konzipieren,</li>
              <li>Interaktionsmuster strukturieren,</li>
              <li>UI-Systeme finalisieren.</li>
            </ul>
          </article>

          <article class="final">
            <h3>Vision • Technik • Präzision • Experience</h3>
            <p>Aktuelle Vision, angewandte Technologien und Prinzipien – zusammengeführt in einer konsistenten Interface-Sprache.</p>
            <p>Saubere Systeme. Performante Oberflächen. Langlebige Designentscheidungen.</p>
            <p>Von der Analyse über das Konzept bis zur finalen UI – nahtlos umgesetzt.</p>
            <p>Elegant. Klar. Wirksam.</p>
          </article>
        </div>
      </div>
    `;
    wrap.appendChild(box);
  }

  // ------- Animation - Mask Box -------
  const wrapRect = wrap.getBoundingClientRect();
  const svgRect  = svg.getBoundingClientRect();
  const left = svgRect.left - wrapRect.left + wrap.scrollLeft;
  const top  = svgRect.top  - wrapRect.top  + wrap.scrollTop;

  Object.assign(box.style, {
    position: 'absolute',
    left:     left + 'px',
    top:      top + 'px',
    width:    svgRect.width + 'px',
    height:   svgRect.height + 'px',
    pointerEvents: 'none',
    zIndex:   3,
    clipPath: 'url(#visor-html-clip)',
    WebkitClipPath: 'url(#visor-html-clip)'
  });

  // ------- Animation - Loop -------
  const tape = box.querySelector('.tape');
  const mask = box.querySelector('.tape-mask');
  if (!tape || !mask) return;

  tape.style.animation = 'none';

  // ------- Animation - Back-to-back -------
  if (!tape.dataset.loopReady) {
    const src = tape.innerHTML.trim();
    tape.innerHTML = `<div class="tape-block">${src}</div><div class="tape-block">${src}</div>`;
    tape.dataset.loopReady = '1';

  // ------- Animation - Layout -------
    const s = document.createElement('style');
    s.textContent = `
      .visor-box .tape{ display:block; will-change:transform; }
      .visor-box .tape-block{ display:grid; gap:16px; }
    `;
    document.head.appendChild(s);
  }

  // ------- Animation - Resize -------
  if (tape._rafId) cancelAnimationFrame(tape._rafId);
  if (tape._onResize) window.removeEventListener('resize', tape._onResize);

  const block = tape.querySelector('.tape-block');
  if (!block) return;

  const DURATION = 60000; 
  let H = 0;
  let speed = 0;
  let y = 0;
  let last = 0;

  const measure = () => {
    H = block.getBoundingClientRect().height;
    speed = H / DURATION; 
  };

  const start = async () => {

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch(e){}
    }
    measure();

    y = -1;
      // ------- Animation - Raf  -------
    requestAnimationFrame(() => {
      requestAnimationFrame((t) => {
        last = t;
        const tick = (now) => {
          const dt = now - last; last = now;
          y -= speed * dt; 

          if (y <= -H) y += H;

          tape.style.transform = `translate3d(0, ${y}px, 0)`;
          tape._rafId = requestAnimationFrame(tick);
        };
        tape._rafId = requestAnimationFrame(tick);
      });
    });
  };

  tape._onResize = () => {
    const prevH = H, prevY = y;
    measure();
  // ------- Animation - Jump -------
    if (prevH > 0) y = (prevY / prevH) * H;
  };

  window.addEventListener('resize', tape._onResize, { passive:true });
  start();
}

window.addEventListener('load', mountVisorText);
window.addEventListener('resize', mountVisorText);


/* ============================================================
   SECTION 5 —  Footer - Button 
   ============================================================ */

function wireFooterUnlocks(){
  const footer = document.getElementById('footer');
  if (!footer) return;

  footer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-unlock-target]');
    if (!btn) return;

    const key = btn.getAttribute('data-unlock-target'); 
    const locked   = footer.querySelector('#' + key + '-locked');
    const unlocked = footer.querySelector('#' + key + '-unlocked');
    if (!locked || !unlocked) return;


    locked.hidden = true;
    unlocked.hidden = false;

    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-disabled', 'true'); 
  });
  // ------- Kayboard-Support - Barrierefreiheit -------
  footer.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const btn = e.target.closest('[data-unlock-target]');
    if (!btn) return;
    e.preventDefault();
    btn.click();
  });
}

document.addEventListener('DOMContentLoaded', wireFooterUnlocks);

/* ============================================================
   SECTION 6 —  Footer - Switcher 
   ============================================================ */

function applyDeviceClass(){
  const isMobile = window.innerWidth <= 768;
  document.body.classList.toggle('is-mobile',  isMobile);
  document.body.classList.toggle('is-desktop', !isMobile);
}
applyDeviceClass();
window.addEventListener('resize', applyDeviceClass, { passive: true });