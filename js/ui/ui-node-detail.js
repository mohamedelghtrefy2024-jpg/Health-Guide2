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

function openNode(node, pushHistory, opts){
  opts = opts || {};
  currentNode = node;
  if(pushHistory){
    history = history.slice(0, historyPos+1);
    history.push(node.id);
    historyPos = history.length - 1;
  }
  updateNavButtons();
  // ---- Stage 4 / items 1+2: تتبّع "شوهد مؤخرًا" ومزامنة رابط الصفحة (deep link) ----
  if(typeof pushRecent === 'function') pushRecent(node.id);
  if(!opts.skipUrlUpdate && typeof updateUrlForNode === 'function') updateUrlForNode(node);
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
  if(typeof refreshBookmarkBtn === 'function') refreshBookmarkBtn();
  if(typeof refreshAddToPathBtn === 'function') refreshAddToPathBtn();
  overlay.style.display = 'block';
  drawer.classList.add('open');
  // ---- لو إحنا واقفين في وضع الشبكة، زوّم واتمركز على العقدة دي بدل ما يفضل الجراف زي ما هو ----
  if(typeof focusNodeInGraph === 'function') focusNodeInGraph(node.id);
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
function escapeRegex(str){ return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---- ربط تلقائي: أي ذكر لاسم عقدة موجودة جوه نص حر (ملخص Hub، تفسير علاقة...) بيتحول لينك قابل للضغط ----
let nodeNameMatcher = null;
let nodeByExactName = null;
function buildNodeNameMatcher(){
  nodeByExactName = new Map();
  nodes.forEach(n=>{ if(!nodeByExactName.has(n.name)) nodeByExactName.set(n.name, n); });
  const names = [...nodeByExactName.keys()]
    .filter(n=> n.trim().length >= 2) // تجاهل أسماء قصيرة جدًا (تقليل تطابقات وهمية)
    .sort((a,b)=> b.length - a.length); // الأطول أولًا، عشان "13.4.4.1" متتقفش قبل "13.4.4.1.1"
  nodeNameMatcher = new RegExp('(' + names.map(escapeRegex).join('|') + ')', 'g');
}
function linkifyNodeMentions(rawText, excludeId){
  if(!rawText) return '';
  if(!nodeNameMatcher) buildNodeNameMatcher();
  return rawText.split(nodeNameMatcher).map(part=>{
    if(!part) return '';
    const n = nodeByExactName.get(part);
    if(n && n.id !== excludeId) return `<a href="#" class="node-mention" data-node-id="${n.id}">${escapeHtml(part)}</a>`;
    return escapeHtml(part);
  }).join('');
}
// تفويض ضغط واحد على مستوى المستند لأي لينك node-mention، أينما ظهر (ملخص Hub، مفتش العلاقات...)
document.addEventListener('click', (e)=>{
  const a = e.target.closest && e.target.closest('.node-mention');
  if(!a) return;
  e.preventDefault();
  const n = nodes.find(x=>x.id===Number(a.dataset.nodeId));
  if(n) openNode(n, true);
});

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
  hubSummaryView.innerHTML = linkifyNodeMentions(summary, node.id);
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

// ============================================================
// صفحة "عرض المقال الكامل" — عرض كل المعلومات المستنتجة عن العقدة
// (الملخص، المصادر، كل الروابط بتصنيفها وأسبابها لو موجودة) كصفحة واحدة كاملة شبه ويكي،
// بدل ما المستخدم يقرا كل حاجة مبعثرة في الـ drawer الجانبي الصغير.
// ============================================================
const articleViewOverlay = document.getElementById('articleViewOverlay');
const articleViewBody = document.getElementById('articleViewBody');
const articleViewExit = document.getElementById('articleViewExit');
const openArticleViewBtn = document.getElementById('openArticleViewBtn');

function relationTypeLabel(type){
  const labels = {
    alias:'اسم بديل', historical:'تاريخية', thematic:'موضوعية', evidence:'دليل مباشر', organizational:'تنظيمية', opposing:'معارضة',
    claimed:'مزعومة', speculative:'تخمينية', conspiracy:'أدبيات مؤامرة', popularized:'شائعة ثقافيًا', debunked:'مفنّدة',
    disputed:'محل خلاف', indirect:'غير مباشرة', influence:'تأثير', scientific:'علمية', ideological:'فكرية',
    intelligence:'استخباراتية', financial:'مالية', military:'عسكرية', religious:'دينية', cultural:'ثقافية', symbolic:'رمزية'
  };
  return labels[type] || type;
}
function strengthLabel(s){
  const labels = { very_strong:'قوية جدًا', strong:'قوية', medium:'متوسطة', weak:'ضعيفة', very_weak:'ضعيفة جدًا', unknown:'غير محددة' };
  return labels[s] || s;
}

function openArticleView(node){
  if(!node || !articleViewOverlay) return;

  const catColor = CAT_COLORS[node.category] || '#8b909c';
  const badges = (node.epistemicStatus ? epistemicBadgeHtml(node.epistemicStatus) : '');

  // Infobox
  const infoRows = [
    ['الفئة', escapeHtml(node.category)],
    ['عدد الاتصالات المعلنة', String(node.connections.length)],
    ['المصادر الموثقة', String(Array.isArray(node.sources) ? node.sources.length : 0)],
  ];
  if(node.parentHub) infoRows.push(['جزء من', escapeHtml(getDisplayName(node.parentHub))]);
  if(node.added) infoRows.push(['ملاحظة', 'عقدة مُضافة يدويًا']);
  const infoboxHtml = `<div class="av-infobox"><h4>معلومات سريعة</h4>` +
    infoRows.map(([k,v])=>`<div class="av-row"><span>${k}</span><strong>${v}</strong></div>`).join('') +
    `</div>`;

  // الملخص
  const summaryHtml = node.hubSummary
    ? `<div class="av-summary">${escapeHtml(node.hubSummary).replace(/\n/g,'<br>')}</div>`
    : `<div class="av-empty">لا يوجد ملخص بحث مسجّل لهذه العقدة بعد — استخدم زرار "🔍 جهّز طلب بحث" لتوليده.</div>`;

  // المصادر
  const sourcesList = Array.isArray(node.sources) ? node.sources : [];
  const sourcesHtml = sourcesList.length
    ? '<ol>' + sourcesList.map(s=>{
        const safeUrl = isSafeUrl(s.url) ? s.url : '#';
        return `<li class="av-source-item"><a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label || s.url)}</a></li>`;
      }).join('') + '</ol>'
    : `<div class="av-empty">لا يوجد مصادر مسجّلة بعد.</div>`;

  // العلاقات — كل عقدة موصولة، مع تصنيفها وسببها لو موجود في EDGE_META
  const relHtml = node.connections.length
    ? node.connections.map(cname=>{
        const target = findByName(cname);
        const meta = (typeof getEdgeMeta === 'function') ? getEdgeMeta(node.name, cname) : null;
        const metaLine = meta
          ? `<div class="av-rel-meta"><span class="av-badge">${relationTypeLabel(meta.type)}</span><span class="av-badge">${strengthLabel(meta.strength)}</span>${meta.evidenceLevel ? `<span class="av-badge">${escapeHtml(meta.evidenceLevel)}</span>` : ''}</div>`
          : `<div class="av-rel-meta"><span class="av-badge">تصنيف غير مسجّل بعد</span></div>`;
        const reasonLine = meta && meta.reason ? `<div class="av-rel-reason">${escapeHtml(meta.reason)}</div>` : '';
        const div = document.createElement('div');
        div.className = 'av-rel-item';
        div.innerHTML = `<div class="av-rel-name">${escapeHtml(getDisplayName(cname))}</div>${metaLine}${reasonLine}`;
        if(target){
          div.setAttribute('role','button'); div.setAttribute('tabindex','0');
          div.onclick = ()=>{ closeArticleView(); openNode(target, true); };
          div.onkeydown = (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); div.onclick(); } };
        }
        return div.outerHTML;
      }).join('')
    : `<div class="av-empty">لا توجد اتصالات معلنة بعد.</div>`;

  // المقال/التحليل الشخصي (Markdown notes) لو موجود — يتحمّل من نفس تخزين الملاحظات
  let notesHtml = `<div class="av-empty">لسه مفيش مقال شخصي مكتوب لهذه العقدة.</div>`;
  if(currentNode && currentNode.id === node.id && notesEl && notesEl.value && notesEl.value.trim()){
    notesHtml = `<div class="av-summary">${window.marked ? window.marked.parse(notesEl.value) : escapeHtml(notesEl.value)}</div>`;
  }

  articleViewBody.innerHTML = `
    <div class="av-cat" style="color:${catColor}">${escapeHtml(node.category)} ${badges}</div>
    <div class="av-title">${escapeHtml(getDisplayName(node.name))}</div>
    ${infoboxHtml}
    <div class="av-section"><h3>الملخص</h3>${summaryHtml}</div>
    <div class="av-section"><h3>المصادر</h3>${sourcesHtml}</div>
    <div class="av-section"><h3>العلاقات (${node.connections.length})</h3>${relHtml}</div>
    <div class="av-section av-notes"><h3>المقال الشخصي / التحليل</h3>${notesHtml}</div>
  `;

  articleViewOverlay.classList.add('show');
}
function closeArticleView(){
  if(articleViewOverlay) articleViewOverlay.classList.remove('show');
}
if(openArticleViewBtn) openArticleViewBtn.onclick = ()=> currentNode && openArticleView(currentNode);
if(articleViewExit) articleViewExit.onclick = closeArticleView;
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape' && articleViewOverlay && articleViewOverlay.classList.contains('show')) closeArticleView();
});


