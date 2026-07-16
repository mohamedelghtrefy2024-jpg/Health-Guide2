// ---- item 1: مفضلة (Bookmarks) + شوهد مؤخرًا ----
let bookmarkIds = new Set();
let recentIds = [];
async function loadBookmarksAndRecent(){
  try{
    const r = await localStore.get('meta:bookmarks');
    if(r && r.value) bookmarkIds = new Set(JSON.parse(r.value));
  }catch(e){}
  try{
    const r = await localStore.get('meta:recentlyViewed');
    if(r && r.value) recentIds = JSON.parse(r.value);
  }catch(e){}
}
async function saveBookmarks(){ await localStore.set('meta:bookmarks', JSON.stringify([...bookmarkIds])); }
async function pushRecent(id){
  recentIds = recentIds.filter(x=>x!==id);
  recentIds.unshift(id);
  if(recentIds.length > 30) recentIds = recentIds.slice(0,30);
  await localStore.set('meta:recentlyViewed', JSON.stringify(recentIds));
}

const bookmarkBtnEl = document.getElementById('bookmarkBtn');
function refreshBookmarkBtn(){
  if(!bookmarkBtnEl || !currentNode) return;
  const on = bookmarkIds.has(currentNode.id);
  bookmarkBtnEl.textContent = on ? '★' : '☆';
  bookmarkBtnEl.setAttribute('aria-pressed', String(on));
}
if(bookmarkBtnEl){
  bookmarkBtnEl.onclick = async ()=>{
    if(!currentNode) return;
    if(bookmarkIds.has(currentNode.id)) bookmarkIds.delete(currentNode.id);
    else bookmarkIds.add(currentNode.id);
    await saveBookmarks();
    refreshBookmarkBtn();
  };
}

function nodeListRowHtml(n, extraMetaText){
  return `<div class="analysis-node-row" data-node-id="${n.id}">
    <span>${getDisplayName(n.name)} <span style="color:var(--muted); font-size:11px;">(${n.category})</span></span>
    ${extraMetaText ? `<span class="anr-meta">${extraMetaText}</span>` : ''}
  </div>`;
}
function wireNodeListRows(container){
  container.querySelectorAll('[data-node-id]').forEach(row=>{
    row.onclick = ()=>{
      const n = nodes.find(x=>x.id===Number(row.dataset.nodeId));
      if(n){ closeInvestigationModal(); openNode(n, true); }
    };
  });
}

function renderBookmarksList(){
  const el = document.getElementById('bookmarksList');
  if(!el) return;
  const list = [...bookmarkIds].map(id=> nodes.find(n=>n.id===id)).filter(Boolean);
  el.innerHTML = list.length
    ? list.map(n=> nodeListRowHtml(n)).join('')
    : '<div class="analysis-empty">لسه مفيش عقد في المفضلة. افتح أي عقدة واضغط ☆ بجانب اسمها.</div>';
  wireNodeListRows(el);
}
function renderRecentList(){
  const el = document.getElementById('recentList');
  if(!el) return;
  const list = recentIds.map(id=> nodes.find(n=>n.id===id)).filter(Boolean);
  el.innerHTML = list.length
    ? list.map(n=> nodeListRowHtml(n)).join('')
    : '<div class="analysis-empty">لسه مفيش عقد اتفتحت في هذه الجلسة.</div>';
  wireNodeListRows(el);
}

