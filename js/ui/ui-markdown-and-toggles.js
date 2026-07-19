// ---- تحويل أي إشارة لعقدة بصيغة "الاسم [#رقم]" جوه نص المقال (Markdown) لرابط قابل للنقر ----
function linkifyNodeMentions(html){
  if(!html) return html;
  return html.replace(/([\u0600-\u06FF][\u0600-\u06FFA-Za-z0-9 _\-"'،.:؛()]{0,80}?)\s*\[#(\d+)\]/g, (match, name, id)=>{
    const nid = Number(id);
    const target = (typeof nodes !== 'undefined') ? nodes.find(n=>n.id===nid) : null;
    if(!target) return match;
    return `<span class="mention-link" data-node-id="${nid}" role="button" tabindex="0">${name.trim()} <span class="mention-id">[#${id}]</span></span>`;
  });
}
function bindMentionLinks(container){
  if(!container || container.dataset.mentionsBound) return;
  container.dataset.mentionsBound = '1';
  container.addEventListener('click', (e)=>{
    const el = e.target.closest('.mention-link');
    if(!el) return;
    const nid = Number(el.dataset.nodeId);
    const target = nodes.find(n=>n.id===nid);
    if(target) openNode(target, true);
  });
  container.addEventListener('keydown', (e)=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    const el = e.target.closest('.mention-link');
    if(!el) return;
    e.preventDefault();
    const nid = Number(el.dataset.nodeId);
    const target = nodes.find(n=>n.id===nid);
    if(target) openNode(target, true);
  });
}

// ---- التعرف التلقائي على العناوين جوه المقال حتى لو الموديل ما كتبش #/##/### فعليًا ----
// (بنعتمد على شكل السطر: قصير، من غير نقطة/فاصلة في الآخر، مش جوه اقتباس آية أو حديث)
const ARTICLE_MAIN_TITLES = [
  'مقدمة','الخلفية والسياق القرآني والتفسيري','الخلفية التاريخية','الوصف الكامل',
  'التسلسل الزمني','أقوال المفسرين','الآراء المختلفة','الأحاديث ذات الصلة',
  'تحليل الأدلة','تقييم الموثوقية','تحليل علمي أو تاريخي','تحليل علمي','تحليل تاريخي',
  'الانتقادات','تأثير العقدة','الدروس والعبر','الخلاصة'
];
function looksLikeHeadingLine(t){
  if(!t || t.length < 2 || t.length > 90) return false;
  if(/[﴿﴾«»]/.test(t)) return false; // اقتباس آية أو حديث مش عنوان
  const lastChar = t[t.length-1];
  if('.,،؛؟!»﴾"\'-–—'.includes(lastChar)) return false;
  if(/[.؟!]/.test(t.slice(0,-1))) return false; // فيه نقطة جوه السطر يبقى غالبًا جملة كاملة مش عنوان
  return true;
}
function smartFormatArticle(text, treatFirstLineAsTitle){
  if(treatFirstLineAsTitle === undefined) treatFirstLineAsTitle = true;
  if(!text) return text;
  const lines = text.split('\n');
  const out = [];
  let firstContentSeen = false;
  for(const raw of lines){
    const stripped = raw.replace(/^#{1,6}\s*/, '').trim();
    if(stripped === ''){ out.push(raw); continue; }
    if(!firstContentSeen){
      firstContentSeen = true;
      if(treatFirstLineAsTitle){ out.push('# ' + stripped); continue; }
      // مش عنوان — كمّل التحقق العادي بدل ما نحطها H1 تلقائي
    }
    const isKnownMain = ARTICLE_MAIN_TITLES.some(t2 => stripped === t2 || stripped.startsWith(t2+' ') || stripped.startsWith(t2+'('));
    if(isKnownMain){ out.push('## ' + stripped); continue; }
    if(/^#{1,6}\s/.test(raw) || looksLikeHeadingLine(stripped)){
      out.push('### ' + stripped);
      continue;
    }
    out.push(raw);
  }
  return out.join('\n');
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
    const raw = window.marked ? window.marked.parse(smartFormatArticle(notesEl.value || '')) : notesEl.value;
    articlePreview.innerHTML = linkifyNodeMentions(raw);
    bindMentionLinks(articlePreview);
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

