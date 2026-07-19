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
  await migrateLegacyMetaIfNeeded();
  try{
    const r = await localStore.get('meta:customNodes');
    if(r && r.value){
      const custom = JSON.parse(r.value);
      custom.forEach(n=>{ nodes.push(n); nameIndex[n.name.trim()] = n; });
    }
  }catch(e){}
  try{
    const r = await localStore.get('meta:categoryOverrides');
    if(r && r.value){
      const overrides = JSON.parse(r.value);
      Object.keys(overrides).forEach(id=>{
        const n = nodes.find(x=>x.id===Number(id));
        if(n) n.category = overrides[id];
      });
    }
  }catch(e){}
  try{
    const r = await localStore.get('meta:extraLinks');
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
    const r = await localStore.get('meta:sourcesOverrides');
    if(r && r.value){
      const overrides = JSON.parse(r.value);
      Object.keys(overrides).forEach(id=>{
        const n = nodes.find(x=>x.id===Number(id));
        if(n) n.sources = overrides[id];
      });
    }
  }catch(e){}
  try{
    const r = await localStore.get('meta:hubSummaryOverrides');
    if(r && r.value){
      const overrides = JSON.parse(r.value);
      Object.keys(overrides).forEach(id=>{
        const n = nodes.find(x=>x.id===Number(id));
        if(n) n.hubSummary = overrides[id];
      });
    }
  }catch(e){}
  try{
    const r = await localStore.get('meta:noteTagIndex');
    if(r && r.value){
      noteTagIndex = JSON.parse(r.value);
    }
  }catch(e){}
}

async function loadEdgeMetaOverrides(){
  try{
    const r = await localStore.get('meta:edgeMetaOverrides');
    if(r && r.value){
      const overrides = JSON.parse(r.value);
      window.EDGE_META = Object.assign({}, window.EDGE_META, overrides);
    }
  }catch(e){}
}
async function saveEdgeMetaOverride(key, meta){
  let overrides = {};
  try{
    const r = await localStore.get('meta:edgeMetaOverrides');
    if(r && r.value) overrides = JSON.parse(r.value);
  }catch(e){}
  overrides[key] = meta;
  await localStore.set('meta:edgeMetaOverrides', JSON.stringify(overrides));
  window.EDGE_META[key] = meta;
}

// ============================================================
// ميزة "جهّز طلب بحث" — ربط بحث خارجي (Claude + بحث الويب) بالعقدة الحالية
// ============================================================
// ملاحظة تصميم مهمة: التطبيق ده ملف ثابت (GitHub Pages)، مفيش سيرفر خلفي وماينفعش نحط مفتاح
// Anthropic API جوه كود JS ظاهر للجميع في المتصفح (أي حد فاتح "عرض المصدر" هياخده). فالحل الآمن
// والعملي: التطبيق بيجهّز "طلب بحث" كامل السياق (اسم العقدة، فئتها، روابطها الحالية، وفهرس بكل
// أسماء العقد التانية عشان الموديل يقدر يكتشف روابط حقيقية بينها)، المستخدم يلزقه في محادثة Claude
// عادية فيها بحث الويب، وبعدين يلزق الرد هنا — والتطبيق بيتحقق ويعاين قبل ما يطبّق أي تغيير فعلي.
// أرقام العقد اللي بتمثل السلسلة اللاهوتية الخطية (من "1 وجود الله" لحد "12.1 أمر الله بالسجود")
// دي سلسلة سردية واحدة بلا تشعب حقيقي، فمحتاجة برومبت مختلف تمامًا عن باقي الشبكة (13 فما فوق).
const THEOLOGICAL_CHAIN_IDS = new Set([1170,1171,1172,1173,1174,1175,1176,1177,1178,1179, 33,14,15,16,17]);

function isTheologicalChainNode(node){
  return THEOLOGICAL_CHAIN_IDS.has(node.id);
}

function buildResearchPrompt(node){
  return buildUnifiedResearchPrompt(node);
}
function buildUnifiedResearchPrompt(node){
  const existingConn = (node.connections||[]).join('، ') || 'لا يوجد';
  const existingSources = Array.isArray(node.sources) && node.sources.length
    ? node.sources.map(s=> `- ${s.label} — ${s.url}`).join('\n')
    : '(لا يوجد)';
  const existingSummary = node.hubSummary ? node.hubSummary : '(لا يوجد)';

  return isTheologicalChainNode(node)
    ? buildTheologicalUnifiedPrompt(node, existingConn, existingSources, existingSummary)
    : buildEncyclopedicUnifiedPrompt(node, existingConn, existingSources, existingSummary);
}

// ---- الصيغة B: السلسلة اللاهوتية الخطية (عقد 1 لحد 12.1) — مقال + JSON في رد واحد ----
function buildTheologicalUnifiedPrompt(node, existingConn, existingSources, existingSummary){
  const chainNames = nodes
    .filter(n=> THEOLOGICAL_CHAIN_IDS.has(n.id))
    .map(n=> `${n.name} [#${n.id}]`)
    .join(' | ');

  return `أنت باحث متخصص في التفسير وعلوم القرآن والسيرة النبوية. مطلوب منك رد واحد فيه جزءان، بحث حقيقي وموثّق (تفاسير معتمدة، أحاديث، مصادر أكاديمية إسلامية)، بدون اختراع أي معلومة أو مصدر.

## العقدة المطلوب البحث عنها
الاسم: ${node.name}
الفئة: ${node.category}
السياق: هذه العقدة جزء من تسلسل سردي خطّي واحد (قصة الخلق من وجود الله وحده إلى إسكان آدم الجنة)، وليست جزءًا من شبكة العلاقات المتشعبة الكبيرة في باقي قاعدة المعرفة.
الروابط الحالية المسجّلة يدويًا: ${existingConn}
الملخص الحالي (لو موجود): ${existingSummary}
المصادر الحالية (لو موجودة):
${existingSources}

## الجزء الأول — المقال الكامل (Markdown خام، طوله التقريبي 5000 كلمة)
اكتب مقالًا بحثيًا كاملًا بهذا الهيكل بالظبط:
# ${node.name}
## مقدمة
## الخلفية والسياق القرآني والتفسيري
## الوصف الكامل
## أقوال المفسرين
### التفسير عند المتقدمين (الطبري، ابن كثير، القرطبي، إلخ)
### التفسير عند المتأخرين والمعاصرين (لو فيه اختلاف يُذكر)
### نقاط الخلاف بين المفسرين (لو وُجدت)، بدون ترجيح شخصي منك
## الأحاديث ذات الصلة
## الدروس والعبر
## الخلاصة

قواعد المقال:
- كل معلومة لازم تتنسب لمصدرها (اسم المفسر/الكتاب/رقم الآية). ممنوع اختراع أي آية أو حديث أو قول لم تتأكد منه.
- لو فيه خلاف بين المفسرين، اعرض الرأيين بحياد بدون ترجيح.
- الأسلوب: هادئ، تأملي، روحاني، بدون جدل أو تعقيد زائد.
- الطول المستهدف: قريب من 5000 كلمة (لو مفيش مادة كافية، اكتب بقدر ما هو متاح بمصداقية بدل الحشو).
- عند ذكر أي عقدة من "عقد السلسلة اللاهوتية" تحت جوه متن المقال، اكتبها بصيغة "الاسم [#رقم]" بالظبط زي ما هي مكتوبة، عشان تبقى قابلة للربط.

## عقد السلسلة اللاهوتية (للسياق وللربط الداخلي جوه المقال فقط)
${chainNames}

## الجزء الثاني — بيانات مهيكلة (JSON)
بعد ما تخلّص المقال كامل، ضيف السطر التالي بالظبط في سطر لوحده:
---JSON-DATA---
وبعده كتلة \`\`\`json مباشرة فيها:
- hubSummary: انسخ فيه نفس نص قسم "## الخلاصة" اللي كتبته في المقال فوق بالظبط (مش كتابة جديدة منفصلة) — الهدف بس إتاحته كمعاينة سريعة في أماكن تانية بالموقع
- sources: 2-5 مصادر حقيقية فقط
- suggestedConnections: روابط استثنائية جدًا (بس لو فيه نص تفسيري أو حديثي صريح يربط هذه العقدة بعقدة تانية من نفس السلسلة، أو بشخصية دينية موثقة تاريخيًا زي ربط "تحوت" بـ"إدريس عليه السلام"). كل رابط: targetName (بالظبط مع #رقم)، reason (جملة كاملة بالمصدر)، type (religious/historical/alias)، strength (strong/medium).

مثال شكل الكتلة:
\`\`\`json
{
  "hubSummary": "...",
  "sources": [{"label": "...", "url": "https://..."}],
  "suggestedConnections": [{"targetName": "الاسم [#رقم]", "reason": "...", "type": "religious", "strength": "strong"}]
}
\`\`\`

ابدأ الرد مباشرة بـ "# ${node.name}" بدون أي مقدمة أو تعليق منك قبلها، وخلّي كتلة الـ JSON آخر حاجة في الرد.`;
}

// ---- الصيغة A: الشبكة الموسوعية الكاملة (عقد 13.0 فما فوق) — مقال + JSON في رد واحد ----
function buildEncyclopedicUnifiedPrompt(node, existingConn, existingSources, existingSummary){
  const byCat = {};
  nodes.forEach(n=>{
    if(THEOLOGICAL_CHAIN_IDS.has(n.id)) return;
    (byCat[n.category] = byCat[n.category]||[]).push(`${n.name} [#${n.id}]`);
  });
  const indexText = Object.keys(byCat).sort().map(cat=> `### ${cat}\n${byCat[cat].join(' | ')}`).join('\n\n');

  return `أنت باحث تاريخي واستقصائي متخصص في بناء قواعد المعرفة (Knowledge Graph)، ملتزم بالحياد العلمي والتمييز الواضح بين الحقائق التاريخية، والفرضيات، والادعاءات، ونظريات المؤامرة. مطلوب منك رد واحد فيه جزءان، بدون اختراع أي معلومة أو مصدر.

اعتمد على أكبر عدد ممكن من المصادر المتنوعة الحقيقية (كتب أكاديمية، أبحاث محكّمة، وثائق حكومية، أرشيفات وطنية، صحف تاريخية، مواقع رسمية، كتب مؤيدة، كتب معارضة، موسوعات)، ولا تعتمد على ويكيبيديا وحدها. صنّف كل معلومة حسب مستوى الدليل (حقيقة تاريخية موثقة / حقيقة علمية / ادعاء / فرضية / رواية شفهية / نظرية مؤامرة / رأي شخصي / تفسير أكاديمي / تفسير بديل).

## العقدة المطلوب البحث عنها
الاسم: ${node.name}
الفئة: ${node.category}
الروابط الحالية المسجّلة يدويًا: ${existingConn}
الملخص الحالي (لو موجود): ${existingSummary}
المصادر الحالية (لو موجودة):
${existingSources}

## الجزء الأول — المقال الكامل (Markdown خام، طوله التقريبي 5000 كلمة)
اكتب دراسة موسوعية نقدية شاملة بهذا الهيكل بالظبط:
# ${node.name}
## مقدمة
## الخلفية التاريخية
## الوصف الكامل
## التسلسل الزمني
## الآراء المختلفة
### الرأي الأكاديمي
### الرأي المؤيد
### الرأي المعارض
### الرأي الوسطي
### رأي الثقافة الشعبية
## تحليل الأدلة
اكتب جدول Markdown بأعمدة: الدليل | النوع | المصدر | قوة الدليل
## تقييم الموثوقية
صنّف أهم المعلومات بنجوم: ★★★★★ موثق جدًا / ★★★★ جيد / ★★★ متوسط / ★★ ضعيف / ★ ادعاء فقط
## تحليل علمي أو تاريخي
## الانتقادات
## تأثير العقدة
## الخلاصة

قواعد المقال:
- عند أول ذكر لأي عقدة تانية موجودة في "فهرس العقد" تحت جوه متن المقال، اكتبها بصيغة "الاسم [#رقم]" بالظبط، ووضّح طبيعة العلاقة في نفس الجملة (حقيقة، ادعاء، فرضية، أو رابط شائع في أدبيات المؤامرة) — لا تكتفِ بذكر الاسم مجردًا.
- ممنوع اختراع أي مصدر أو اقتباس أو تاريخ لم تتأكد منه من بحثك الفعلي.
- الطول المستهدف: قريب من 5000 كلمة موزّعة بتناسب على الأقسام (مش حشو فاضي).

## فهرس العقد الموجودة بالفعل (للربط جوه المقال ومن ضمن suggestedConnections تحت — السلسلة اللاهوتية 1-12.1 مستبعدة لأنها سلسلة منفصلة)
${indexText}

## الجزء الثاني — بيانات مهيكلة (JSON)
بعد ما تخلّص المقال كامل، ضيف السطر التالي بالظبط في سطر لوحده:
---JSON-DATA---
وبعده كتلة \`\`\`json مباشرة فيها:
- hubSummary: انسخ فيه نفس نص قسم "## الخلاصة" اللي كتبته في المقال فوق بالظبط (مش كتابة جديدة منفصلة)، صنّف فيه طبيعة المعلومة صراحة زي ما فوق
- sources: 2-6 مصادر حقيقية فقط
- suggestedConnections: لكل رابط حقيقي وموثّق لقيته فعليًا من بحثك (مش تخمين ولا تشابه اسم/موضوع): targetName (بالظبط من الفهرس مع #رقم)، reason (جملة تعليل كاملة بمصدر الربط)، type (اختر من: alias, historical, thematic, evidence, organizational, opposing, claimed, speculative, conspiracy, popularized, debunked, disputed, indirect, influence, scientific, ideological, intelligence, financial, military, religious, cultural, symbolic)، strength (very_strong/strong/medium/weak/very_weak/unknown)، evidenceLevel (documented_fact/scientific_fact/claim/hypothesis/oral_account/conspiracy_theory/personal_opinion/academic_interpretation/alternative_interpretation)، sourceCategory (نوع المصدر كنص)

مثال شكل الكتلة:
\`\`\`json
{
  "hubSummary": "...",
  "sources": [{"label": "...", "url": "https://..."}],
  "suggestedConnections": [{"targetName": "الاسم [#رقم]", "reason": "...", "type": "thematic", "strength": "medium", "evidenceLevel": "claim", "sourceCategory": "..."}]
}
\`\`\`

لو مفيش معلومات موثوقة كافية عن الموضوع، رجّع hubSummary وsources فاضيين ووضّح السبب جوه المقال نفسه، وماتخترعش حاجة.

ابدأ الرد مباشرة بـ "# ${node.name}" بدون أي مقدمة أو تعليق منك قبلها، وخلّي كتلة الـ JSON آخر حاجة في الرد.`;
}

const researchOverlay = document.getElementById('researchOverlay');
const researchNodeBtnEl = document.getElementById('researchNodeBtn');
const researchPromptOut = document.getElementById('researchPromptOut');
const researchImportIn = document.getElementById('researchImportIn');
const researchPreviewEl = document.getElementById('researchPreview');
let lastResearchParsed = null;

function openResearchModal(){
  if(!researchOverlay || !currentNode) return;
  researchPromptOut.value = buildUnifiedResearchPrompt(currentNode);
  researchImportIn.value = '';
  researchPreviewEl.innerHTML = '';
  lastResearchParsed = null;
  UI.Modal.open('researchOverlay');
}
function closeResearchModal(){ if(researchOverlay) UI.Modal.close('researchOverlay'); }
if(researchNodeBtnEl) researchNodeBtnEl.onclick = openResearchModal;
const closeResearchBtn = document.getElementById('closeResearch');
if(closeResearchBtn) closeResearchBtn.onclick = closeResearchModal;
if(researchOverlay) researchOverlay.onclick = (e)=>{ if(e.target===researchOverlay) closeResearchModal(); };

const copyResearchPromptBtn = document.getElementById('copyResearchPromptBtn');
if(copyResearchPromptBtn){
  copyResearchPromptBtn.onclick = async ()=>{
    try{
      await navigator.clipboard.writeText(researchPromptOut.value);
      copyResearchPromptBtn.textContent = '✅ اتنسخ';
      setTimeout(()=> copyResearchPromptBtn.textContent = '📋 نسخ النص', 1500);
    }catch(e){
      researchPromptOut.select();
      document.execCommand && document.execCommand('copy');
    }
  };
}

function parseUnifiedResponse(text){
  text = (text||'').trim();
  if(!text) throw new Error('المربع فاضي — الصق رد Claude الأول.');

  let jsonRaw, articleMarkdown;

  // الحالة 1: كتلة ```json ... ``` (المتوقعة في آخر الرد بعد المقال)
  const jsonFenceMatches = [...text.matchAll(/```json\s*([\s\S]*?)```/gi)];
  if(jsonFenceMatches.length){
    const last = jsonFenceMatches[jsonFenceMatches.length-1];
    jsonRaw = last[1];
    articleMarkdown = text.slice(0, last.index).replace(/---JSON-DATA---\s*$/,'').trim();
  } else {
    // الحالة 2: مفيش ```json fence لكن فيه ماركر ---JSON-DATA---
    const markerIdx = text.indexOf('---JSON-DATA---');
    if(markerIdx !== -1){
      articleMarkdown = text.slice(0, markerIdx).trim();
      jsonRaw = text.slice(markerIdx + '---JSON-DATA---'.length);
    } else if(text.startsWith('{') && text.endsWith('}')){
      // الحالة 3: الرد كله JSON خام بدون مقال وبدون أي فواصل — نعتبره الجزء التاني بس، والمقال فاضي
      jsonRaw = text;
      articleMarkdown = '';
    } else {
      throw new Error('معرفتش ألاقي كتلة JSON في الرد — تأكد إن الرد فيه المقال كامل وبعده كتلة ```json``` في الآخر، أو الصق JSON خام بس.');
    }
  }

  let parsed;
  try{ parsed = JSON.parse(jsonRaw.trim()); }
  catch(e){ throw new Error('كتلة الـ JSON مش صحيحة الصياغة — تأكد إنك لاصق الرد كامل بدون تعديل.'); }
  if(typeof parsed !== 'object' || parsed===null) throw new Error('شكل بيانات JSON غير متوقع.');

  return { articleMarkdown, parsed };
}

const previewResearchBtn = document.getElementById('previewResearchBtn');
if(previewResearchBtn){
  previewResearchBtn.onclick = ()=>{
    let result;
    try{ result = parseUnifiedResponse(researchImportIn.value); }
    catch(e){ researchPreviewEl.innerHTML = `<div class="rp-block" style="color:#e0674f;">${escapeHtml(e.message)}</div>`; return; }

    const { articleMarkdown, parsed } = result;
    const summary = typeof parsed.hubSummary === 'string' ? parsed.hubSummary.trim() : '';
    const sources = Array.isArray(parsed.sources) ? parsed.sources.filter(s=> s && s.url && isSafeUrl(s.url)) : [];
    const suggestions = Array.isArray(parsed.suggestedConnections) ? parsed.suggestedConnections : [];

    const matched = suggestions.map(s=>{
      const raw = (s.targetName||'').trim();
      const idMatch = raw.match(/#(\d+)/);
      let target = idMatch ? nodes.find(n=>n.id===Number(idMatch[1])) : null;
      if(!target) target = nodes.find(n=> n.name.trim() === raw.replace(/\s*\[#\d+\]\s*$/,'').trim());
      return { ...s, target };
    });

    lastResearchParsed = { summary, sources, matched, articleMarkdown };

    let html = '';
    html += `<div class="rp-block"><h4>المقال (${articleMarkdown ? articleMarkdown.split(/\s+/).length : 0} كلمة تقريبًا)</h4>${articleMarkdown ? `<div class="rp-article-preview">${escapeHtml(articleMarkdown.slice(0,400))}…</div>` : '<em style="color:var(--muted)">مفيش مقال — اتأكد إنك لصقت الرد كامل</em>'}</div>`;
    html += `<div class="rp-block"><h4>الملخص</h4>${summary ? escapeHtml(summary) : '<em style="color:var(--muted)">فاضي</em>'}</div>`;
    html += `<div class="rp-block"><h4>المصادر (${sources.length})</h4>${sources.length ? sources.map(s=>`<div>• ${escapeHtml(s.label||s.url)}</div>`).join('') : '<em style="color:var(--muted)">لا يوجد</em>'}</div>`;
    html += `<div class="rp-block"><h4>روابط مقترحة (${matched.length})</h4>`;
    if(!matched.length){
      html += '<em style="color:var(--muted)">لا يوجد</em>';
    } else {
      html += matched.map((m,i)=>{
        const unmatchedCls = m.target ? '' : ' rp-unmatched';
        const label = m.target ? getDisplayName(m.target.name) : `${m.targetName} (⚠️ لم يتم إيجاد عقدة مطابقة بهذا الاسم بالضبط)`;
        return `<label class="rp-conn-row${unmatchedCls}">
          <input type="checkbox" class="rp-conn-check" data-idx="${i}" ${m.target ? 'checked':'disabled'}>
          <span>${escapeHtml(label)}<br><span class="rp-conn-reason">${escapeHtml(m.reason||'')} — ${escapeHtml(m.type||'')}/${escapeHtml(m.strength||'')}${m.evidenceLevel ? ' — ' + escapeHtml(m.evidenceLevel) : ''}${m.sourceCategory ? ' (' + escapeHtml(m.sourceCategory) + ')' : ''}</span></span>
        </label>`;
      }).join('');
    }
    html += '</div>';
    html += `<div class="rp-apply-actions"><button id="applyResearchBtn" class="analysis-primary-btn">✅ طبّق المقال + الروابط على العقدة الحالية</button></div>`;
    researchPreviewEl.innerHTML = html;

    document.getElementById('applyResearchBtn').onclick = applyResearchResults;
  };
}

async function applyResearchResults(){
  if(!lastResearchParsed || !currentNode) return;
  const { summary, sources, matched, articleMarkdown } = lastResearchParsed;
  if(articleMarkdown){
    notesEl.value = articleMarkdown;
    notesEl.dispatchEvent(new Event('input')); // يشغّل نفس آلية الحفظ التلقائي الموجودة أصلاً
  }
  if(summary) await saveHubSummaryOverride(currentNode.id, summary);
  if(sources.length){
    const existing = Array.isArray(currentNode.sources) ? currentNode.sources : [];
    const merged = existing.slice();
    sources.forEach(s=>{ if(!merged.some(e=>e.url===s.url)) merged.push({ label: s.label||s.url, url: s.url }); });
    await saveSourcesOverride(currentNode.id, merged);
    currentNode.sources = merged;
  }
  const checks = researchPreviewEl.querySelectorAll('.rp-conn-check:checked');
  for(const chk of checks){
    const m = matched[Number(chk.dataset.idx)];
    if(!m || !m.target) continue;
    await saveExtraLink(currentNode.id, m.target.id);
    const key = edgeMetaKey(currentNode.name, m.target.name);
    await saveEdgeMetaOverride(key, {
      type: m.type || 'thematic',
      strength: m.strength || 'medium',
      explanation: m.reason || '',
      evidence: sources.map(s=>({ label:s.label, url:s.url }))
    });
    if(!currentNode.connections.includes(m.target.name)) currentNode.connections.push(m.target.name);
  }
  if(summary) currentNode.hubSummary = summary;
  closeResearchModal();
  openNode(currentNode, false, { skipUrlUpdate:true }); // إعادة رسم الـ drawer بالبيانات الجديدة
}

async function saveCustomNodes(){
  const custom = nodes.filter(n=>n.custom);
  await localStore.set('meta:customNodes', JSON.stringify(custom));
}
async function saveCategoryOverrides(id, cat){
  let overrides = {};
  try{
    const r = await localStore.get('meta:categoryOverrides');
    if(r && r.value) overrides = JSON.parse(r.value);
  }catch(e){}
  overrides[id] = cat;
  await localStore.set('meta:categoryOverrides', JSON.stringify(overrides));
}
async function saveSourcesOverride(id, sources){
  let overrides = {};
  try{
    const r = await localStore.get('meta:sourcesOverrides');
    if(r && r.value) overrides = JSON.parse(r.value);
  }catch(e){}
  if(sources && sources.length) overrides[id] = sources;
  else delete overrides[id];
  await localStore.set('meta:sourcesOverrides', JSON.stringify(overrides));
}
async function saveHubSummaryOverride(id, text){
  let overrides = {};
  try{
    const r = await localStore.get('meta:hubSummaryOverrides');
    if(r && r.value) overrides = JSON.parse(r.value);
  }catch(e){}
  if(text) overrides[id] = text;
  else delete overrides[id];
  await localStore.set('meta:hubSummaryOverrides', JSON.stringify(overrides));
}
async function saveNoteTagIndexEntry(id, tags){
  if(tags && tags.length) noteTagIndex[id] = tags;
  else delete noteTagIndex[id];
  await localStore.set('meta:noteTagIndex', JSON.stringify(noteTagIndex));
}
async function saveExtraLink(aId, bId){
  let links = [];
  try{
    const r = await localStore.get('meta:extraLinks');
    if(r && r.value) links = JSON.parse(r.value);
  }catch(e){}
  links.push([aId, bId]);
  await localStore.set('meta:extraLinks', JSON.stringify(links));
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
  UI.Modal.open('newNodeOverlay');
};
document.getElementById('newNodeCancel').onclick = ()=>{
  UI.Modal.close('newNodeOverlay');
};
document.getElementById('newNodeSave').onclick = async ()=>{
  const name = document.getElementById('newNodeName').value.trim();
  const cat = document.getElementById('newNodeCat').value;
  if(!name) return;
  const newNode = { id: nextCustomId++, name, category: cat, connections: [], added: true, custom: true };
  nodes.push(newNode);
  nameIndex[name] = newNode;
  await saveCustomNodes();
  UI.Modal.close('newNodeOverlay');
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

