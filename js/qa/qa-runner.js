// ---- QA Self-Check Runner (dev console only, no UI impact) ----
// Phase 4: PASS/FAIL/WARN system across 7 categories, built ONLY from checks
// that were already present (Category 2 duplicate-name + Category 3 orphan-link,
// carried over unchanged from the pre-Phase-4 version) plus new categories that
// verify structure already documented in Checkpoint 3/4/5/6 reports -- no
// theoretical checks invented against code that doesn't exist.
(function runQASelfCheck(){
  try{
    const results = []; // {category, status: 'PASS'|'FAIL'|'WARN', detail}
    function report(category, status, detail){ results.push({category, status, detail}); }

    // ---- 1) سلامة تحميل الوحدات (Module Load Integrity) ----
    // يعتمد على window.__moduleLoadErrors اللي بيتسجّل فيها في app.js onerror
    const loadErrors = window.__moduleLoadErrors || [];
    if(loadErrors.length){
      report('1. سلامة تحميل الوحدات', 'FAIL', 'وحدات فشل تحميلها: ' + loadErrors.join(', '));
    } else {
      report('1. سلامة تحميل الوحدات', 'PASS', 'كل الوحدات الـ 19 اتحمّلت بنجاح');
    }

    // ---- 2) تكامل بيانات العقد (Data Integrity) ----
    const seenNames = new Set();
    const seenIds = new Set();
    const dataIssues = [];
    nodes.forEach(n=>{
      if(seenNames.has(n.name)) dataIssues.push('تكرار اسم عقدة: ' + n.name);
      seenNames.add(n.name);
      if(seenIds.has(n.id)) dataIssues.push('تكرار id عقدة: ' + n.id);
      seenIds.add(n.id);
      if(n.id == null || !n.name || !n.category || !Array.isArray(n.connections)){
        dataIssues.push('عقدة بحقول ناقصة: id=' + n.id);
      }
    });
    if(dataIssues.length){
      report('2. تكامل بيانات العقد', 'FAIL', dataIssues.length + ' مشكلة: ' + dataIssues.slice(0,5).join(' | ') + (dataIssues.length>5? ' …' : ''));
    } else {
      report('2. تكامل بيانات العقد', 'PASS', nodes.length + ' عقدة، لا تكرار في id أو name، كل الحقول الأساسية موجودة');
    }

    // ---- 3) الروابط المرجعية (Cross-References) ----
    // نفس الفحص الأصلي (orphan connections) -- معلوماتي، مش خطأ بالضرورة
    let orphanCount = 0;
    nodes.forEach(n=> n.connections.forEach(c=>{ if(!findByName(c)) orphanCount++; }));
    if(orphanCount > 0){
      report('3. الروابط المرجعية', 'WARN', orphanCount + ' رابط بلا عقدة مطابقة (متوقع جزئيًا، معلوماتي فقط)');
    } else {
      report('3. الروابط المرجعية', 'PASS', 'كل الروابط بتشاور على عقد موجودة فعليًا');
    }

    // ---- 4) عناصر الواجهة الأساسية (Core DOM) ----
    const coreIds = ['search','grid','graphSvg','drawer','editModeBtn'];
    const missingCore = coreIds.filter(id=> !document.getElementById(id));
    if(missingCore.length){
      report('4. عناصر الواجهة الأساسية', 'FAIL', 'عناصر مفقودة: #' + missingCore.join(', #'));
    } else {
      report('4. عناصر الواجهة الأساسية', 'PASS', 'كل عناصر الواجهة الأساسية موجودة (' + coreIds.length + ')');
    }

    // ---- 5) بنية المودالات الأربعة (Modal Infrastructure) ----
    // فحص بنيوي (وجود + حالة ابتدائية) فقط -- لا يستدعي أي دالة فتح/إغلاق،
    // فمنفصل تمامًا عن سلوك الترحيل في Checkpoint 5 اللي لسه معلّق اختباره.
    const modalMap = {
      newNodeOverlay: ['addNodeBtn','newNodeCancel','newNodeSave'],
      analysisOverlay: ['analysisToolsBtn','closeAnalysis'],
      investigationOverlay: ['investigationBtn','closeInvestigation'],
      researchOverlay: ['researchNodeBtn','closeResearch']
    };
    const modalIssues = [];
    Object.keys(modalMap).forEach(overlayId=>{
      const el = document.getElementById(overlayId);
      if(!el){ modalIssues.push('عنصر Overlay مفقود: #' + overlayId); return; }
      const isShowing = el.classList.contains('show') || el.style.display === 'flex';
      if(isShowing) modalIssues.push('#' + overlayId + ' مفتوح افتراضيًا عند التحميل (غير متوقع)');
      modalMap[overlayId].forEach(btnId=>{
        if(!document.getElementById(btnId)) modalIssues.push('زر مفقود: #' + btnId + ' (خاص بـ #' + overlayId + ')');
      });
    });
    if(modalIssues.length){
      report('5. بنية المودالات الأربعة', 'FAIL', modalIssues.join(' | '));
    } else {
      report('5. بنية المودالات الأربعة', 'PASS', 'الأربع Overlays وأزرارها موجودة، وكلها مقفولة عند التحميل');
    }

    // ---- 6) مكتبة المكوّنات (Component Library) ----
    const uiIssues = [];
    if(typeof window.UI !== 'object') uiIssues.push('window.UI غير معرَّف');
    else {
      if(typeof window.UI.Button !== 'function') uiIssues.push('UI.Button غير معرَّفة كدالة');
      if(!window.UI.Modal || typeof window.UI.Modal.open !== 'function') uiIssues.push('UI.Modal.open غير معرَّفة كدالة');
      if(!window.UI.Modal || typeof window.UI.Modal.close !== 'function') uiIssues.push('UI.Modal.close غير معرَّفة كدالة');
    }
    if(uiIssues.length){
      report('6. مكتبة المكوّنات', 'FAIL', uiIssues.join(' | '));
    } else {
      report('6. مكتبة المكوّنات', 'PASS', 'UI.Button وUI.Modal.open/close معرَّفين وجاهزين');
    }

    // ---- 7) تناسق الفئات (Category Consistency) ----
    // كل category لعقدة لازم يكون موجود ضمن CATS_ALL المعرَّفة مركزيًا
    const catSet = new Set((typeof CATS_ALL !== 'undefined') ? CATS_ALL : []);
    const unknownCats = new Set();
    nodes.forEach(n=>{ if(!catSet.has(n.category)) unknownCats.add(n.category); });
    if(typeof CATS_ALL === 'undefined'){
      report('7. تناسق الفئات', 'WARN', 'CATS_ALL غير معرَّفة -- تعذّر الفحص');
    } else if(unknownCats.size){
      report('7. تناسق الفئات', 'FAIL', 'فئات عقد غير معرَّفة في CATS_ALL: ' + Array.from(unknownCats).join(', '));
    } else {
      report('7. تناسق الفئات', 'PASS', 'كل فئات العقد موجودة ضمن CATS_ALL (' + catSet.size + ' فئة)');
    }

    // ---- الملخّص ----
    const fails = results.filter(r=>r.status==='FAIL');
    const warns = results.filter(r=>r.status==='WARN');
    const passes = results.filter(r=>r.status==='PASS');
    console.groupCollapsed('[QA self-check] ' + passes.length + ' PASS، ' + warns.length + ' WARN، ' + fails.length + ' FAIL');
    results.forEach(r=>{
      const label = r.status === 'FAIL' ? '❌ FAIL' : (r.status === 'WARN' ? '⚠️ WARN' : '✅ PASS');
      const fn = r.status === 'FAIL' ? console.error : (r.status === 'WARN' ? console.warn : console.info);
      fn(label + ' — ' + r.category + ': ' + r.detail);
    });
    console.groupEnd();
  }catch(e){
    console.warn('[QA self-check] تعذر التشغيل:', e);
  }
})();
