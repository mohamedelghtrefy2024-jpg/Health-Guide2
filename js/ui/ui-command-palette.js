// ---- item 1: Command Palette (Ctrl+K / Cmd+K) ----
const cpOverlay = document.getElementById('commandPaletteOverlay');
const cpInput = document.getElementById('commandPaletteInput');
const cpResults = document.getElementById('commandPaletteResults');
const commandPaletteBtnEl = document.getElementById('commandPaletteBtn');
let cpActiveIndex = -1;
let cpCurrentItems = [];

function cpBuildItems(term){
  term = term.trim().toLowerCase();
  const items = [];
  if(!term){
    // بدون بحث: اعرض المفضلة أولًا كاختصار سريع، بعدين الفئات
    [...bookmarkIds].slice(0,8).forEach(id=>{
      const n = nodes.find(x=>x.id===id);
      if(n) items.push({ type:'node', node:n, meta:'⭐ مفضلة' });
    });
    CATS.forEach(cat=> items.push({ type:'cat', cat }));
    return items.slice(0,30);
  }
  if(term.startsWith('#') && term.length>1){
    const tag = term.slice(1);
    nodes.forEach(n=>{
      const tags = noteTagIndex[n.id];
      if(Array.isArray(tags) && tags.includes(tag)) items.push({ type:'node', node:n, meta:'#'+tag });
    });
    return items.slice(0,30);
  }
  CATS.forEach(cat=>{ if(cat.toLowerCase().includes(term)) items.push({ type:'cat', cat }); });
  nodes.forEach(n=>{
    if(n.name.toLowerCase().includes(term)) items.push({ type:'node', node:n, meta: n.category });
  });
  return items.slice(0,30);
}
function cpRender(){
  cpCurrentItems = cpBuildItems(cpInput.value);
  cpActiveIndex = cpCurrentItems.length ? 0 : -1;
  cpDrawResults();
}
function cpDrawResults(){
  if(!cpCurrentItems.length){
    cpResults.innerHTML = '<div class="cp-empty">مفيش نتائج — جرّب كلمة تانية، أو ابدأ بـ # للبحث في الوسوم</div>';
    return;
  }
  cpResults.innerHTML = cpCurrentItems.map((it, i)=>{
    const active = i===cpActiveIndex ? ' cp-active' : '';
    if(it.type==='cat'){
      const count = nodes.filter(n=>n.category===it.cat).length;
      return `<div class="cp-row${active}" data-idx="${i}"><span>🗂️ ${it.cat}</span><span class="cp-meta">${count} عقدة</span></div>`;
    }
    return `<div class="cp-row${active}" data-idx="${i}"><span>${getDisplayName(it.node.name)}</span><span class="cp-meta">${it.meta||''}</span></div>`;
  }).join('');
  cpResults.querySelectorAll('.cp-row').forEach(row=>{
    row.onclick = ()=> cpActivate(Number(row.dataset.idx));
  });
}
function cpActivate(idx){
  const it = cpCurrentItems[idx];
  if(!it) return;
  if(it.type==='cat'){
    activeCats = new Set([it.cat]);
    renderCatList();
    renderMainView();
  } else {
    openNode(it.node, true);
  }
  closeCommandPalette();
}
function openCommandPalette(){
  if(!cpOverlay) return;
  cpOverlay.classList.add('show');
  cpInput.value = '';
  cpRender();
  setTimeout(()=> cpInput.focus(), 30);
}
function closeCommandPalette(){
  if(cpOverlay) cpOverlay.classList.remove('show');
}
if(commandPaletteBtnEl) commandPaletteBtnEl.onclick = openCommandPalette;
if(cpOverlay) cpOverlay.onclick = (e)=>{ if(e.target===cpOverlay) closeCommandPalette(); };
if(cpInput) cpInput.addEventListener('input', cpRender);
document.addEventListener('keydown', (e)=>{
  const isMac = navigator.platform && navigator.platform.toLowerCase().includes('mac');
  const mod = isMac ? e.metaKey : e.ctrlKey;
  if(mod && (e.key==='k' || e.key==='K')){
    e.preventDefault();
    if(cpOverlay && cpOverlay.classList.contains('show')) closeCommandPalette();
    else openCommandPalette();
    return;
  }
  if(!cpOverlay || !cpOverlay.classList.contains('show')) return;
  if(e.key==='Escape'){ closeCommandPalette(); return; }
  if(e.key==='ArrowDown'){ e.preventDefault(); cpActiveIndex = Math.min(cpCurrentItems.length-1, cpActiveIndex+1); cpDrawResults(); return; }
  if(e.key==='ArrowUp'){ e.preventDefault(); cpActiveIndex = Math.max(0, cpActiveIndex-1); cpDrawResults(); return; }
  if(e.key==='Enter'){ e.preventDefault(); cpActivate(cpActiveIndex); return; }
});

