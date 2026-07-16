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

// ============================================================
// المرحلة 4 — التحقيق والمسارات (Investigation Path — نسخة مصغّرة)
// كل التخزين هنا مبني على نفس نمط IndexedDB الحقيقي (localStore) المستخدم فعليًا في الملاحظات،
// صفر تغيير في nodes.json أو بنية العقدة — كل البيانات دي overlay منفصل تمامًا.
// ============================================================

