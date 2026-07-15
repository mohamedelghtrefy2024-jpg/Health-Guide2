const CATS_ALL = ["المسار اللاهوتي","العصور القديمة","ما قبل الحداثة","الفاشية والنازية",
  "MK Ultra والتحكم العقلي","أجندة تخفيض السكان","عمليات مخابراتية",
  "حرب مناخية وتكنولوجية","عصر ترامب","فضائي / غامض","عقدة مركزية","بانتظار المحتوى"];

const CAT_COLORS = {
  "المسار اللاهوتي":"#c1483b", "العصور القديمة":"#d9a441", "ما قبل الحداثة":"#8a6fd1",
  "الفاشية والنازية":"#7a7f8c", "MK Ultra والتحكم العقلي":"#5fa8a0",
  "أجندة تخفيض السكان":"#4f8fd1", "عمليات مخابراتية":"#e0674f",
  "حرب مناخية وتكنولوجية":"#3fae6a", "عصر ترامب":"#e0b64f",
  "فضائي / غامض":"#4fd1c5", "عقدة مركزية":"#ffffff", "بانتظار المحتوى":"#4a4f5c"
};

const nodes = window.MAP_NODES || [];
const CATS = CATS_ALL.filter(c => nodes.some(n=>n.category===c));
const nameIndex = {};
nodes.forEach(n => { nameIndex[n.name.trim()] = n; });

function findByName(name){
  name = name.trim();
  if(nameIndex[name]) return nameIndex[name];
  // loose fallback: try matching by stripped parenthetical / substring
  const core = name.replace(/\s*\(.*?\)\s*/g,'').trim();
  for(const key in nameIndex){
    if(key.replace(/\s*\(.*?\)\s*/g,'').trim() === core) return nameIndex[key];
  }
  return null;
}

let activeCats = new Set(CATS);
let searchTerm = "";
let history = [];
let historyPos = -1;

// ---- Stage 1 / item 6: name display mode (both / ar / en) ----
// Node names in this dataset commonly follow the pattern "الاسم العربي (English Name)".
// This is a purely presentational transform -- it never touches node.name or any stored data.
let nameMode = 'both';
function getDisplayName(fullName){
  if(nameMode === 'both' || !fullName) return fullName;
  const m = fullName.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if(!m) return fullName; // no "(...)" part -- nothing to split, show as-is
  const arPart = m[1].trim(), enPart = m[2].trim();
  if(nameMode === 'ar') return arPart || fullName;
  if(nameMode === 'en') return enPart || fullName;
  return fullName;
}

const catListEl = document.getElementById('catList');
const gridEl = document.getElementById('grid');
const statTotal = document.getElementById('statTotal');
const statAdded = document.getElementById('statAdded');
const statShown = document.getElementById('statShown');

function renderCatList(){
  catListEl.innerHTML = '';
  CATS.forEach(cat=>{
    const count = nodes.filter(n=>n.category===cat).length;
    const div = document.createElement('div');
    const isActive = activeCats.has(cat) && activeCats.size < CATS.length;
    div.className = 'cat-item' + (isActive ? ' active' : '');
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-pressed', String(isActive));
    div.setAttribute('aria-label', `فلترة حسب فئة ${cat}، ${count} عقدة`);
    div.innerHTML = `<span class="dot" style="background:${CAT_COLORS[cat]||'#666'}"></span><span>${cat}</span><span class="cat-count">${count}</span><button class="cat-graph-btn" title="عرض كشبكة تفاعلية" aria-label="عرض فئة ${cat} كشبكة تفاعلية">🕸️</button>`;
    div.querySelector('span:nth-child(2)').parentElement.onclick = null;
    const activateCat = ()=>{
      if(activeCats.size===1 && activeCats.has(cat)){
        activeCats = new Set(CATS);
      } else {
        activeCats = new Set([cat]);
      }
      renderCatList(); renderMainView();
      closeAsideMenu();
    };
    div.onclick = (e)=>{
      if(e.target.classList.contains('cat-graph-btn')){
        activeCats = new Set([cat]);
        renderCatList();
        switchToView('graph');
        closeAsideMenu();
        return;
      }
      activateCat();
    };
    div.onkeydown = (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); activateCat(); }
    };
    catListEl.appendChild(div);
  });
}

const resetFilterFn = ()=>{ activeCats = new Set(CATS); renderCatList(); renderMainView(); closeAsideMenu(); };
document.getElementById('resetFilter').onclick = resetFilterFn;
document.getElementById('resetFilter').onkeydown = (e)=>{
  if(e.key==='Enter' || e.key===' '){ e.preventDefault(); resetFilterFn(); }
};

// ---- mobile aside menu (قسم 6 — responsive) ----
const menuToggle = document.getElementById('menuToggle');
const mobileAside = document.getElementById('mobileAside');
const asideOverlay = document.getElementById('asideOverlay');
function openAsideMenu(){
  mobileAside.classList.add('open');
  asideOverlay.classList.add('show');
  menuToggle.setAttribute('aria-expanded', 'true');
}
function closeAsideMenu(){
  mobileAside.classList.remove('open');
  asideOverlay.classList.remove('show');
  menuToggle.setAttribute('aria-expanded', 'false');
}
menuToggle.addEventListener('click', ()=>{
  if(mobileAside.classList.contains('open')) closeAsideMenu(); else openAsideMenu();
});
asideOverlay.addEventListener('click', closeAsideMenu);

const GRID_CHUNK_SIZE = 60;
let gridObserver = null;
let gridFiltered = [];
let gridRenderedCount = 0;

let expandedHubs = new Set();

// ---- Stage 3 / item 1: Epistemic Status Badge ----
// حقل اختياري epistemicStatus: "documented" | "theory" | "disputed" | undefined
// بدون الحقل = مفيش أي تمييز بصري إضافي (سلوك حالي زي ما هو تمامًا).
const EPISTEMIC_META = {
  documented: { label: 'موثّق', icon: '●' },
  theory:     { label: 'نظرية', icon: '┄' },
  disputed:   { label: 'مثير للجدل', icon: '⋯' }
};
function epistemicBadgeHtml(status){
  const meta = EPISTEMIC_META[status];
  if(!meta) return '';
  return `<span class="epi-badge epi-${status}" title="الحالة المعرفية: ${meta.label}">${meta.icon} ${meta.label}</span>`;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function isSafeUrl(url){
  try{
    const u = new URL(url, window.location.href);
    return u.protocol === 'http:' || u.protocol === 'https:';
  }catch(e){ return false; }
}

function computeHubChildCounts(){
  const counts = {};
  nodes.forEach(n=>{
    if(n.parentHub){
      counts[n.parentHub] = (counts[n.parentHub]||0) + 1;
    }
  });
  return counts;
}
let hubChildCounts = {};

function makeCard(n){
  const card = document.createElement('div');
  card.className = 'card' + (n.parentHub ? ' card-nested' : '') + (n.epistemicStatus ? ' epi-'+n.epistemicStatus : '');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `فتح تفاصيل عقدة ${n.name}`);
  const childCount = hubChildCounts[n.name] || 0;
  const expandBtn = childCount > 0
    ? `<button class="hub-expand-btn" data-hub="${n.name.replace(/"/g,'&quot;')}">${expandedHubs.has(n.name) ? '▾ إخفاء' : '▸ عرض'} ${childCount} عنصر</button>`
    : '';
  const nestedTag = n.parentHub ? `<div class="nested-tag">↳ فرع من: ${n.parentHub}</div>` : '';
  card.innerHTML = `
    ${n.added ? '<div class="badge-added">🆕 مضاف</div>' : ''}
    ${nestedTag}
    <div class="cname">${getDisplayName(n.name)}</div>
    <div class="cmeta">
      <span class="ccat" style="color:${CAT_COLORS[n.category]||'#888'}">${n.category}</span>
      <span class="cconn">${n.connections.length} اتصال</span>
    </div>
    ${n.epistemicStatus ? `<div style="margin-top:${'var(--space-3)'}">${epistemicBadgeHtml(n.epistemicStatus)}</div>` : ''}
    ${expandBtn}`;
  card.onclick = async (e)=>{
    if(e.target.classList.contains('hub-expand-btn')){
      const hubName = e.target.dataset.hub;
      if(expandedHubs.has(hubName)) expandedHubs.delete(hubName);
      else expandedHubs.add(hubName);
      renderGrid();
      return;
    }
    if(typeof linkSourceId !== 'undefined' && linkSourceId !== null){
      const done = await tryCompleteLink(n);
      if(done){ renderMainView(); return; }
    }
    openNode(n, true);
  };
  card.onkeydown = (e)=>{
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); card.onclick(e); }
  };
  return card;
}

function renderNextGridChunk(){
  const next = gridFiltered.slice(gridRenderedCount, gridRenderedCount + GRID_CHUNK_SIZE);
  if(next.length===0) return;
  const frag = document.createDocumentFragment();
  next.forEach(n=> frag.appendChild(makeCard(n)));
  const sentinel = document.getElementById('gridSentinel');
  gridEl.insertBefore(frag, sentinel);
  gridRenderedCount += next.length;
  if(gridRenderedCount >= gridFiltered.length && sentinel){
    sentinel.remove();
    if(gridObserver) gridObserver.disconnect();
  }
}

function naturalNumberKey(name, category){
  // Only "المسار اللاهوتي" has genuine intentional sequential numbering (1, 2, ... 13.4.1 ...).
  // Other categories may have node names that merely START with a digit (e.g. "15 Minute Cities",
  // "4th Industrial Revolution") -- those must NOT be treated as sequence numbers, or they'd
  // wrongly jump to the front of the list instead of sorting alphabetically with their peers.
  if(category !== 'المسار اللاهوتي') return null;
  const m = name.match(/^(\d+(?:\.\d+)*)/);
  if(!m) return null;
  return m[1].split('.').map(Number);
}
function compareNodesNatural(a, b){
  const ka = naturalNumberKey(a.name, a.category), kb = naturalNumberKey(b.name, b.category);
  if(ka && kb){
    for(let i=0; i<Math.max(ka.length, kb.length); i++){
      const va = ka[i] === undefined ? -1 : ka[i];
      const vb = kb[i] === undefined ? -1 : kb[i];
      if(va !== vb) return va - vb;
    }
    return 0;
  }
  if(ka && !kb) return -1;
  if(!ka && kb) return 1;
  return a.name.localeCompare(b.name, 'ar');
}

function compareNodesForGrid(a, b){
  const catIndex = window._catIndexCache || (window._catIndexCache = Object.fromEntries(CATS_ALL.map((c,i)=>[c,i])));
  const ca = catIndex[a.category] ?? 999, cb = catIndex[b.category] ?? 999;
  if(ca !== cb) return ca - cb;
  return compareNodesNatural(a, b);
}

// دعم البحث بالوسم: لو الكلمة تبدأ بـ "#"، يتحول البحث لمطابقة فهرس الوسوم (noteTagIndex) بدل اسم العقدة
function matchesSearchTerm(n, term){
  if(!term) return true;
  if(term.startsWith('#') && term.length > 1){
    const tag = term.slice(1);
    const tags = noteTagIndex[n.id];
    return Array.isArray(tags) && tags.includes(tag);
  }
  return n.name.toLowerCase().includes(term);
}

function renderGrid(){
  const term = searchTerm.trim().toLowerCase();
  gridFiltered = nodes.filter(n=>{
    if(!activeCats.has(n.category)) return false;
    if(term && !matchesSearchTerm(n, term)) return false;
    // hide nested children unless the search matches them directly, or their hub is expanded
    if(n.parentHub && !term && !expandedHubs.has(n.parentHub)) return false;
    return true;
  });
  gridFiltered.sort(compareNodesForGrid);
  gridRenderedCount = 0;
  statShown.textContent = gridFiltered.length;
  gridEl.innerHTML = '';
  if(gridObserver){ gridObserver.disconnect(); gridObserver = null; }
  if(gridFiltered.length===0){
    gridEl.innerHTML = '<div class="empty">مفيش نتائج مطابقة — جرّب كلمة بحث تانية أو غيّر الفئة</div>';
    return;
  }
  const sentinel = document.createElement('div');
  sentinel.id = 'gridSentinel';
  sentinel.style.cssText = 'grid-column:1/-1; height:1px;';
  gridEl.appendChild(sentinel);
  renderNextGridChunk();
  if(gridFiltered.length > GRID_CHUNK_SIZE){
    gridObserver = new IntersectionObserver((entries)=>{
      if(entries.some(e=>e.isIntersecting)) renderNextGridChunk();
    }, { root: null, rootMargin: '400px' });
    gridObserver.observe(sentinel);
  }
}

let searchDebounceTimer = null;
document.getElementById('search').addEventListener('input', (e)=>{
  const val = e.target.value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(()=>{
    searchTerm = val;
    renderMainView();
  }, 200);
});

// ---- Drawer / detail panel ----
const overlay = document.getElementById('overlay');
const drawer = document.getElementById('drawer');
const dCat = document.getElementById('dCat');
const dName = document.getElementById('dName');
const dConns = document.getElementById('dConns');
const connLabel = document.getElementById('connLabel');
const notesEl = document.getElementById('notes');
const saveState = document.getElementById('saveState');
const breadcrumbsEl = document.getElementById('breadcrumbs');
const sourcesLabel = document.getElementById('sourcesLabel');
const dSources = document.getElementById('dSources');
const sourcesAddRow = document.getElementById('sourcesAddRow');
const newSourceLabel = document.getElementById('newSourceLabel');
const newSourceUrl = document.getElementById('newSourceUrl');
const addSourceBtn = document.getElementById('addSourceBtn');
const hubSummaryLabel = document.getElementById('hubSummaryLabel');
const hubSummaryView = document.getElementById('hubSummaryView');
const hubSummaryEditRow = document.getElementById('hubSummaryEditRow');
const hubSummaryInput = document.getElementById('hubSummaryInput');
const saveHubSummaryBtn = document.getElementById('saveHubSummaryBtn');
const noteTagsLabel = document.getElementById('noteTagsLabel');
const noteTagsRow = document.getElementById('noteTagsRow');

let currentNode = null;
let saveTimer = null;

function openNode(node, pushHistory){
  currentNode = node;
  if(pushHistory){
    history = history.slice(0, historyPos+1);
    history.push(node.id);
    historyPos = history.length - 1;
  }
  updateNavButtons();
  dCat.innerHTML = node.category + (node.epistemicStatus ? epistemicBadgeHtml(node.epistemicStatus) : '');
  dCat.style.color = CAT_COLORS[node.category] || '#8b909c';
  dName.textContent = getDisplayName(node.name);
  if(typeof editMode !== 'undefined' && editMode){
    moveRow.style.display = 'block';
    linkBtn.style.display = 'inline-block';
    sourcesAddRow.style.display = 'flex';
    moveCatSelect.value = node.category;
  } else if(typeof moveRow !== 'undefined'){
    moveRow.style.display = 'none';
    linkBtn.style.display = 'none';
    sourcesAddRow.style.display = 'none';
  }
  if(typeof tabEdit !== 'undefined'){
    tabEdit.click();
  }
  connLabel.textContent = `الاتصالات (${node.connections.length})`;
  dConns.innerHTML = '';
  if(node.connections.length===0){
    dConns.innerHTML = '<span style="color:var(--muted); font-size:12px;">لا توجد اتصالات معلنة بعد</span>';
  }
  node.connections.forEach(cname=>{
    const target = findByName(cname);
    const chip = document.createElement('div');
    chip.className = 'conn-chip' + (target ? '' : ' stub');
    chip.textContent = getDisplayName(cname);
    if(target){
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-label', `الانتقال إلى عقدة ${cname}`);
      chip.onclick = ()=> openNode(target, true);
      chip.onkeydown = (e)=>{
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openNode(target, true); }
      };
    } else {
      chip.setAttribute('aria-disabled', 'true');
    }
    dConns.appendChild(chip);
  });
  renderSources(node);
  renderHubSummary(node);
  loadNotes(node.id);
  renderNoteTags(node);
  renderBreadcrumbs();
  overlay.style.display = 'block';
  drawer.classList.add('open');
}

function closeDrawer(){
  overlay.style.display = 'none';
  drawer.classList.remove('open');
}

// ---- Stage 3 / item 2: Sources (sources: [{label, url}]) ----
function renderSources(node){
  const list = Array.isArray(node.sources) ? node.sources : [];
  sourcesLabel.style.display = list.length ? 'block' : 'none';
  dSources.innerHTML = '';
  list.forEach((s, idx)=>{
    const row = document.createElement('div');
    row.className = 'source-row';
    const safeUrl = isSafeUrl(s.url) ? s.url : '#';
    row.innerHTML = `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label || s.url)}</a>` +
      ((typeof editMode !== 'undefined' && editMode) ? `<button class="source-remove-btn" data-idx="${idx}" title="حذف المصدر">×</button>` : '');
    dSources.appendChild(row);
  });
  dSources.querySelectorAll('.source-remove-btn').forEach(btn=>{
    btn.onclick = async ()=>{
      const idx = Number(btn.dataset.idx);
      node.sources.splice(idx, 1);
      await saveSourcesOverride(node.id, node.sources);
      renderSources(node);
    };
  });
}

addSourceBtn.onclick = async ()=>{
  if(!currentNode) return;
  const label = newSourceLabel.value.trim();
  const url = newSourceUrl.value.trim();
  if(!url || !isSafeUrl(url)){
    newSourceUrl.style.borderColor = 'var(--accent)';
    return;
  }
  newSourceUrl.style.borderColor = '';
  if(!Array.isArray(currentNode.sources)) currentNode.sources = [];
  currentNode.sources.push({ label: label || url, url });
  await saveSourcesOverride(currentNode.id, currentNode.sources);
  newSourceLabel.value = '';
  newSourceUrl.value = '';
  renderSources(currentNode);
};
// ---- Stage 3 / item 4: Hub Summary (hubSummary: string, optional, hubs only) ----
function renderHubSummary(node){
  const childCount = hubChildCounts[node.name] || 0;
  const isHub = childCount > 0;
  const inEdit = typeof editMode !== 'undefined' && editMode;
  if(!isHub){
    hubSummaryLabel.style.display = 'none';
    hubSummaryView.style.display = 'none';
    hubSummaryEditRow.style.display = 'none';
    return;
  }
  const summary = node.hubSummary || '';
  hubSummaryLabel.style.display = (summary || inEdit) ? 'block' : 'none';
  hubSummaryView.style.display = summary ? 'block' : 'none';
  hubSummaryView.textContent = summary;
  hubSummaryEditRow.style.display = inEdit ? 'flex' : 'none';
  if(inEdit) hubSummaryInput.value = summary;
}
saveHubSummaryBtn.onclick = async ()=>{
  if(!currentNode) return;
  const text = hubSummaryInput.value.trim();
  currentNode.hubSummary = text;
  await saveHubSummaryOverride(currentNode.id, text);
  renderHubSummary(currentNode);
};

// ---- Stage 3 / item 3: Tags on notes (#tag inside markdown notes) ----
// noteTagIndex: { nodeId: ["tag1","tag2", ...] } — فهرسة بسيطة تُحدَّث عند كل حفظ ملاحظة، وتُستخدم للبحث عبر "#tag"
let noteTagIndex = {};
const TAG_REGEX = /#([\w\u0600-\u06FF]{2,30})/g;
function extractTags(text){
  const found = new Set();
  let m;
  TAG_REGEX.lastIndex = 0;
  while((m = TAG_REGEX.exec(text || '')) !== null){
    found.add(m[1]);
  }
  return Array.from(found);
}
function renderNoteTags(node){
  const tags = noteTagIndex[node.id] || [];
  noteTagsLabel.style.display = tags.length ? 'block' : 'none';
  noteTagsRow.innerHTML = '';
  tags.forEach(tag=>{
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = '#' + tag;
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.onclick = ()=>{
      closeDrawer();
      const searchInput = document.getElementById('search');
      searchInput.value = '#' + tag;
      searchTerm = '#' + tag;
      renderMainView();
    };
    noteTagsRow.appendChild(chip);
  });
}
document.getElementById('closeDrawer').onclick = closeDrawer;
overlay.onclick = closeDrawer;
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    if(drawer.classList.contains('reading-mode')){ drawer.classList.remove('reading-mode'); return; }
    if(drawer.classList.contains('open')) closeDrawer();
    if(mobileAside.classList.contains('open')) closeAsideMenu();
  }
});

function renderBreadcrumbs(){
  breadcrumbsEl.innerHTML = 'المسار: ';
  const trail = history.slice(Math.max(0, historyPos-4), historyPos+1);
  trail.forEach((id, i)=>{
    const n = nodes.find(x=>x.id===id);
    if(!n) return;
    const span = document.createElement('span');
    const dn = getDisplayName(n.name);
    span.textContent = dn.length > 20 ? dn.slice(0,20)+'…' : dn;
    span.setAttribute('role', 'button');
    span.setAttribute('tabindex', '0');
    span.setAttribute('aria-label', `الانتقال إلى ${n.name} في المسار`);
    const goTo = ()=>{ historyPos = history.indexOf(id); openNode(n, false); };
    span.onclick = goTo;
    span.onkeydown = (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); goTo(); }
    };
    breadcrumbsEl.appendChild(span);
    if(i < trail.length-1) breadcrumbsEl.appendChild(document.createTextNode('  ←  '));
  });
}

function updateNavButtons(){
  document.getElementById('backBtn').disabled = historyPos <= 0;
  document.getElementById('fwdBtn').disabled = historyPos >= history.length - 1;
}
document.getElementById('backBtn').onclick = ()=>{
  if(historyPos>0){ historyPos--; openNode(nodes.find(n=>n.id===history[historyPos]), false); }
};
document.getElementById('fwdBtn').onclick = ()=>{
  if(historyPos < history.length-1){ historyPos++; openNode(nodes.find(n=>n.id===history[historyPos]), false); }
};

// ---- IndexedDB layer (يعمل مستقلًا في أي متصفح، بدون الاعتماد على بيئة استضافة خاصة) ----
const DB_NAME = 'deepmap_db';
const DB_VERSION = 1;
const STORE_NAME = 'notes';
let dbPromise = null;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject)=>{
    if(!('indexedDB' in window)){ reject(new Error('IndexedDB غير مدعوم في هذا المتصفح')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains(STORE_NAME)){
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e)=> resolve(e.target.result);
    req.onerror = (e)=> reject(e.target.error);
  });
  return dbPromise;
}

async function idbGetNote(id){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = ()=> resolve(req.result ? req.result.value : '');
    req.onerror = ()=> reject(req.error);
  });
}

async function idbSetNote(id, value){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, value });
    tx.oncomplete = ()=> resolve(true);
    tx.onerror = ()=> reject(tx.error);
  });
}

// محاولة ترحيل تلقائي لأي ملاحظات محفوظة سابقًا عبر window.storage (لو الملف اتفتح في بيئة كانت تدعمه)
async function migrateLegacyNoteIfNeeded(id){
  if(!window.storage || typeof window.storage.get !== 'function') return null;
  try{
    const legacy = await window.storage.get(`note:${id}`);
    if(legacy && legacy.value){
      await idbSetNote(id, legacy.value);
      return legacy.value;
    }
  }catch(e){ /* لا يوجد سجل قديم أو البيئة لا تدعمه — تجاهل بصمت */ }
  return null;
}

// ---- notes persistence ----
async function loadNotes(id){
  notesEl.value = '';
  saveState.textContent = '';
  try{
    let value = await idbGetNote(id);
    if(!value){
      const migrated = await migrateLegacyNoteIfNeeded(id);
      if(migrated) value = migrated;
    }
    notesEl.value = value || '';
  }catch(e){
    notesEl.value = '';
    saveState.textContent = 'تعذّر تحميل الملاحظات (IndexedDB غير متاح)';
  }
}

notesEl.addEventListener('input', ()=>{
  saveState.textContent = 'جارٍ الحفظ…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async ()=>{
    if(!currentNode) return;
    try{
      await idbSetNote(currentNode.id, notesEl.value);
      const tags = extractTags(notesEl.value);
      await saveNoteTagIndexEntry(currentNode.id, tags);
      renderNoteTags(currentNode);
      saveState.textContent = 'تم الحفظ ✓  ' + new Date().toLocaleTimeString('ar-EG');
    }catch(e){
      saveState.textContent = 'تعذّر الحفظ — حاول تاني';
    }
  }, 500);
});

// ---- graph view (الآن الشاشة الرئيسية — قسم 2) ----
const graphOverlay = document.getElementById('graphOverlay');
const graphTitle = document.getElementById('graphTitle');
const graphSub = document.getElementById('graphSub');
const showGraphBtn = document.getElementById('showGraphBtn');
const showGridBtn = document.getElementById('showGridBtn');

const SAFETY_CAP = 550; // absolute ceiling to keep the browser responsive

let currentView = 'grid';

function switchToView(view){
  currentView = view;
  const isGraph = view === 'graph';
  const outgoing = isGraph ? gridEl : graphOverlay;
  const incoming = isGraph ? graphOverlay : gridEl;

  outgoing.classList.add('view-fade');
  setTimeout(()=>{
    graphOverlay.classList.toggle('active', isGraph);
    gridEl.style.display = isGraph ? 'none' : 'grid';
    showGraphBtn.classList.toggle('active', isGraph);
    showGraphBtn.setAttribute('aria-pressed', String(isGraph));
    showGridBtn.classList.toggle('active', !isGraph);
    showGridBtn.setAttribute('aria-pressed', String(!isGraph));
    incoming.classList.add('view-fade');
    renderMainView();
    // next frame: fade the incoming view in
    requestAnimationFrame(()=> requestAnimationFrame(()=> incoming.classList.remove('view-fade')));
  }, 120);
}

function renderMainView(){
  if(currentView === 'graph') showGraphView();
  else renderGrid();
}

showGraphBtn.onclick = ()=> switchToView('graph');
showGridBtn.onclick = ()=> switchToView('grid');

// يبني مجموعة العقد/الروابط المطابقة للفلتر الحالي (الفئات + البحث)، مع عقد "جسر" للسياق
function computeGraphDataset(){
  const term = searchTerm.trim().toLowerCase();
  let primaryNodes = nodes.filter(n=>{
    if(!activeCats.has(n.category)) return false;
    if(term && !matchesSearchTerm(n, term)) return false;
    return true;
  });
  const totalMatched = primaryNodes.length;
  let trimmedByImportance = false;

  // لو مجموعة العقد الأساسية نفسها ضخمة (مثلًا كل الفئات بدون بحث) — نعرض الأهم فقط حسب عدد الاتصالات
  if(primaryNodes.length > SAFETY_CAP){
    primaryNodes = [...primaryNodes].sort((a,b)=> b.connections.length - a.connections.length).slice(0, SAFETY_CAP);
    trimmedByImportance = true;
  }

  const primaryIds = new Set(primaryNodes.map(n=>n.id));
  const bridgeMap = new Map();
  const links = [];
  const linkKeys = new Set();

  function addLink(aId, bId){
    if(aId === bId) return;
    const k = aId < bId ? aId+'_'+bId : bId+'_'+aId;
    if(linkKeys.has(k)) return;
    linkKeys.add(k);
    links.push({source:aId, target:bId});
  }

  primaryNodes.forEach(n=>{
    n.connections.forEach(cname=>{
      const t = findByName(cname);
      if(t){
        addLink(n.id, t.id);
        if(!primaryIds.has(t.id)) bridgeMap.set(t.id, t);
      }
    });
  });
  nodes.forEach(n=>{
    if(primaryIds.has(n.id)) return;
    n.connections.forEach(cname=>{
      const t = findByName(cname);
      if(t && primaryIds.has(t.id)){
        addLink(n.id, t.id);
        bridgeMap.set(n.id, n);
      }
    });
  });

  let bridgeNodes = [...bridgeMap.values()];
  let graphNodes = [...primaryNodes, ...bridgeNodes];

  if(graphNodes.length > SAFETY_CAP){
    bridgeNodes.sort((a,b)=> b.connections.length - a.connections.length);
    bridgeNodes = bridgeNodes.slice(0, Math.max(0, SAFETY_CAP - primaryNodes.length));
    graphNodes = [...primaryNodes, ...bridgeNodes];
  }
  const keptIds = new Set(graphNodes.map(n=>n.id));
  const keptLinks = links.filter(l=> keptIds.has(l.source) && keptIds.has(l.target));

  return { graphNodes, keptLinks, primaryIds, primaryCount: primaryNodes.length, bridgeCount: bridgeNodes.length, totalMatched, trimmedByImportance };
}

let resizeGraphTimer = null;
function showGraphView(){
  const { graphNodes, keptLinks, primaryIds, primaryCount, bridgeCount, totalMatched, trimmedByImportance } = computeGraphDataset();
  statShown.textContent = totalMatched;

  const catsLabel = activeCats.size === CATS.length ? 'كل الفئات' : [...activeCats].join('، ');
  graphTitle.textContent = `🕸️ ${catsLabel}`;
  let subText = `${primaryCount} عقدة أساسية + ${bridgeCount} عقدة جسر · ${keptLinks.length} رابط`;
  if(trimmedByImportance) subText += ` — بيعرض أهم ${SAFETY_CAP} عقدة من إجمالي ${totalMatched} (حسب عدد الاتصالات)، ضيّق البحث أو الفئة لرؤية التفاصيل كاملة`;
  graphSub.textContent = subText;

  if(graphNodes.length === 0){
    d3.select('#graphSvg').selectAll('*').remove();
    d3.select('#miniMapSvg').selectAll('*').remove();
    graphSub.textContent = 'مفيش نتائج مطابقة للفلتر الحالي';
    return;
  }
  renderForceGraph(graphNodes, keptLinks, primaryIds);
}

window.addEventListener('resize', ()=>{
  clearTimeout(resizeGraphTimer);
  resizeGraphTimer = setTimeout(()=>{
    if(currentView === 'graph') showGraphView();
  }, 350);
});

function renderForceGraph(gNodes, gLinks, primaryIds){
  const svg = d3.select('#graphSvg');
  svg.selectAll('*').remove();
  const wrap = document.getElementById('graphSvgWrap');
  const width = wrap.clientWidth, height = wrap.clientHeight;
  svg.attr('viewBox', [0,0,width,height]);

  const zoomLayer = svg.append('g');
  let onZoomExtra = ()=>{};
  const zoomBehavior = d3.zoom().scaleExtent([0.08, 6]).on('zoom', (event)=>{
    zoomLayer.attr('transform', event.transform);
    onZoomExtra(event.transform);
  });
  svg.call(zoomBehavior);

  const nodesCopy = gNodes.map(n=>({...n, isBridge: !primaryIds.has(n.id)}));
  const linksCopy = gLinks.map(l=>({...l}));

  const maxConn = Math.max(1, ...nodesCopy.map(d=>d.connections.length));
  const isHub = d => !d.isBridge && d.connections.length >= Math.max(3, maxConn*0.3);

  const sim = d3.forceSimulation(nodesCopy)
    .force('link', d3.forceLink(linksCopy).id(d=>d.id)
      .distance(d => (d.source.isBridge || d.target.isBridge) ? 130 : 85)
      .strength(0.55))
    .force('charge', d3.forceManyBody().strength(d=> d.isBridge ? -180 : -260))
    .force('center', d3.forceCenter(width/2, height/2))
    .force('collide', d3.forceCollide().radius(d=> (d.isBridge?10:16) + Math.min(d.connections.length,20)*1.2).strength(0.9))
    .force('x', d3.forceX(width/2).strength(0.02))
    .force('y', d3.forceY(height/2).strength(0.02))
    .stop();

  const ticks = Math.min(500, Math.max(150, nodesCopy.length * 1.5));
  for(let i=0;i<ticks;i++) sim.tick();

  const link = zoomLayer.append('g').selectAll('line')
    .data(linksCopy).join('line')
    .attr('class', 'glink')
    .attr('stroke-dasharray', d => (d.source.isBridge || d.target.isBridge) ? '3,3' : null)
    .attr('opacity', d => (d.source.isBridge || d.target.isBridge) ? 0.45 : 0.9);

  const gnode = zoomLayer.append('g').selectAll('g')
    .data(nodesCopy).join('g').attr('class', 'gnode')
    .attr('transform', d=>`translate(${d.x},${d.y})`)
    .call(d3.drag()
      .on('start', (event,d)=>{ if(!event.active) sim.alphaTarget(0.25).restart(); d.fx=d.x; d.fy=d.y; })
      .on('drag', (event,d)=>{ d.fx=event.x; d.fy=event.y; })
      .on('end', (event,d)=>{ if(!event.active) sim.alphaTarget(0); d.fx=null; d.fy=null; }));

  gnode.append('circle')
    .attr('r', d=> (d.isBridge ? 4 : 6) + Math.min(d.connections.length, 20)*(d.isBridge?0.5:0.9))
    .attr('fill', d=> d.added ? '#d9a441' : (CAT_COLORS[d.category] || '#5fa8a0'))
    .attr('opacity', d=> d.isBridge ? 0.5 : (isHub(d) ? 1 : 0.85))
    .attr('stroke-dasharray', d=> d.isBridge ? '2,2' : null);

  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0c0e13';
  const labels = gnode.append('text')
    .attr('x', d=> 7 + Math.min(d.connections.length,20)*0.8)
    .attr('y', 4)
    .attr('paint-order', 'stroke')
    .attr('stroke', bgColor).attr('stroke-width', 3)
    .text(d=> { const dn = getDisplayName(d.name); return dn.length > 24 ? dn.slice(0,24)+'…' : dn; })
    .style('opacity', d => isHub(d) ? 1 : 0)
    .style('font-weight', d => isHub(d) ? '700' : '400')
    .style('fill', d => d.isBridge ? 'var(--muted)' : 'var(--text)');

  // ---- Stage 1 / items 2+3: real spotlight (dim non-neighbors) + hover card ----
  const hoverCard = document.getElementById('nodeHoverCard');
  const svgWrapEl = document.getElementById('graphSvgWrap');

  function neighborIdsOf(nodeId){
    const set = new Set([nodeId]);
    linksCopy.forEach(l=>{
      const sId = (l.source && l.source.id !== undefined) ? l.source.id : l.source;
      const tId = (l.target && l.target.id !== undefined) ? l.target.id : l.target;
      if(sId === nodeId) set.add(tId);
      if(tId === nodeId) set.add(sId);
    });
    return set;
  }

  gnode.on('mouseenter', function(event,d){
    d3.select(this).select('text').style('opacity', 1);
    d3.select(this).select('circle').attr('stroke', 'var(--accent-2)').attr('stroke-width', 2.5);

    const neighbors = neighborIdsOf(d.id);
    gnode.classed('dimmed', o => !neighbors.has(o.id));
    link.classed('dimmed', l=>{
      const sId = (l.source && l.source.id !== undefined) ? l.source.id : l.source;
      const tId = (l.target && l.target.id !== undefined) ? l.target.id : l.target;
      return sId !== d.id && tId !== d.id;
    });

    if(hoverCard){
      const full = nodes.find(x=>x.id===d.id) || d;
      hoverCard.innerHTML = `<div class="hc-name">${getDisplayName(full.name)}</div>` +
        `<div class="hc-meta">${full.category} · ${full.connections.length} اتصال</div>` +
        `<div class="hc-cta">انقر للاستكشاف</div>`;
      hoverCard.style.display = 'block';
      const wrapRect = svgWrapEl.getBoundingClientRect();
      const left = Math.min(event.clientX - wrapRect.left + 14, wrapRect.width - 230);
      const top = Math.min(event.clientY - wrapRect.top + 14, wrapRect.height - 80);
      hoverCard.style.left = Math.max(6, left) + 'px';
      hoverCard.style.top = Math.max(6, top) + 'px';
    }
  }).on('mousemove', function(event,d){
    if(!hoverCard || hoverCard.style.display !== 'block') return;
    const wrapRect = svgWrapEl.getBoundingClientRect();
    const left = Math.min(event.clientX - wrapRect.left + 14, wrapRect.width - 230);
    const top = Math.min(event.clientY - wrapRect.top + 14, wrapRect.height - 80);
    hoverCard.style.left = Math.max(6, left) + 'px';
    hoverCard.style.top = Math.max(6, top) + 'px';
  }).on('mouseleave', function(event,d){
    d3.select(this).select('text').style('opacity', isHub(d) ? 1 : 0);
    d3.select(this).select('circle').attr('stroke', bgColor).attr('stroke-width', 1.5);
    gnode.classed('dimmed', false);
    link.classed('dimmed', false);
    if(hoverCard) hoverCard.style.display = 'none';
  });

  gnode.on('click', async (event,d)=>{
    const full = nodes.find(x=>x.id===d.id);
    if(typeof linkSourceId !== 'undefined' && linkSourceId !== null){
      const done = await tryCompleteLink(full);
      if(done) return;
    }
    openNode(full, true);
  });

  sim.on('tick', ()=>{
    link.attr('x1', d=>d.source.x).attr('y1', d=>d.source.y)
        .attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);
    gnode.attr('transform', d=>`translate(${d.x},${d.y})`);
  });
  link.attr('x1', d=>d.source.x).attr('y1', d=>d.source.y)
      .attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);

  // ---- Node Clustering (يظهر عند التصغير الشديد لمنع الازدحام البصري — قسم 3) ----
  const CLUSTER_ZOOM_THRESHOLD = 0.35;
  const clusterLayer = zoomLayer.append('g').attr('class', 'cluster-layer').style('display', 'none');

  function computeClusters(k){
    const cellSize = 90 / k;
    const buckets = new Map();
    nodesCopy.forEach(d=>{
      const gx = Math.floor(d.x / cellSize), gy = Math.floor(d.y / cellSize);
      const key = gx + '_' + gy;
      if(!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(d);
    });
    return [...buckets.entries()].map(([key, members])=>({
      key,
      x: members.reduce((s,m)=>s+m.x,0)/members.length,
      y: members.reduce((s,m)=>s+m.y,0)/members.length,
      count: members.length
    }));
  }

  function renderClusters(k){
    const clusters = computeClusters(k);
    const sel = clusterLayer.selectAll('g.cluster-node').data(clusters, d=>d.key);
    sel.exit().remove();
    const enter = sel.enter().append('g').attr('class', 'cluster-node');
    enter.append('circle');
    enter.append('text');
    const merged = enter.merge(sel);
    merged.attr('transform', d=>`translate(${d.x},${d.y})`);
    merged.select('circle')
      .attr('r', d=> Math.min(28, 8 + Math.sqrt(d.count)*4))
      .attr('fill', 'var(--accent-2)')
      .attr('opacity', 0.85);
    merged.select('text')
      .attr('y', 4)
      .text(d=> d.count > 1 ? d.count : '');
    merged.on('click', (event, d)=>{
      const targetK = Math.min(2.2, CLUSTER_ZOOM_THRESHOLD * 1.8);
      const newTransform = d3.zoomIdentity.translate(width/2 - targetK*d.x, height/2 - targetK*d.y).scale(targetK);
      svg.transition().duration(400).call(zoomBehavior.transform, newTransform);
    });
  }

  function updateClusterVisibility(transform){
    if(transform.k < CLUSTER_ZOOM_THRESHOLD){
      link.style('display', 'none');
      gnode.style('display', 'none');
      clusterLayer.style('display', null);
      renderClusters(transform.k);
    } else {
      link.style('display', null);
      gnode.style('display', null);
      clusterLayer.style('display', 'none');
    }
  }

  const xs = nodesCopy.map(d=>d.x), ys = nodesCopy.map(d=>d.y);
  const minX = Math.min(...xs)-40, maxX = Math.max(...xs)+40;
  const minY = Math.min(...ys)-40, maxY = Math.max(...ys)+40;
  const bw = maxX-minX, bh = maxY-minY;
  const scale = Math.min(2.2, 0.92 / Math.max(bw/width, bh/height, 0.001));
  const tx = width/2 - scale*(minX+maxX)/2;
  const ty = height/2 - scale*(minY+maxY)/2;

  // ---- Mini Map (قسم 3) ----
  const miniSvg = d3.select('#miniMapSvg');
  miniSvg.selectAll('*').remove();
  const miniW = 160, miniH = 120, miniPad = 8;
  const miniScale = Math.min((miniW - miniPad*2) / Math.max(bw,1), (miniH - miniPad*2) / Math.max(bh,1));
  miniSvg.attr('viewBox', [0,0,miniW,miniH]);
  miniSvg.append('g').selectAll('circle')
    .data(nodesCopy).join('circle')
    .attr('cx', d=> miniPad + (d.x - minX)*miniScale)
    .attr('cy', d=> miniPad + (d.y - minY)*miniScale)
    .attr('r', 1.4)
    .attr('fill', d=> d.isBridge ? 'var(--muted)' : (CAT_COLORS[d.category] || 'var(--accent-2)'));
  const viewportRect = miniSvg.append('rect').attr('class', 'minimap-viewport');

  function updateMinimapViewport(transform){
    const x0 = (0 - transform.x) / transform.k, x1 = (width - transform.x) / transform.k;
    const y0 = (0 - transform.y) / transform.k, y1 = (height - transform.y) / transform.k;
    viewportRect
      .attr('x', miniPad + (x0 - minX)*miniScale)
      .attr('y', miniPad + (y0 - minY)*miniScale)
      .attr('width', Math.max(2, (x1-x0)*miniScale))
      .attr('height', Math.max(2, (y1-y0)*miniScale));
  }

  miniSvg.on('click', (event)=>{
    const [mx, my] = d3.pointer(event);
    const dataX = minX + (mx - miniPad) / miniScale;
    const dataY = minY + (my - miniPad) / miniScale;
    const k = d3.zoomTransform(svg.node()).k;
    const newTransform = d3.zoomIdentity.translate(width/2 - k*dataX, height/2 - k*dataY).scale(k);
    svg.transition().duration(300).call(zoomBehavior.transform, newTransform);
  });

  onZoomExtra = (transform)=>{
    updateClusterVisibility(transform);
    updateMinimapViewport(transform);
  };

  svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(tx,ty).scale(scale));
}


// ============ Stage 2: features derived from existing `connections` (zero data-structure change) ============
// كل الدوال دي بتُحسب runtime من node.connections الموجودة فعلاً. مفيش أي حقل جديد على العقدة.

// ---- adjacency cache (id -> Set(neighbor ids)), مبني على الروابط القابلة للحل فقط ----
let _adjacencyCache = null;
function getAdjacency(){
  if(_adjacencyCache) return _adjacencyCache;
  const adj = new Map();
  nodes.forEach(n=> adj.set(n.id, new Set()));
  nodes.forEach(n=>{
    n.connections.forEach(cname=>{
      const t = findByName(cname);
      if(t){ adj.get(n.id).add(t.id); adj.get(t.id).add(n.id); }
    });
  });
  _adjacencyCache = adj;
  return adj;
}
function invalidateAdjacencyCache(){ _adjacencyCache = null; }

// ---- item 1 & 3: العقد المشتركة بين عقدتين (common neighbors) ----
function getCommonNeighbors(idA, idB){
  const adj = getAdjacency();
  const a = adj.get(idA), b = adj.get(idB);
  if(!a || !b) return [];
  const commonIds = [...a].filter(id=> b.has(id) && id!==idA && id!==idB);
  return commonIds.map(id=> nodes.find(n=>n.id===id)).filter(Boolean);
}

// ---- item 2: أقصر مسار بين عقدتين (BFS غير موزون) ----
function shortestPath(idA, idB){
  if(idA === idB) return [idA];
  const adj = getAdjacency();
  if(!adj.has(idA) || !adj.has(idB)) return null;
  const visited = new Set([idA]);
  const prev = new Map();
  const queue = [idA];
  let qi = 0;
  while(qi < queue.length){
    const cur = queue[qi++];
    if(cur === idB) break;
    for(const nb of adj.get(cur)){
      if(!visited.has(nb)){
        visited.add(nb);
        prev.set(nb, cur);
        queue.push(nb);
      }
    }
  }
  if(!visited.has(idB)) return null;
  const path = [idB];
  let cur = idB;
  while(cur !== idA){ cur = prev.get(cur); path.push(cur); }
  path.reverse();
  return path.map(id=> nodes.find(n=>n.id===id)).filter(Boolean);
}

// ---- item 4: العقد اليتيمة (روابطها القابلة للحل ≤ حد معين) ----
function findOrphans(maxConnections){
  const adj = getAdjacency();
  return nodes.filter(n=> adj.get(n.id).size <= maxConnections);
}

// ---- item 5: Graph Metrics / Centrality (بديل عن الاعتماد على عدد الروابط الخام فقط) ----
function computeDegreeCentrality(){
  const adj = getAdjacency();
  const N = nodes.length;
  const map = new Map();
  nodes.forEach(n=> map.set(n.id, N>1 ? adj.get(n.id).size/(N-1) : 0));
  return map;
}
// Betweenness centrality (خوارزمية Brandes، O(V·E))، بتدي ترتيب "أهمية" مختلف عن مجرد عدد الاتصالات
// (عقدة ممكن يكون عندها اتصالات قليلة لكنها جسر أساسي بين تجمعين مختلفين).
function computeBetweennessCentrality(){
  const N = nodes.length;
  const idxOf = new Map(nodes.map((n,i)=>[n.id,i]));
  const adj = getAdjacency();
  const adjIdx = nodes.map(n=> [...adj.get(n.id)].map(id=> idxOf.get(id)));
  const CB = new Float64Array(N);
  for(let s=0; s<N; s++){
    const stack = [];
    const P = Array.from({length:N}, ()=>[]);
    const sigma = new Float64Array(N); sigma[s]=1;
    const d = new Int32Array(N).fill(-1); d[s]=0;
    const queue = [s]; let qi=0;
    while(qi < queue.length){
      const v = queue[qi++];
      stack.push(v);
      const neigh = adjIdx[v];
      for(let k=0;k<neigh.length;k++){
        const w = neigh[k];
        if(d[w] < 0){ queue.push(w); d[w] = d[v]+1; }
        if(d[w] === d[v]+1){ sigma[w] += sigma[v]; P[w].push(v); }
      }
    }
    const delta = new Float64Array(N);
    while(stack.length){
      const w = stack.pop();
      const preds = P[w];
      for(let k=0;k<preds.length;k++){
        const v = preds[k];
        delta[v] += (sigma[v]/sigma[w]) * (1+delta[w]);
      }
      if(w !== s) CB[w] += delta[w];
    }
  }
  const map = new Map();
  nodes.forEach((n,i)=> map.set(n.id, CB[i]/2)); // /2 لأن الجراف غير موجّه
  return map;
}

// ---- item 7: اقتراح روابط ناقصة (Jaccard Similarity عبر جيران الدرجة الثانية — اقتراح فقط، بدون إضافة تلقائية) ----
function suggestMissingLinks(maxResults){
  maxResults = maxResults || 30;
  const adj = getAdjacency();
  const scores = new Map();
  nodes.forEach(n=>{
    const neighborsA = adj.get(n.id);
    if(neighborsA.size === 0) return;
    const candidateIds = new Set();
    neighborsA.forEach(nb=>{
      adj.get(nb).forEach(cand=>{
        if(cand !== n.id && !neighborsA.has(cand)) candidateIds.add(cand);
      });
    });
    candidateIds.forEach(candId=>{
      const key = n.id < candId ? n.id+'_'+candId : candId+'_'+n.id;
      if(scores.has(key)) return;
      const neighborsB = adj.get(candId);
      let commonCount = 0;
      neighborsA.forEach(x=>{ if(neighborsB.has(x)) commonCount++; });
      if(commonCount < 2) return; // إشارة ضعيفة جدًا، تجاهلها
      const unionSize = new Set([...neighborsA, ...neighborsB]).size;
      const jaccard = unionSize>0 ? commonCount/unionSize : 0;
      scores.set(key, { aId: n.id, bId: candId, jaccard, common: commonCount });
    });
  });
  return [...scores.values()].sort((x,y)=> y.jaccard - x.jaccard || y.common - x.common).slice(0, maxResults);
}

// ---- item 6: لوحة إحصائيات (top-10 ارتباطًا، توزيع الفئات، مضاف يدويًا مقابل أصلي) ----
function computeStatsSnapshot(){
  const byConnRaw = [...nodes].sort((a,b)=> b.connections.length - a.connections.length).slice(0,10);
  const betweenness = computeBetweennessCentrality();
  const byBetweenness = [...nodes].sort((a,b)=> (betweenness.get(b.id)||0) - (betweenness.get(a.id)||0)).slice(0,10)
    .map(n=> ({ node:n, score: betweenness.get(n.id)||0 }));
  const catDist = {};
  nodes.forEach(n=>{ catDist[n.category] = (catDist[n.category]||0) + 1; });
  const addedCount = nodes.filter(n=>n.added).length;
  return { byConnRaw, byBetweenness, catDist, addedCount, originalCount: nodes.length - addedCount, total: nodes.length };
}

// ---- Edit mode: add nodes, move categories, link nodes, markdown articles ----
let editMode = false;
let linkSourceId = null;
let nextCustomId = Math.max(...nodes.map(n=>n.id)) + 1;

const editModeBtn = document.getElementById('editModeBtn');
const addNodeBtn = document.getElementById('addNodeBtn');
const linkModeBanner = document.getElementById('linkModeBanner');
const moveRow = document.getElementById('moveRow');
const moveCatSelect = document.getElementById('moveCatSelect');
const linkBtn = document.getElementById('linkBtn');

async function loadOverlayMeta(){
  try{
    const r = await window.storage.get('meta:customNodes');
    if(r && r.value){
      const custom = JSON.parse(r.value);
      custom.forEach(n=>{ nodes.push(n); nameIndex[n.name.trim()] = n; });
    }
  }catch(e){}
  try{
    const r = await window.storage.get('meta:categoryOverrides');
    if(r && r.value){
      const overrides = JSON.parse(r.value);
      Object.keys(overrides).forEach(id=>{
        const n = nodes.find(x=>x.id===Number(id));
        if(n) n.category = overrides[id];
      });
    }
  }catch(e){}
  try{
    const r = await window.storage.get('meta:extraLinks');
    if(r && r.value){
      const links = JSON.parse(r.value);
      links.forEach(([a,b])=>{
        const na = nodes.find(x=>x.id===a), nb = nodes.find(x=>x.id===b);
        if(na && nb){
          if(!na.connections.includes(nb.name)) na.connections.push(nb.name);
          if(!nb.connections.includes(na.name)) nb.connections.push(na.name);
        }
      });
    }
  }catch(e){}
  try{
    const r = await window.storage.get('meta:sourcesOverrides');
    if(r && r.value){
      const overrides = JSON.parse(r.value);
      Object.keys(overrides).forEach(id=>{
        const n = nodes.find(x=>x.id===Number(id));
        if(n) n.sources = overrides[id];
      });
    }
  }catch(e){}
  try{
    const r = await window.storage.get('meta:hubSummaryOverrides');
    if(r && r.value){
      const overrides = JSON.parse(r.value);
      Object.keys(overrides).forEach(id=>{
        const n = nodes.find(x=>x.id===Number(id));
        if(n) n.hubSummary = overrides[id];
      });
    }
  }catch(e){}
  try{
    const r = await window.storage.get('meta:noteTagIndex');
    if(r && r.value){
      noteTagIndex = JSON.parse(r.value);
    }
  }catch(e){}
}

async function saveCustomNodes(){
  const custom = nodes.filter(n=>n.custom);
  await window.storage.set('meta:customNodes', JSON.stringify(custom));
}
async function saveCategoryOverrides(id, cat){
  let overrides = {};
  try{
    const r = await window.storage.get('meta:categoryOverrides');
    if(r && r.value) overrides = JSON.parse(r.value);
  }catch(e){}
  overrides[id] = cat;
  await window.storage.set('meta:categoryOverrides', JSON.stringify(overrides));
}
async function saveSourcesOverride(id, sources){
  let overrides = {};
  try{
    const r = await window.storage.get('meta:sourcesOverrides');
    if(r && r.value) overrides = JSON.parse(r.value);
  }catch(e){}
  if(sources && sources.length) overrides[id] = sources;
  else delete overrides[id];
  await window.storage.set('meta:sourcesOverrides', JSON.stringify(overrides));
}
async function saveHubSummaryOverride(id, text){
  let overrides = {};
  try{
    const r = await window.storage.get('meta:hubSummaryOverrides');
    if(r && r.value) overrides = JSON.parse(r.value);
  }catch(e){}
  if(text) overrides[id] = text;
  else delete overrides[id];
  await window.storage.set('meta:hubSummaryOverrides', JSON.stringify(overrides));
}
async function saveNoteTagIndexEntry(id, tags){
  if(tags && tags.length) noteTagIndex[id] = tags;
  else delete noteTagIndex[id];
  await window.storage.set('meta:noteTagIndex', JSON.stringify(noteTagIndex));
}
async function saveExtraLink(aId, bId){
  let links = [];
  try{
    const r = await window.storage.get('meta:extraLinks');
    if(r && r.value) links = JSON.parse(r.value);
  }catch(e){}
  links.push([aId, bId]);
  await window.storage.set('meta:extraLinks', JSON.stringify(links));
}

function refreshCatDropdowns(){
  [moveCatSelect, document.getElementById('newNodeCat')].forEach(sel=>{
    sel.innerHTML = CATS_ALL.map(c=>`<option value="${c}">${c}</option>`).join('');
  });
}

editModeBtn.onclick = ()=>{
  editMode = !editMode;
  editModeBtn.setAttribute('aria-pressed', String(editMode));
  addNodeBtn.style.display = editMode ? 'inline-block' : 'none';
  moveRow.style.display = (editMode && currentNode) ? 'block' : 'none';
  linkBtn.style.display = (editMode && currentNode) ? 'inline-block' : 'none';
  sourcesAddRow.style.display = (editMode && currentNode) ? 'flex' : 'none';
  if(currentNode) renderHubSummary(currentNode);
  if(!editMode){
    linkSourceId = null;
    linkModeBanner.style.display = 'none';
  }
};

addNodeBtn.onclick = ()=>{
  refreshCatDropdowns();
  document.getElementById('newNodeName').value = '';
  document.getElementById('newNodeOverlay').style.display = 'flex';
};
document.getElementById('newNodeCancel').onclick = ()=>{
  document.getElementById('newNodeOverlay').style.display = 'none';
};
document.getElementById('newNodeSave').onclick = async ()=>{
  const name = document.getElementById('newNodeName').value.trim();
  const cat = document.getElementById('newNodeCat').value;
  if(!name) return;
  const newNode = { id: nextCustomId++, name, category: cat, connections: [], added: true, custom: true };
  nodes.push(newNode);
  nameIndex[name] = newNode;
  await saveCustomNodes();
  document.getElementById('newNodeOverlay').style.display = 'none';
  statTotal.textContent = nodes.length;
  statAdded.textContent = nodes.filter(n=>n.added).length;
  renderCatList();
  renderMainView();
};

moveCatSelect.onchange = async ()=>{
  if(!currentNode) return;
  const newCat = moveCatSelect.value;
  currentNode.category = newCat;
  await saveCategoryOverrides(currentNode.id, newCat);
  dCat.innerHTML = newCat + (currentNode.epistemicStatus ? epistemicBadgeHtml(currentNode.epistemicStatus) : '');
  dCat.style.color = CAT_COLORS[newCat] || '#8b909c';
  renderCatList();
  renderMainView();
};

linkBtn.onclick = ()=>{
  if(!currentNode) return;
  linkSourceId = currentNode.id;
  linkModeBanner.style.display = 'flex';
  linkModeBanner.innerHTML = `وضع الربط مفعّل: اختر أي عقدة تانية لربطها بـ"${currentNode.name}" <button id="cancelLinkMode">إلغاء</button>`;
  document.getElementById('cancelLinkMode').onclick = ()=>{
    linkSourceId = null;
    linkModeBanner.style.display = 'none';
  };
  closeDrawer();
};

async function tryCompleteLink(targetNode){
  if(linkSourceId === null || targetNode.id === linkSourceId) return false;
  const source = nodes.find(n=>n.id===linkSourceId);
  if(!source) return false;
  if(!source.connections.includes(targetNode.name)) source.connections.push(targetNode.name);
  if(!targetNode.connections.includes(source.name)) targetNode.connections.push(source.name);
  invalidateAdjacencyCache();
  await saveExtraLink(source.id, targetNode.id);
  linkSourceId = null;
  linkModeBanner.style.display = 'none';
  return true;
}

// ---- markdown article edit/preview tabs ----
const tabEdit = document.getElementById('tabEdit');
const tabPreview = document.getElementById('tabPreview');
const articlePreview = document.getElementById('articlePreview');
tabEdit.onclick = ()=>{
  tabEdit.classList.add('active'); tabPreview.classList.remove('active');
  notesEl.style.display = 'block'; articlePreview.style.display = 'none';
};
tabPreview.onclick = ()=>{
  tabPreview.classList.add('active'); tabEdit.classList.remove('active');
  notesEl.style.display = 'none'; articlePreview.style.display = 'block';
  try{
    articlePreview.innerHTML = window.marked ? window.marked.parse(notesEl.value || '') : notesEl.value;
  }catch(e){
    articlePreview.textContent = notesEl.value;
  }
};

// ---- Stage 1 / item 6: name-mode toggle buttons ----
const nameModeToggle = document.getElementById('nameModeToggle');
if(nameModeToggle){
  nameModeToggle.querySelectorAll('.name-mode-btn').forEach(btn=>{
    btn.onclick = ()=>{
      nameMode = btn.dataset.mode;
      nameModeToggle.querySelectorAll('.name-mode-btn').forEach(b=>{
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderMainView();
      if(currentNode) openNode(currentNode, false);
    };
  });
}

// ---- Stage 1 / item 8: dark/light theme toggle ----
const themeToggleBtn = document.getElementById('themeToggleBtn');
if(themeToggleBtn){
  themeToggleBtn.onclick = ()=>{
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if(isLight){
      document.documentElement.removeAttribute('data-theme');
      themeToggleBtn.textContent = '🌙 داكن';
      themeToggleBtn.setAttribute('aria-pressed', 'false');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggleBtn.textContent = '☀️ فاتح';
      themeToggleBtn.setAttribute('aria-pressed', 'true');
    }
    if(currentView === 'graph') showGraphView();
  };
}

// ---- Stage 1 / item 4: legend panel (built once from all known categories) ----
function buildLegendPanel(){
  const legendBody = document.getElementById('legendBody');
  const legendHead = document.getElementById('legendHead');
  const legendPanel = document.getElementById('legendPanel');
  if(!legendBody || !legendPanel) return;
  legendBody.innerHTML = CATS.map(cat=>{
    const color = CAT_COLORS[cat] || '#666';
    return `<div class="legend-row"><span class="dot" style="background:${color}"></span><span>${cat}</span></div>`;
  }).join('') + `<div class="legend-row"><span class="dot" style="background:var(--added)"></span><span>مُضاف حديثًا</span></div>`;
  if(legendHead){
    legendHead.onclick = ()=>{
      legendPanel.classList.toggle('collapsed');
      const caret = document.getElementById('legendCaret');
      if(caret) caret.textContent = legendPanel.classList.contains('collapsed') ? '▸' : '▾';
    };
  }
}

// ---- Stage 1 / item 9: reading mode (fullscreen article preview) ----
const readingModeBtn = document.getElementById('readingModeBtn');
const readingModeExit = document.getElementById('readingModeExit');
if(readingModeBtn){
  readingModeBtn.onclick = ()=>{
    tabPreview.click();
    drawer.classList.add('reading-mode');
  };
}
if(readingModeExit){
  readingModeExit.onclick = ()=> drawer.classList.remove('reading-mode');
}

// ============ Stage 2: analysis tools UI wiring ============
const analysisOverlay = document.getElementById('analysisOverlay');
const analysisToolsBtn = document.getElementById('analysisToolsBtn');
const closeAnalysisBtn = document.getElementById('closeAnalysis');

function openAnalysisModal(){
  if(!analysisOverlay) return;
  // datalist مبني مرة واحدة عند أول فتح فقط (1194 اسم — لا داعي لإعادة بنائه كل مرة)
  const dl = document.getElementById('allNodeNames');
  if(dl && dl.children.length === 0){
    dl.innerHTML = nodes.map(n=>`<option value="${n.name.replace(/"/g,'&quot;')}">`).join('');
  }
  analysisOverlay.classList.add('show');
}
function closeAnalysisModal(){
  if(analysisOverlay) analysisOverlay.classList.remove('show');
}
if(analysisToolsBtn) analysisToolsBtn.onclick = openAnalysisModal;
if(closeAnalysisBtn) closeAnalysisBtn.onclick = closeAnalysisModal;
if(analysisOverlay) analysisOverlay.onclick = (e)=>{ if(e.target === analysisOverlay) closeAnalysisModal(); };
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape' && analysisOverlay && analysisOverlay.classList.contains('show')) closeAnalysisModal();
});

// ---- tabs ----
const analysisTabsEl = document.getElementById('analysisTabs');
if(analysisTabsEl){
  analysisTabsEl.querySelectorAll('.analysis-tab').forEach(btn=>{
    btn.onclick = ()=>{
      analysisTabsEl.querySelectorAll('.analysis-tab').forEach(b=> b.classList.toggle('active', b===btn));
      document.querySelectorAll('.analysis-pane').forEach(p=> p.classList.remove('active'));
      const pane = document.getElementById('pane' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1));
      if(pane) pane.classList.add('active');
    };
  });
}

function resolveInputToNode(inputEl){
  const val = inputEl.value.trim();
  if(!val) return null;
  return findByName(val);
}

function nodeRowHtml(n, extraMeta){
  return `<div class="analysis-node-row" data-node-id="${n.id}">
    <span>${getDisplayName(n.name)} <span style="color:var(--muted); font-family:var(--font-mono); font-size:11px;">(${n.category})</span></span>
    <span class="anr-meta">${extraMeta !== undefined ? extraMeta : n.connections.length + ' اتصال'}</span>
  </div>`;
}
function wireNodeRows(container){
  container.querySelectorAll('.analysis-node-row').forEach(row=>{
    row.onclick = ()=>{
      const n = nodes.find(x=>x.id === Number(row.dataset.nodeId));
      if(n){ closeAnalysisModal(); openNode(n, true); }
    };
    row.setAttribute('role','button'); row.setAttribute('tabindex','0');
    row.onkeydown = (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); row.onclick(); } };
  });
}

// ---- items 1+2+3: مقارنة عقدتين (عقد مشتركة + أقصر مسار + تقاطع بصري) ----
const runCompareBtn = document.getElementById('runCompareBtn');
if(runCompareBtn){
  runCompareBtn.onclick = ()=>{
    const resultEl = document.getElementById('compareResult');
    const nodeA = resolveInputToNode(document.getElementById('compareNodeA'));
    const nodeB = resolveInputToNode(document.getElementById('compareNodeB'));
    if(!nodeA || !nodeB){
      resultEl.innerHTML = '<div class="analysis-empty">اكتب اسمين صحيحين لعقدتين موجودتين في الخريطة (اختر من القائمة المقترحة).</div>';
      return;
    }
    if(nodeA.id === nodeB.id){
      resultEl.innerHTML = '<div class="analysis-empty">اختَر عقدتين مختلفتين.</div>';
      return;
    }
    const common = getCommonNeighbors(nodeA.id, nodeB.id);
    const path = shortestPath(nodeA.id, nodeB.id);
    let html = '';
    html += `<div class="analysis-result-block"><div class="analysis-result-title">🔗 العقد المشتركة (${common.length})</div>`;
    html += common.length ? common.map(n=>nodeRowHtml(n)).join('') : '<div class="analysis-empty">لا توجد عقد مشتركة بين الاثنين.</div>';
    html += `</div>`;
    html += `<div class="analysis-result-block"><div class="analysis-result-title">🧭 أقصر مسار</div>`;
    if(!path){
      html += '<div class="analysis-empty">لا يوجد مسار بينهما عبر الروابط الحالية (كل واحدة في جزء منفصل من الخريطة).</div>';
    } else {
      html += `<div class="analysis-path-row">` + path.map((n,i)=>{
        const chip = `<span class="conn-chip" data-node-id="${n.id}" style="cursor:pointer;">${getDisplayName(n.name)}</span>`;
        return i < path.length-1 ? chip + '<span style="color:var(--muted);">→</span>' : chip;
      }).join('') + `</div><div class="anr-meta" style="margin-top:6px;">${path.length-1} قفزة</div>`;
    }
    html += `</div>`;
    if(common.length){
      html += `<button class="analysis-highlight-btn" id="showIntersectionBtn">🔦 اعرض التقاطع بصريًا في الجراف</button>`;
    }
    resultEl.innerHTML = html;
    wireNodeRows(resultEl);
    resultEl.querySelectorAll('.analysis-path-row .conn-chip').forEach(chip=>{
      chip.onclick = ()=>{
        const n = nodes.find(x=>x.id===Number(chip.dataset.nodeId));
        if(n){ closeAnalysisModal(); openNode(n, true); }
      };
    });
    const highlightBtn = document.getElementById('showIntersectionBtn');
    if(highlightBtn) highlightBtn.onclick = ()=> showIntersectionInGraph(nodeA, nodeB, common);
  };
}

function showIntersectionInGraph(nodeA, nodeB, common){
  const graphNodes = [nodeA, nodeB, ...common];
  const primaryIds = new Set(graphNodes.map(n=>n.id));
  const links = [];
  const linkKeys = new Set();
  graphNodes.forEach(n=>{
    n.connections.forEach(cname=>{
      const t = findByName(cname);
      if(t && primaryIds.has(t.id)){
        const k = n.id < t.id ? n.id+'_'+t.id : t.id+'_'+n.id;
        if(!linkKeys.has(k)){ linkKeys.add(k); links.push({source:n.id, target:t.id}); }
      }
    });
  });
  closeAnalysisModal();
  switchToView('graph');
  setTimeout(()=>{
    graphTitle.textContent = `🔦 تقاطع: ${getDisplayName(nodeA.name)} × ${getDisplayName(nodeB.name)}`;
    graphSub.textContent = `${common.length} عقدة مشتركة`;
    renderForceGraph(graphNodes, links, primaryIds);
  }, 200);
}

// ---- item 4: Orphan Finder ----
const runOrphanBtn = document.getElementById('runOrphanBtn');
if(runOrphanBtn){
  runOrphanBtn.onclick = ()=>{
    const threshold = Math.max(0, Number(document.getElementById('orphanThreshold').value) || 0);
    const orphans = findOrphans(threshold);
    const resultEl = document.getElementById('orphanResult');
    const adj = getAdjacency();
    resultEl.innerHTML = `<div class="analysis-result-block"><div class="analysis-result-title">🏝️ العقد اليتيمة (${orphans.length} من ${nodes.length})</div>` +
      (orphans.length ? orphans.slice(0,200).map(n=> nodeRowHtml(n, adj.get(n.id).size + ' اتصال فعلي')).join('') : '<div class="analysis-empty">لا توجد عقد بهذا الحد من الاتصالات — كل العقد متصلة بشكل أفضل.</div>') +
      (orphans.length > 200 ? `<div class="analysis-empty">...وعدد ${orphans.length-200} عقدة إضافية (تم عرض أول 200 فقط)</div>` : '') +
      `</div>`;
    wireNodeRows(resultEl);
  };
}

// ---- items 5+6: لوحة الإحصائيات ----
const runStatsBtn = document.getElementById('runStatsBtn');
if(runStatsBtn){
  runStatsBtn.onclick = ()=>{
    const resultEl = document.getElementById('statsResult');
    resultEl.innerHTML = '<div class="analysis-empty">جارٍ الحساب (يشمل حساب مركزية Betweenness على كل العقد)…</div>';
    setTimeout(()=>{
      const snap = computeStatsSnapshot();
      let html = '';
      html += `<div class="analysis-result-block"><div class="analysis-result-title">📊 أعلى 10 عقد من حيث عدد الاتصالات المباشرة</div>`;
      html += snap.byConnRaw.map(n=> nodeRowHtml(n)).join('');
      html += `</div>`;
      html += `<div class="analysis-result-block"><div class="analysis-result-title">🕸️ أعلى 10 عقد من حيث مركزية "الجسر" (Betweenness Centrality)</div>`;
      html += `<div class="analysis-hint" style="margin-bottom:6px;">عقدة ممكن يكون عدد اتصالاتها المباشرة قليل، لكنها المسار الوحيد بين تجمعين كبيرين — دي بتظهر هنا حتى لو مش في القائمة اللي فوق.</div>`;
      html += snap.byBetweenness.map(({node,score})=> nodeRowHtml(node, score.toFixed(1))).join('');
      html += `</div>`;
      html += `<div class="analysis-result-block"><div class="analysis-result-title">🗂️ توزيع العقد حسب الفئة</div>`;
      html += Object.entries(snap.catDist).sort((a,b)=>b[1]-a[1]).map(([cat,count])=>
        `<div class="analysis-stat-line"><span>${cat}</span><span>${count}</span></div>`).join('');
      html += `</div>`;
      html += `<div class="analysis-result-block"><div class="analysis-result-title">➕ مُضاف يدويًا مقابل أصلي</div>`;
      html += `<div class="analysis-stat-line"><span>عقد أصلية</span><span>${snap.originalCount}</span></div>`;
      html += `<div class="analysis-stat-line"><span>عقد مُضافة يدويًا (added:true)</span><span>${snap.addedCount}</span></div>`;
      html += `</div>`;
      resultEl.innerHTML = html;
      wireNodeRows(resultEl);
    }, 20);
  };
}

// ---- item 7: اقتراح روابط ناقصة ----
const runSuggestBtn = document.getElementById('runSuggestBtn');
if(runSuggestBtn){
  runSuggestBtn.onclick = ()=>{
    const resultEl = document.getElementById('suggestResult');
    resultEl.innerHTML = '<div class="analysis-empty">جارٍ الحساب…</div>';
    setTimeout(()=>{
      const suggestions = suggestMissingLinks(30);
      if(!suggestions.length){
        resultEl.innerHTML = '<div class="analysis-empty">مفيش اقتراحات واضحة حاليًا (مفيش أزواج غير مرتبطة بعدد كافٍ من الجيران المشتركين).</div>';
        return;
      }
      let html = `<div class="analysis-result-block"><div class="analysis-result-title">💡 ${suggestions.length} اقتراح (الأقوى تشابهًا أولًا)</div>`;
      html += suggestions.map(s=>{
        const na = nodes.find(n=>n.id===s.aId), nb = nodes.find(n=>n.id===s.bId);
        return `<div class="analysis-node-row" style="cursor:default;">
          <span>${getDisplayName(na.name)} <span style="color:var(--muted);">↔</span> ${getDisplayName(nb.name)}</span>
          <span class="anr-meta">Jaccard ${s.jaccard.toFixed(2)} · ${s.common} مشترك</span>
        </div>`;
      }).join('');
      html += `</div>`;
      resultEl.innerHTML = html;
    }, 20);
  };
}

// ---- Stage 1 / item 1: boot screen ----
const bootScreen = document.getElementById('bootScreen');
const bootStartBtn = document.getElementById('bootStartBtn');

// ---- init ----
async function init(){
  await loadOverlayMeta();
  const catIndex = Object.fromEntries(CATS_ALL.map((c,i)=>[c,i]));
  nodes.sort((a,b)=>{
    const ca = catIndex[a.category] ?? 999, cb = catIndex[b.category] ?? 999;
    if(ca !== cb) return ca - cb;
    return compareNodesNatural(a,b);
  });
  refreshCatDropdowns();
  hubChildCounts = computeHubChildCounts();
  statTotal.textContent = nodes.length;
  statAdded.textContent = nodes.filter(n=>n.added).length;
  renderCatList();
  buildLegendPanel();

  const totalLinks = (()=>{
    const seen = new Set();
    let count = 0;
    nodes.forEach(n=> n.connections.forEach(cname=>{
      const t = findByName(cname);
      if(!t) return;
      const key = n.id < t.id ? n.id+'_'+t.id : t.id+'_'+n.id;
      if(!seen.has(key)){ seen.add(key); count++; }
    }));
    return count;
  })();

  if(bootScreen && bootStartBtn){
    document.getElementById('bootNodeCount').textContent = nodes.length;
    document.getElementById('bootLinkCount').textContent = totalLinks;
    bootScreen.classList.add('show');
    bootStartBtn.onclick = ()=>{
      bootScreen.classList.remove('show');
      switchToView('grid');
    };
  } else {
    switchToView('grid');
  }
}
init();

// ---- Lightweight runtime QA self-check (dev console only, no UI impact) ----
(function runQASelfCheck(){
  try{
    const issues = [];
    // duplicate node names
    const seen = new Set();
    nodes.forEach(n=>{
      if(seen.has(n.name)) issues.push('تكرار اسم عقدة: ' + n.name);
      seen.add(n.name);
    });
    // orphan connections (pointing nowhere resolvable, informational only)
    let orphanCount = 0;
    nodes.forEach(n=> n.connections.forEach(c=>{ if(!findByName(c)) orphanCount++; }));
    // required DOM elements present
    ['search','grid','graphSvg','drawer','editModeBtn'].forEach(id=>{
      if(!document.getElementById(id)) issues.push('عنصر واجهة مفقود: #' + id);
    });
    if(issues.length){
      console.warn('[QA self-check] مشاكل مكتشفة:', issues);
    } else {
      console.info('[QA self-check] لا مشاكل بنيوية أساسية. روابط بلا عقدة مطابقة (متوقع جزئيًا): ' + orphanCount);
    }
  }catch(e){
    console.warn('[QA self-check] تعذر التشغيل:', e);
  }
})();
