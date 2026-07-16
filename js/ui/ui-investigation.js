// ---- item 3: مسار تحقيق واحد نشط ----
let investigationPath = { name:'', question:'', nodeIds:[] };
async function loadInvestigationPath(){
  try{
    const r = await localStore.get('meta:investigationPath');
    if(r && r.value) investigationPath = Object.assign({name:'',question:'',nodeIds:[]}, JSON.parse(r.value));
  }catch(e){}
}
async function saveInvestigationPathData(){ await localStore.set('meta:investigationPath', JSON.stringify(investigationPath)); }

const addToPathBtnEl = document.getElementById('addToPathBtn');
function refreshAddToPathBtn(){
  if(!addToPathBtnEl || !currentNode) return;
  const already = investigationPath.nodeIds.includes(currentNode.id);
  addToPathBtnEl.disabled = already;
  addToPathBtnEl.textContent = already ? '✓ مُضافة لمسار التحقيق' : '➕ أضف لمسار التحقيق';
}
if(addToPathBtnEl){
  addToPathBtnEl.onclick = async ()=>{
    if(!currentNode || investigationPath.nodeIds.includes(currentNode.id)) return;
    investigationPath.nodeIds.push(currentNode.id);
    await saveInvestigationPathData();
    refreshAddToPathBtn();
    renderPathNodesList();
  };
}

function renderPathNodesList(){
  const el = document.getElementById('pathNodesList');
  if(!el) return;
  const pathNodeNameInput = document.getElementById('pathNameInput');
  const pathQuestionInputEl = document.getElementById('pathQuestionInput');
  if(pathNodeNameInput) pathNodeNameInput.value = investigationPath.name || '';
  if(pathQuestionInputEl) pathQuestionInputEl.value = investigationPath.question || '';
  if(!investigationPath.nodeIds.length){
    el.innerHTML = '<div class="analysis-empty">لسه مفيش عقد في المسار. افتح أي عقدة واضغط "أضف لمسار التحقيق".</div>';
    return;
  }
  el.innerHTML = investigationPath.nodeIds.map((id, idx)=>{
    const n = nodes.find(x=>x.id===id);
    if(!n) return '';
    return `<div class="path-node-row" data-node-id="${id}">
      <span class="path-node-name">${idx+1}. ${getDisplayName(n.name)}</span>
      <span class="path-node-actions">
        <button data-act="up" ${idx===0?'disabled':''} title="لأعلى">↑</button>
        <button data-act="down" ${idx===investigationPath.nodeIds.length-1?'disabled':''} title="لأسفل">↓</button>
        <button data-act="remove" title="إزالة">✕</button>
      </span>
    </div>`;
  }).join('');
  el.querySelectorAll('.path-node-row').forEach(row=>{
    const id = Number(row.dataset.nodeId);
    row.querySelector('.path-node-name').onclick = ()=>{
      const n = nodes.find(x=>x.id===id);
      if(n){ closeInvestigationModal(); openNode(n, true); }
    };
    row.querySelectorAll('button[data-act]').forEach(btn=>{
      btn.onclick = async (e)=>{
        e.stopPropagation();
        const i = investigationPath.nodeIds.indexOf(id);
        if(i === -1) return;
        if(btn.dataset.act === 'remove'){
          investigationPath.nodeIds.splice(i,1);
        } else if(btn.dataset.act === 'up' && i>0){
          [investigationPath.nodeIds[i-1], investigationPath.nodeIds[i]] = [investigationPath.nodeIds[i], investigationPath.nodeIds[i-1]];
        } else if(btn.dataset.act === 'down' && i<investigationPath.nodeIds.length-1){
          [investigationPath.nodeIds[i+1], investigationPath.nodeIds[i]] = [investigationPath.nodeIds[i], investigationPath.nodeIds[i+1]];
        }
        await saveInvestigationPathData();
        renderPathNodesList();
        refreshAddToPathBtn();
      };
    });
  });
}
const savePathMetaBtnEl = document.getElementById('savePathMetaBtn');
if(savePathMetaBtnEl){
  savePathMetaBtnEl.onclick = async ()=>{
    investigationPath.name = (document.getElementById('pathNameInput').value || '').trim();
    investigationPath.question = (document.getElementById('pathQuestionInput').value || '').trim();
    await saveInvestigationPathData();
  };
}

// ---- item 4: جولة موجّهة (Guided Tour) على التسلسل اللاهوتي الرئيسي (1 → 15) ----
function getTourSequence(){
  return nodes
    .map(n=>({ n, key: naturalNumberKey(n.name, n.category) }))
    .filter(x=> x.key && x.key.length===1)
    .sort((a,b)=> a.key[0]-b.key[0])
    .map(x=>x.n);
}
let tourSeq = [], tourIndex = 0, tourActive = false;
const tourBarEl = document.getElementById('tourBar');
function updateTourStatusUi(){
  const t = document.getElementById('tourStatusInline');
  if(t && tourSeq.length) t.textContent = `${tourIndex+1} / ${tourSeq.length} — ${getDisplayName(tourSeq[tourIndex].name)}`;
  const t2 = document.getElementById('tourStatus');
  if(t2) t2.innerHTML = tourSeq.length
    ? `<div class="analysis-result-block"><div class="analysis-result-title">الجولة نشطة</div>${nodeListRowHtml(tourSeq[tourIndex], `${tourIndex+1}/${tourSeq.length}`)}</div>`
    : '<div class="analysis-empty">لا يوجد تسلسل مرقّم مكتشف حاليًا لبناء جولة عليه.</div>';
}
function startTour(){
  tourSeq = getTourSequence();
  if(!tourSeq.length){ updateTourStatusUi(); return; }
  tourActive = true; tourIndex = 0;
  if(tourBarEl) tourBarEl.style.display = 'flex';
  closeInvestigationModal();
  openNode(tourSeq[0], true);
  updateTourStatusUi();
}
function tourStep(delta){
  if(!tourActive || !tourSeq.length) return;
  tourIndex = Math.min(tourSeq.length-1, Math.max(0, tourIndex+delta));
  openNode(tourSeq[tourIndex], true);
  updateTourStatusUi();
}
function endTour(){
  tourActive = false;
  if(tourBarEl) tourBarEl.style.display = 'none';
}
const startTourBtnEl = document.getElementById('startTourBtn');
if(startTourBtnEl) startTourBtnEl.onclick = startTour;
const tourPrevBtnEl = document.getElementById('tourPrevBtn');
const tourNextBtnEl = document.getElementById('tourNextBtn');
const tourExitBtnEl = document.getElementById('tourExitBtn');
if(tourPrevBtnEl) tourPrevBtnEl.onclick = ()=> tourStep(-1);
if(tourNextBtnEl) tourNextBtnEl.onclick = ()=> tourStep(1);
if(tourExitBtnEl) tourExitBtnEl.onclick = endTour;

// ---- investigation modal shell (نفس نمط analysis modal) ----
const investigationOverlay = document.getElementById('investigationOverlay');
const investigationBtnEl = document.getElementById('investigationBtn');
const closeInvestigationBtn = document.getElementById('closeInvestigation');
function openInvestigationModal(){
  if(!investigationOverlay) return;
  renderBookmarksList();
  renderRecentList();
  renderPathNodesList();
  updateTourStatusUi();
  UI.Modal.open('investigationOverlay');
}
function closeInvestigationModal(){
  if(investigationOverlay) UI.Modal.close('investigationOverlay');
}
if(investigationBtnEl) investigationBtnEl.onclick = openInvestigationModal;
if(closeInvestigationBtn) closeInvestigationBtn.onclick = closeInvestigationModal;
if(investigationOverlay) investigationOverlay.onclick = (e)=>{ if(e.target === investigationOverlay) closeInvestigationModal(); };
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape' && investigationOverlay && investigationOverlay.classList.contains('show')) closeInvestigationModal();
});
const investigationTabsEl = document.getElementById('investigationTabs');
if(investigationTabsEl){
  investigationTabsEl.querySelectorAll('.analysis-tab').forEach(btn=>{
    btn.onclick = ()=>{
      investigationTabsEl.querySelectorAll('.analysis-tab').forEach(b=> b.classList.toggle('active', b===btn));
      investigationOverlay.querySelectorAll('.analysis-pane').forEach(p=> p.classList.remove('active'));
      const pane = document.getElementById('pane' + btn.dataset.itab.charAt(0).toUpperCase() + btn.dataset.itab.slice(1));
      if(pane) pane.classList.add('active');
    };
  });
}

// ============================================================
// المرحلة 6 — العلاقات الدلالية (Typed/Weighted Edges) — بنية تحتية فقط
// ============================================================
// هام: طبقًا لقاعدة المرحلة صراحة، "ممنوع تصنيف كل الروابط دفعة واحدة" و"قيمة confidence لازم تُشتق
// من تقييم فعلي... لو مفيش أساس واضح، سيب الحقل فاضي". النظام هنا مبني بالكامل وجاهز للاستخدام،
// لكن data/edgeMeta.json بيتحمّل فاضي عمدًا — تصنيف حقيقي للعلاقات محتاج مراجعة تاريخية/معرفية
// حقيقية لكل رابط (نوعه، قوته، مستوى الثقة فيه) مش تلقائي. أي رابط مالوش entry هنا يشتغل
// بالسلوك الحالي بالظبط (خط رمادي عادي، بدون أي تمييز)، فصفر كسر وصفر تأثير بصري افتراضيًا.
window.EDGE_META = window.EDGE_META || {};
function edgeMetaKey(nameA, nameB){ return nameA + '|' + nameB; }
function getEdgeMeta(nameA, nameB){
  return window.EDGE_META[edgeMetaKey(nameA,nameB)] || window.EDGE_META[edgeMetaKey(nameB,nameA)] || null;
}
function edgeMetaFor(d){
  const sName = d.source && d.source.name ? d.source.name : null;
  const tName = d.target && d.target.name ? d.target.name : null;
  if(!sName || !tName) return null;
  return getEdgeMeta(sName, tName);
}
const EDGE_TYPE_COLORS = {
  organizational: '#4f8fd1', historical: '#d9a441', thematic: '#5fa8a0',
  evidence: '#3fae6a', opposing: '#e0674f', alias: '#8a6fd1'
};
const EDGE_TYPE_LABELS = {
  organizational: 'تنظيمية', historical: 'تاريخية', thematic: 'موضوعية',
  evidence: 'دليلية', opposing: 'متعارضة', alias: 'اسم بديل'
};
const EDGE_STRENGTH_WIDTH = { weak: 1, medium: 2, strong: 3.2 };
const EDGE_STRENGTH_LABELS = { weak: 'ضعيفة', medium: 'متوسطة', strong: 'قوية' };

const relInspectorEl = document.getElementById('relationshipInspector');
function openRelationshipInspector(nodeAName, nodeBName, meta){
  if(!relInspectorEl) return;
  const typeLabel = EDGE_TYPE_LABELS[meta.type] || meta.type || 'غير محدد';
  const strengthLabel = meta.strength ? (EDGE_STRENGTH_LABELS[meta.strength] || meta.strength) : null;
  const confidenceText = (typeof meta.confidence === 'number') ? `${Math.round(meta.confidence*100)}%` : null;
  const evidence = Array.isArray(meta.evidence) ? meta.evidence : [];
  relInspectorEl.innerHTML = `
    <button class="drawer-close" id="relInspectorClose">×</button>
    <div class="ri-title">${escapeHtml(getDisplayName(nodeAName))} <span class="ri-arrow">↔</span> ${escapeHtml(getDisplayName(nodeBName))}</div>
    <div class="ri-row"><span class="ri-label">النوع</span><span class="ri-val" style="color:${EDGE_TYPE_COLORS[meta.type]||'inherit'}">${escapeHtml(typeLabel)}</span></div>
    ${strengthLabel ? `<div class="ri-row"><span class="ri-label">القوة</span><span class="ri-val">${escapeHtml(strengthLabel)}</span></div>` : ''}
    ${confidenceText ? `<div class="ri-row"><span class="ri-label">مستوى الثقة</span><span class="ri-val">${confidenceText}</span></div>` : ''}
    ${meta.explanation ? `<div class="ri-explain">${linkifyNodeMentions(meta.explanation)}</div>` : ''}
    ${evidence.length ? `<div class="ri-evidence">${evidence.map(ev=>{
      const url = typeof ev === 'string' ? ev : (ev.url || '');
      const label = typeof ev === 'string' ? ev : (ev.label || ev.url || '');
      return isSafeUrl(url) ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : '';
    }).join('')}</div>` : ''}
  `;
  relInspectorEl.style.display = 'block';
  const closeBtn = document.getElementById('relInspectorClose');
  if(closeBtn) closeBtn.onclick = ()=> relInspectorEl.style.display = 'none';
}

// ============================================================
// المرحلة 5 — تنقل متقدم
// ============================================================

