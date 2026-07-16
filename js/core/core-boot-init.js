// ---- Stage 1 / item 1: boot screen ----
const bootScreen = document.getElementById('bootScreen');
const bootStartBtn = document.getElementById('bootStartBtn');

// ---- init ----
async function init(){
  await loadOverlayMeta();
  await loadEdgeMetaOverrides();
  await loadBookmarksAndRecent();
  await loadInvestigationPath();
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

  // ---- Stage 4 / item 2: لو في ?node= في الرابط، افتحه مباشرة وتخطَّ شاشة البداية ----
  const deepLinkOpened = (typeof tryOpenNodeFromUrl === 'function') ? tryOpenNodeFromUrl() : false;
  if(deepLinkOpened){
    switchToView('grid');
  } else if(bootScreen && bootStartBtn){
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

