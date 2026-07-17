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

// ---- حالة آخر رسم للجراف (لازمة عشان ميزة "التركيز على عقدة" تقدر توصل للجراف من بره renderForceGraph) ----
let lastGraphPositions = new Map(); // nodeId -> {x,y}
let lastGraphSvg = null;
let lastGraphZoomBehavior = null;
let lastGraphGnodeSel = null;
let lastGraphWidth = 0, lastGraphHeight = 0;

// يزوم ويتمركز على عقدة معيّنة داخل وضع الشبكة (بيتنادى من openNode لما نكون في وضع الشبكة أصلاً).
// لو العقدة مش ظاهرة حاليًا (فئتها مش مفعّلة أو فلترها البحث)، بيوسّع الفلتر الأدنى الكافي عشان تظهر.
function focusNodeInGraph(nodeId){
  if(typeof currentView === 'undefined' || currentView !== 'graph') return;
  const target = nodes.find(n=>n.id===nodeId);
  if(!target) return;

  let needsRerender = false;
  if(!activeCats.has(target.category)){ activeCats.add(target.category); needsRerender = true; }
  if(searchTerm && searchTerm.trim() && !matchesSearchTerm(target, searchTerm.trim().toLowerCase())){
    searchTerm = '';
    const searchInputEl = document.getElementById('search');
    if(searchInputEl) searchInputEl.value = '';
    needsRerender = true;
  }
  if(needsRerender){ renderCatList(); showGraphView(); }

  const doFocus = ()=>{
    const pos = lastGraphPositions.get(nodeId);
    if(!pos || !lastGraphSvg || !lastGraphZoomBehavior) return;
    const currentK = d3.zoomTransform(lastGraphSvg.node()).k;
    const k = Math.min(2.2, Math.max(currentK, 1.4));
    const newTransform = d3.zoomIdentity
      .translate(lastGraphWidth/2 - k*pos.x, lastGraphHeight/2 - k*pos.y)
      .scale(k);
    lastGraphSvg.transition().duration(500).call(lastGraphZoomBehavior.transform, newTransform);
    if(lastGraphGnodeSel){
      lastGraphGnodeSel.classed('gnode-focus-pulse', false); // reset لو كانت شغالة من قبل
      const sel = lastGraphGnodeSel.filter(d=>d.id===nodeId);
      sel.classed('gnode-focus-pulse', true);
      setTimeout(()=> sel.classed('gnode-focus-pulse', false), 2000);
    }
  };
  // لو عملنا rerender، استنى فريم كمان عشان الـ simulation والـ DOM يخلصوا قبل ما نزوم
  if(needsRerender) requestAnimationFrame(()=> requestAnimationFrame(doFocus));
  else doFocus();
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
  lastGraphSvg = svg;
  lastGraphZoomBehavior = zoomBehavior;
  lastGraphWidth = width;
  lastGraphHeight = height;

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

  lastGraphPositions = new Map(nodesCopy.map(d=>[d.id, {x:d.x, y:d.y}]));

  const link = zoomLayer.append('g').selectAll('line')
    .data(linksCopy).join('line')
    .attr('class', 'glink')
    .attr('stroke-dasharray', d => (d.source.isBridge || d.target.isBridge) ? '3,3' : null)
    .attr('opacity', d => (d.source.isBridge || d.target.isBridge) ? 0.45 : 0.9)
    // ---- Stage 6: تلوين/سُمك اختياريان حسب edgeMeta (فاضي افتراضيًا = صفر تغيير بصري) ----
    .attr('stroke', d=>{ const m = edgeMetaFor(d); return (m && EDGE_TYPE_COLORS[m.type]) ? EDGE_TYPE_COLORS[m.type] : null; })
    .attr('stroke-width', d=>{ const m = edgeMetaFor(d); return (m && m.strength && EDGE_STRENGTH_WIDTH[m.strength]) ? EDGE_STRENGTH_WIDTH[m.strength] : null; })
    .style('cursor', d=> edgeMetaFor(d) ? 'pointer' : null)
    .on('click', (event, d)=>{
      const m = edgeMetaFor(d);
      if(m){ event.stopPropagation(); openRelationshipInspector(d.source.name, d.target.name, m); }
    });

  const gnode = zoomLayer.append('g').selectAll('g')
    .data(nodesCopy).join('g').attr('class', 'gnode')
    .attr('transform', d=>`translate(${d.x},${d.y})`)
    .call(d3.drag()
      .on('start', (event,d)=>{ if(!event.active) sim.alphaTarget(0.25).restart(); d.fx=d.x; d.fy=d.y; })
      .on('drag', (event,d)=>{ d.fx=event.x; d.fy=event.y; })
      .on('end', (event,d)=>{ if(!event.active) sim.alphaTarget(0); d.fx=null; d.fy=null; }));
  lastGraphGnodeSel = gnode;

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

