// ---- Stage 1 / item 6: name display mode (both / ar / en) ----
// Node names in this dataset commonly follow the pattern "الاسم العربي (English Name)".
// This is a purely presentational transform -- it never touches node.name or any stored data.
let nameMode = 'both';
function getDisplayName(fullName){
  if(nameMode === 'both' || !fullName) return fullName;
  const m = fullName.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if(!m) return fullName; // no "(...)" part -- nothing to split, show as-is
  const arPart = m[1].trim(), enPart = m[2].trim();
  if(nameMode === 'ar') return arPart || fullName;
  if(nameMode === 'en') return enPart || fullName;
  return fullName;
}

const catListEl = document.getElementById('catList');
const gridEl = document.getElementById('grid');
const statTotal = document.getElementById('statTotal');
const statAdded = document.getElementById('statAdded');
const statShown = document.getElementById('statShown');

function renderCatList(){
  catListEl.innerHTML = '';
  CATS.forEach(cat=>{
    const count = nodes.filter(n=>n.category===cat).length;
    const div = document.createElement('div');
    const isActive = activeCats.has(cat) && activeCats.size < CATS.length;
    div.className = 'cat-item' + (isActive ? ' active' : '');
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-pressed', String(isActive));
    div.setAttribute('aria-label', `فلترة حسب فئة ${cat}، ${count} عقدة`);
    // ---- Stage 5 / item 2: فلترة مركّبة — checkbox لاختيار/استبعاد الفئة دون التأثير على باقي الفئات المختارة ----
    const checked = activeCats.has(cat);
    div.innerHTML = `<input type="checkbox" class="cat-checkbox" ${checked?'checked':''} title="تضمين/استبعاد ${cat} من العرض دون التأثير على باقي الفئات المختارة" aria-label="تضمين فئة ${cat}"><span class="dot" style="background:${CAT_COLORS[cat]||'#666'}"></span><span>${cat}</span><span class="cat-count">${count}</span><button class="cat-graph-btn" title="عرض كشبكة تفاعلية" aria-label="عرض فئة ${cat} كشبكة تفاعلية">🕸️</button>`;
    div.querySelector('span:nth-child(2)').parentElement.onclick = null;
    const activateCat = ()=>{
      if(activeCats.size===1 && activeCats.has(cat)){
        activeCats = new Set(CATS);
      } else {
        activeCats = new Set([cat]);
      }
      renderCatList(); renderMainView();
      closeAsideMenu();
    };
    const checkboxEl = div.querySelector('.cat-checkbox');
    checkboxEl.onclick = (e)=> e.stopPropagation();
    checkboxEl.onchange = ()=>{
      if(checkboxEl.checked) activeCats.add(cat);
      else activeCats.delete(cat);
      if(activeCats.size===0) activeCats = new Set(CATS); // لا يُسمح بعرض فارغ تمامًا — رجوع تلقائي لكل الفئات
      renderCatList(); renderMainView();
    };
    div.onclick = (e)=>{
      if(e.target.classList.contains('cat-graph-btn')){
        activeCats = new Set([cat]);
        renderCatList();
        switchToView('graph');
        closeAsideMenu();
        return;
      }
      if(e.target === checkboxEl) return;
      activateCat();
    };
    div.onkeydown = (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); activateCat(); }
    };
    catListEl.appendChild(div);
  });
}

const resetFilterFn = ()=>{ activeCats = new Set(CATS); renderCatList(); renderMainView(); closeAsideMenu(); };
document.getElementById('resetFilter').onclick = resetFilterFn;
document.getElementById('resetFilter').onkeydown = (e)=>{
  if(e.key==='Enter' || e.key===' '){ e.preventDefault(); resetFilterFn(); }
};

// ---- mobile aside menu (قسم 6 — responsive) ----
const menuToggle = document.getElementById('menuToggle');
const mobileAside = document.getElementById('mobileAside');
const asideOverlay = document.getElementById('asideOverlay');
function openAsideMenu(){
  mobileAside.classList.add('open');
  asideOverlay.classList.add('show');
  menuToggle.setAttribute('aria-expanded', 'true');
}
function closeAsideMenu(){
  mobileAside.classList.remove('open');
  asideOverlay.classList.remove('show');
  menuToggle.setAttribute('aria-expanded', 'false');
}
menuToggle.addEventListener('click', ()=>{
  if(mobileAside.classList.contains('open')) closeAsideMenu(); else openAsideMenu();
});
asideOverlay.addEventListener('click', closeAsideMenu);

const GRID_CHUNK_SIZE = 60;
let gridObserver = null;
let gridFiltered = [];
let gridRenderedCount = 0;

let expandedHubs = new Set();

