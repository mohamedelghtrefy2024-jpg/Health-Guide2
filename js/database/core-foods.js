/**
 * 📚 core-foods.js - قاعدة البيانات الغذائية الرئيسية
 * 
 * يحتوي على:
 * - CORE_FOODS: الأصناف الموجودة أصلاً (~2,620)
 * - EXCEL_FOODS: أصناف من Excel الجديدة (~252)
 * - ADVANCED_FOODS: أصناف من Word/USDA (~100)
 * - ALL_FOODS: المجموع المدمج بدون تكرار (~2,900)
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 * الحالة: في المرحلة الأولى من البناء
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. CORE_FOODS - الأصناف الأساسية من الملف الأساسي
// ═══════════════════════════════════════════════════════════════════════════

/**
 * قاعدة البيانات الأساسية
 * @type {Array<Object>}
 * 
 * كل صنف يحتوي على:
 * - id: رقم فريد
 * - name: اسم الصنف
 * - emoji: رموز تعبيرية
 * - kcal: السعرات الحرارية
 * - p: البروتين (جرام)
 * - c: الكربوهيدرات (جرام)
 * - f: الدهون (جرام)
 * - cat: التصنيف (خضار، فواكه، إلخ)
 * - tags: علامات إضافية
 */
const CORE_FOODS = [
  // ملاحظة: سيتم ملء هذا من الملف الأساسي تلقائياً
  // الحجم المتوقع: ~2,620 صنف
  // سيتم استخراجه باستخدام سكريبت Python
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. EXCEL_FOODS - الأصناف الجديدة من Excel
// ═══════════════════════════════════════════════════════════════════════════

/**
 * أصناف جديدة من ملف Excel (Nutrition_Final_Database_All_Sheets.xlsx)
 * @type {Array<Object>}
 * 
 * موزعة على 8 فئات:
 * 1. الخضروات: 41 صنف
 * 2. الفواكه: 29 صنف
 * 3. البروتينات: 58 صنف
 * 4. النشويات: 27 صنف
 * 5. المكسرات: 18 صنف
 * 6. المشروبات: 28 صنف
 * 7. الإضافات والزيوت: 19 صنف
 * 8. الوجبات الكاملة: 32 صنف
 * ────────────────────────
 * المجموع: 252 صنف جديد
 */
const EXCEL_FOODS = [
  // ملاحظة: سيتم ملء هذا من ملف Excel
  // سيتم تحويل كل صف في Excel إلى object
  // مثال:
  // {
  //   id: 3001,
  //   name: 'خيار',
  //   kcal: 16,
  //   p: 0.7,
  //   c: 3.6,
  //   f: 0.1,
  //   fiber: 0.5,
  //   cat: 'الخضروات',
  //   tags: ['خضار', 'منخفض سعرات'],
  //   source: 'excel'
  // }
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. ADVANCED_FOODS - أصناف متقدمة من USDA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * أصناف متقدمة من موسوعة USDA
 * @type {Array<Object>}
 * 
 * نأخذ أول 100 صنف فقط في البداية
 * وكل صنف يحتوي على بيانات تفصيلية:
 * - السكر
 * - الدهون المشبعة
 * - الدهون غير المشبعة
 * - مؤشر جلايسيمي
 * - الصوديوم
 * - الكوليسترول
 */
const ADVANCED_FOODS = [
  // ملاحظة: سيتم استخراج أول 100 صنف من Word
  // مثال:
  // {
  //   id: 4001,
  //   name: 'لحم بقر (كتف - Lean)',
  //   kcal: 180,
  //   p: 28,
  //   c: 0,
  //   f: 8,
  //   fiber: 0,
  //   saturated: 3.2,
  //   unsaturated: 2.5,
  //   trans: 0.1,
  //   gi: null,
  //   sodium: 65,
  //   potassium: 320,
  //   cholesterol: 75,
  //   cat: 'البروتينات',
  //   tags: ['بروتين', 'لحم', 'USDA'],
  //   source: 'word-usda'
  // }
];

// ═══════════════════════════════════════════════════════════════════════════
// 4. ALL_FOODS - المجموع المدمج والنظيف
// ═══════════════════════════════════════════════════════════════════════════

/**
 * قاعدة البيانات المدمجة النهائية
 * بدون تكرار وبدون فقدان بيانات
 * 
 * ترتيب الأولوية:
 * 1. CORE_FOODS (البيانات الأصلية - لا تُحذف)
 * 2. EXCEL_FOODS (جديدة من Excel)
 * 3. ADVANCED_FOODS (متقدمة من USDA)
 * 
 * عند وجود تكرار:
 * → نحتفظ بـ CORE تلقائياً (البيانات الموثوقة)
 * → نضيف من EXCEL إذا كانت جديدة
 * → نضيف من ADVANCED إذا كانت فريدة
 * 
 * النتيجة المتوقعة: ~2,900 صنف (بدون تكرار)
 */
let ALL_FOODS = [];

// دالة الدمج والتنظيف
function initializeAllFoods() {
  // ابدأ بـ CORE_FOODS
  ALL_FOODS = [...CORE_FOODS];
  
  // أضف من EXCEL_FOODS ما ليس موجود
  const coreNames = new Set(
    CORE_FOODS.map(f => f.name?.trim().toLowerCase())
  );
  
  EXCEL_FOODS.forEach(food => {
    const normalized = food.name?.trim().toLowerCase();
    if (!coreNames.has(normalized)) {
      ALL_FOODS.push(food);
    }
  });
  
  // أضف من ADVANCED_FOODS ما ليس موجود
  const allNames = new Set(
    ALL_FOODS.map(f => f.name?.trim().toLowerCase())
  );
  
  ADVANCED_FOODS.forEach(food => {
    const normalized = food.name?.trim().toLowerCase();
    if (!allNames.has(normalized)) {
      ALL_FOODS.push(food);
    }
  });
  
  console.log(`
    ✅ تم دمج قاعدة البيانات:
    - CORE_FOODS: ${CORE_FOODS.length}
    - EXCEL_FOODS: ${EXCEL_FOODS.length}
    - ADVANCED_FOODS: ${ADVANCED_FOODS.length}
    ──────────────────────────
    - ALL_FOODS: ${ALL_FOODS.length}
  `);
  
  return ALL_FOODS;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. خرائط البحث السريع
// ═══════════════════════════════════════════════════════════════════════════

/**
 * خرائط (Maps) للبحث السريع والتصفية
 * تُحسّن الأداء بشكل كبير عند البحث في 2,900 صنف
 */

// خريطة البحث بالاسم
let FOODS_BY_NAME = new Map();

// خريطة التصنيف
let FOODS_BY_CATEGORY = new Map();

// خريطة المصدر (CORE/EXCEL/ADVANCED)
let FOODS_BY_SOURCE = new Map();

/**
 * بناء الخرائط السريعة
 * يُستدعى بعد تهيئة ALL_FOODS
 */
function buildFoodMaps() {
  FOODS_BY_NAME.clear();
  FOODS_BY_CATEGORY.clear();
  FOODS_BY_SOURCE.clear();
  
  ALL_FOODS.forEach(food => {
    // خريطة الاسم
    FOODS_BY_NAME.set(food.name.toLowerCase(), food);
    
    // خريطة التصنيف
    const cat = food.cat || 'غير مصنف';
    if (!FOODS_BY_CATEGORY.has(cat)) {
      FOODS_BY_CATEGORY.set(cat, []);
    }
    FOODS_BY_CATEGORY.get(cat).push(food);
    
    // خريطة المصدر
    const src = food.source || 'core';
    if (!FOODS_BY_SOURCE.has(src)) {
      FOODS_BY_SOURCE.set(src, []);
    }
    FOODS_BY_SOURCE.get(src).push(food);
  });
  
  console.log(`
    ✅ تم بناء الخرائط السريعة:
    - التصنيفات: ${FOODS_BY_CATEGORY.size}
    - المصادر: ${FOODS_BY_SOURCE.size}
  `);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. دوال مساعدة للبحث والتصفية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * البحث عن صنف بالاسم (بحث سريع)
 * @param {string} name - اسم الصنف
 * @returns {Object|null} - الصنف أو null
 */
function getFoodByName(name) {
  return FOODS_BY_NAME.get(name.trim().toLowerCase()) || null;
}

/**
 * الحصول على أصناف حسب التصنيف
 * @param {string} category - التصنيف
 * @returns {Array} - قائمة الأصناف
 */
function getFoodsByCategory(category) {
  return FOODS_BY_CATEGORY.get(category) || [];
}

/**
 * الحصول على أصناف حسب المصدر
 * @param {string} source - المصدر (core/excel/word-usda)
 * @returns {Array} - قائمة الأصناف
 */
function getFoodsBySource(source) {
  return FOODS_BY_SOURCE.get(source) || [];
}

/**
 * بحث fuzzy (غير دقيق) عن أصناف متشابهة
 * @param {string} query - الاستعلام
 * @returns {Array} - أصناف متشابهة
 */
function searchFoodsFuzzy(query) {
  const q = query.trim().toLowerCase();
  return ALL_FOODS.filter(f => 
    f.name.toLowerCase().includes(q) ||
    (f.tags && f.tags.some(t => t.includes(q)))
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. التصدير (Exports)
// ═══════════════════════════════════════════════════════════════════════════

// تصدير للاستخدام في الملفات الأخرى
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CORE_FOODS,
    EXCEL_FOODS,
    ADVANCED_FOODS,
    ALL_FOODS,
    FOODS_BY_NAME,
    FOODS_BY_CATEGORY,
    FOODS_BY_SOURCE,
    initializeAllFoods,
    buildFoodMaps,
    getFoodByName,
    getFoodsByCategory,
    getFoodsBySource,
    searchFoodsFuzzy
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. التهيئة عند التحميل
// ═══════════════════════════════════════════════════════════════════════════

// عند التحميل الأول:
// 1. تهيئة قاعدة البيانات
// 2. بناء الخرائط السريعة
// 3. طباعة الإحصائيات

document.addEventListener('DOMContentLoaded', function() {
  console.log('🍎 تهيئة قاعدة البيانات الغذائية...');
  initializeAllFoods();
  buildFoodMaps();
  console.log('✅ قاعدة البيانات جاهزة للاستخدام!');
});
