
// Minimal-Bootstrap: hängt Header/Main/Footer in index.html ein.
async function inject(selector, url, position='end'){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`${url}: ${res.status}`);
  const html = await res.text();
  const wrap = document.createElement('div');
  wrap.innerHTML = html.trim();
  const node = wrap.firstElementChild;
  if(position==='start') document.body.prepend(node);
  else document.body.appendChild(node);
}

document.addEventListener('DOMContentLoaded', async () => {
  try{
    await inject('body', "01_src/header.html", 'start');
    await inject('body', "01_src/main.html",   'end');
    await inject('body', "01_src/footer.html", 'end');
    // nach dem Einfügen von header/main/footer:
    const { initUI } = await import('./ui.js');
    initUI();
    }catch(e){
    console.error(e);
    const pre=document.createElement('pre');
    pre.style.color='#ff6b6b'; pre.style.padding='12px';
    pre.textContent=`BOOT ERROR: ${e.message}`;
    document.body.appendChild(pre);
  }
});

