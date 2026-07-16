// ---- IndexedDB layer (يعمل مستقلًا في أي متصفح، بدون الاعتماد على بيئة استضافة خاصة) ----
const DB_NAME = 'deepmap_db';
const DB_VERSION = 1;
const STORE_NAME = 'notes';
let dbPromise = null;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject)=>{
    if(!('indexedDB' in window)){ reject(new Error('IndexedDB غير مدعوم في هذا المتصفح')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains(STORE_NAME)){
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e)=> resolve(e.target.result);
    req.onerror = (e)=> reject(e.target.error);
  });
  return dbPromise;
}

async function idbGetNote(id){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = ()=> resolve(req.result ? req.result.value : '');
    req.onerror = ()=> reject(req.error);
  });
}

async function idbSetNote(id, value){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, value });
    tx.oncomplete = ()=> resolve(true);
    tx.onerror = ()=> reject(tx.error);
  });
}

// محاولة ترحيل تلقائي لأي ملاحظات محفوظة سابقًا عبر window.storage (لو الملف اتفتح في بيئة كانت تدعمه)
async function migrateLegacyNoteIfNeeded(id){
  if(!window.storage || typeof window.storage.get !== 'function') return null;
  try{
    const legacy = await window.storage.get(`note:${id}`);
    if(legacy && legacy.value){
      await idbSetNote(id, legacy.value);
      return legacy.value;
    }
  }catch(e){ /* لا يوجد سجل قديم أو البيئة لا تدعمه — تجاهل بصمت */ }
  return null;
}

// ---- BUGFIX (قبل المرحلة 4): تخزين عام مبني على IndexedDB الحقيقي بدل window.storage ----
// window.storage هو API خاص ببيئة معاينة Artifacts في Claude.ai فقط، وغير موجود إطلاقًا على أي
// استضافة حقيقية (GitHub Pages وغيرها). كل استدعاءات window.storage.get/set كانت بتفشل بصمت
// (try/catch يبلعها) على الموقع الفعلي، يعني كل الـ overrides دي (عقد مُضافة، تعديل فئة، روابط
// إضافية، مصادر، ملخص Hub، فهرس الوسوم) كانت بتتفقد فور ما المستخدم يقفل المتصفح على الاستضافة
// الحقيقية رغم إنها بتبان شغالة في نفس الجلسة. الإصلاح: استخدام نفس الـ IndexedDB الحقيقي
// (STORE_NAME='notes', keyPath='id') كمخزن عام مفتاح/قيمة، بنفس مفاتيح "meta:..." المستخدمة قبل كده.
async function idbGet(key){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = ()=> resolve(req.result ? req.result.value : null);
    req.onerror = ()=> reject(req.error);
  });
}
async function idbSet(key, value){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id: key, value });
    tx.oncomplete = ()=> resolve(true);
    tx.onerror = ()=> reject(tx.error);
  });
}
// غلاف بنفس شكل واجهة window.storage القديمة ({value}) عشان الكود الحالي يفضل شغال بأقل تعديل ممكن،
// لكن مبني على IndexedDB الحقيقي بدل الاعتماد على بيئة Artifacts.
const localStore = {
  async get(key){ const value = await idbGet(key); return value == null ? null : { value }; },
  async set(key, value){ await idbSet(key, value); return { value }; }
};
// محاولة ترحيل أي بيانات meta: كانت اتخزنت سابقًا عبر window.storage (لو الملف اتفتح قبل كده
// في معاينة Artifacts) لنفس المفاتيح داخل IndexedDB الحقيقي، مرة واحدة بس.
async function migrateLegacyMetaIfNeeded(){
  if(!window.storage || typeof window.storage.get !== 'function') return;
  const keys = ['meta:customNodes','meta:categoryOverrides','meta:extraLinks','meta:sourcesOverrides','meta:hubSummaryOverrides','meta:noteTagIndex','meta:edgeMetaOverrides','meta:bookmarks','meta:recentlyViewed','meta:investigationPath'];
  for(const k of keys){
    try{
      const existing = await idbGet(k);
      if(existing != null) continue; // موجود بالفعل في IndexedDB الحقيقي، متلمسوش
      const legacy = await window.storage.get(k);
      if(legacy && legacy.value != null) await idbSet(k, legacy.value);
    }catch(e){ /* تجاهل بصمت */ }
  }
}

// ---- notes persistence ----
async function loadNotes(id){
  notesEl.value = '';
  saveState.textContent = '';
  try{
    let value = await idbGetNote(id);
    if(!value){
      const migrated = await migrateLegacyNoteIfNeeded(id);
      if(migrated) value = migrated;
    }
    notesEl.value = value || '';
  }catch(e){
    notesEl.value = '';
    saveState.textContent = 'تعذّر تحميل الملاحظات (IndexedDB غير متاح)';
  }
}

notesEl.addEventListener('input', ()=>{
  saveState.textContent = 'جارٍ الحفظ…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async ()=>{
    if(!currentNode) return;
    try{
      await idbSetNote(currentNode.id, notesEl.value);
      const tags = extractTags(notesEl.value);
      await saveNoteTagIndexEntry(currentNode.id, tags);
      renderNoteTags(currentNode);
      saveState.textContent = 'تم الحفظ ✓  ' + new Date().toLocaleTimeString('ar-EG');
    }catch(e){
      saveState.textContent = 'تعذّر الحفظ — حاول تاني';
    }
  }, 500);
});

