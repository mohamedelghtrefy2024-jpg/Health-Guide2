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
  UI.Modal.open('analysisOverlay');
}
function closeAnalysisModal(){
  if(analysisOverlay) UI.Modal.close('analysisOverlay');
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

