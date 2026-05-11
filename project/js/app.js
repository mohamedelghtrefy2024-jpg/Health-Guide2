/**
 * 🚀 app.js - نقطة الدخول الرئيسية
 * 
 * يدير:
 * - التهيئة الأساسية
 * - تحميل البيانات
 * - إدارة التبويبات
 * - الحفظ التلقائي
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// المتغير العام الأساسي
// ═══════════════════════════════════════════════════════════════════════════

/**
 * متغير الحالة العام
 * يحتوي على جميع بيانات المستخدم والتطبيق
 */
let S = {
  // بيانات المستخدم
  profile: createDefaultProfile(),

  // بيانات التتبع اليومية
  tracker: {},

  // الخطط المحفوظة
  savedPlans: [],

  // البيانات المخصصة
  custom: [],
  customFoods: [],

  // المفضلات والسجلات
  favorites: [],
  weightLog: [],

  // الحسابات
  macros: { p: 30, c: 40, f: 30 },

  // التحديات والإنجازات
  challenges: {},
  nonScaleVictories: [],
  cheatDays: [],

  // الإعدادات
  theme: 'dark',
  language: 'ar',
  notifications: true,

  // البيانات الداخلية
  _targetKcal: 0,
  _tabCache: {},
  _lastSync: null
};

// تعريض للنطاق العام (ضروري للموبايل والـ WebView)
window.S = S;

// ═══════════════════════════════════════════════════════════════════════════
// التهيئة الأساسية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * دالة التهيئة الرئيسية
 */
function initApp() {
  console.log('🚀 بدء تهيئة التطبيق...');

  // 1. تحميل البيانات المحفوظة
  const savedData = load();
  if (savedData) {
    S = { ...S, ...savedData };
    console.log('✅ تم تحميل البيانات المحفوظة');
  }

  // 2. تهيئة الملف الشخصي
  if (!S.profile || !S.profile.name) {
    console.log('⚠️ الملف الشخصي فارغ - يرجى الإكمال');
  }

  // 3. تهيئة التتبع
  if (!S.tracker) {
    S.tracker = {};
  }

  // 4. تهيئة قاعدة البيانات
  if (typeof initializeAllFoods === 'function') {
    initializeAllFoods();
    buildFoodMaps();
    console.log('✅ تم تهيئة قاعدة البيانات');
  }

  // 5. ربط معالجات الأحداث
  setupEventListeners();
  console.log('✅ تم ربط معالجات الأحداث');

  // 6. تطبيق الموضوع
  applyTheme(S.theme);
  console.log('✅ تم تطبيق الموضوع');

  // 7. بدء الحفظ التلقائي
  startAutoSave(() => S);
  console.log('✅ تم بدء الحفظ التلقائي');

  // 8. إعداد معالجات الإغلاق
  setupBeforeUnloadHandler(() => S);
  setupVisibilityChangeHandler(() => S);
  console.log('✅ تم إعداد معالجات الإغلاق');

  // 9. إظهار التبويب الأول (الملف الشخصي)
  switchTab('profile');
  console.log('✅ تم عرض التبويب الأول');

  console.log('✅ اكتملت التهيئة بنجاح!');
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة التبويبات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التبويبات المتاحة
 */
const TABS = {
  profile: { name: 'الملف الشخصي', icon: '👤' },
  tracker: { name: 'التتبع', icon: '📊' },
  planner: { name: 'الخطة', icon: '📋' },
  library: { name: 'المكتبة', icon: '📚' },
  exercises: { name: 'التمارين', icon: '🏋️' },
  challenges: { name: 'التحديات', icon: '🎯' },
  insights: { name: 'التحليلات', icon: '📈' },
  guide: { name: 'الدليل', icon: '❓' }
};

/**
 * التبديل بين التبويبات
 * @param {string} tabName - اسم التبويب
 */
function switchTab(tabName) {
  if (!TABS[tabName]) {
    console.warn(`❌ التبويب ${tabName} غير موجود`);
    return;
  }

  // إخفاء جميع التبويبات
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  // إظهار التبويب المختار
  const selectedTab = document.getElementById(`${tabName}Tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
    selectedTab.style.display = 'block';
  }

  // تحديث الأزرار النشطة
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }

  // استدعاء دالة التحديث المناسبة
  const updateFunctions = {
    profile:    () => renderProfileTab(),
    tracker:    () => updateTracker(),
    planner:    () => renderSavedPlans(),
    library:    () => { filterFoods('all'); },
    exercises:  () => updateExercises(),
    challenges: () => updateChallenges(),
    insights:   () => renderInsights(),
    guide:      () => renderGuide()
  };

  if (updateFunctions[tabName]) {
    updateFunctions[tabName]();
  }

  console.log(`📱 تم التبديل إلى تبويب: ${tabName}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ربط معالجات الأحداث
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ربط جميع معالجات الأحداث
 */
function setupEventListeners() {
  // أزرار التبويبات
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // أزرار الحفظ والإجراءات
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-save')) {
      saveProfileChanges(S.profile);
    }
    if (e.target.classList.contains('btn-reset')) {
      S.tracker = {};
      debouncedSave(S);
      toast('تم مسح البيانات', 'info');
    }
  });

  // معالجات الإدخال
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('auto-save')) {
      debouncedSave(S);
    }
  });

  // معالجة المفاتيح
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      debouncedSave(S, true); // حفظ فوري
      toast('تم الحفظ', 'success');
    }
  });
}

/**
 * إغلاق جميع النوافذ المفتوحة
 */
function closeAllModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة الموضوع
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تطبيق موضوع اللون
 * @param {string} theme - الموضوع (dark/light)
 */
function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.style.setProperty('--bg-deep', '#071a0f');
    root.style.setProperty('--g1', '#10b981');
    root.style.setProperty('--cream', '#f0faf5');
  } else {
    root.style.setProperty('--bg-deep', '#f0fdf4');
    root.style.setProperty('--g1', '#059669');
    root.style.setProperty('--cream', '#1f2937');
  }
  
  S.theme = theme;
  debouncedSave(S);
}

/**
 * تبديل الموضوع
 */
function toggleTheme() {
  const newTheme = S.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  toast(`تم التبديل إلى الوضع ${newTheme === 'dark' ? 'الليلي' : 'النهاري'}`, 'info');
}

// ═══════════════════════════════════════════════════════════════════════════
// الإجراءات السريعة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إعادة تعيين البيانات (حذف كامل)
 */
function resetAllData() {
  if (!confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات بشكل نهائي!')) {
    return;
  }

  S = {
    profile: createDefaultProfile(),
    tracker: {},
    savedPlans: [],
    custom: [],
    customFoods: [],
    favorites: [],
    weightLog: [],
    macros: { p: 30, c: 40, f: 30 },
    challenges: {},
    nonScaleVictories: [],
    cheatDays: [],
    theme: 'dark',
    language: 'ar',
    notifications: true,
    _targetKcal: 0,
    _tabCache: {},
    _lastSync: null
  };

  debouncedSave(S, true);
  window.location.reload();
}

/**
 * تصدير جميع البيانات
 */
function exportAllData() {
  const dataStr = JSON.stringify(S, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `health-guide-backup-${new Date().getTime()}.json`;
  link.click();

  toast('تم تصدير البيانات', 'success');
}

/**
 * استيراد البيانات
 * @param {File} file - الملف
 */
function importAllData(file) {
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      S = { ...S, ...imported };
      debouncedSave(S, true);
      window.location.reload();
      toast('تم استيراد البيانات بنجاح', 'success');
    } catch (error) {
      toast('خطأ في استيراد الملف', 'error');
    }
  };

  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════════════════════
// بدء التطبيق عند تحميل الصفحة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التهيئة عند تحميل المستند
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 تحميل المستند...');
  initApp();
});

/**
 * الحفظ الفوري عند الإغلاق
 */
window.addEventListener('beforeunload', function() {
  save(S);
  console.log('💾 تم حفظ البيانات قبل الإغلاق');
});

// ═══════════════════════════════════════════════════════════════════════════
// التصدير (في حالة الاستخدام كـ module)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    S,
    initApp,
    switchTab,
    setupEventListeners,
    applyTheme,
    toggleTheme,
    resetAllData,
    exportAllData,
    importAllData,
    TABS
  };
}

console.log('✅ ملف app.js جاهز - معاك! 💪');
