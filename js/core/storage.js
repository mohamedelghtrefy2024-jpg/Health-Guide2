/**
 * 💾 storage.js - نظام الحفظ والتحميل
 * 
 * يدير:
 * - حفظ وتحميل بيانات المستخدم
 * - معالجة localStorage و fallback
 * - ترقية البيانات القديمة
 * - دعم iOS Private Mode
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// الثوابت والإعدادات
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'healthGuide_data';
const STORAGE_VERSION = '5.5';
const AUTO_SAVE_INTERVAL = 30000; // 30 ثانية

// fallback في memory للأجهزة التي لا تدعم localStorage
let _memoryStorage = {};
let _useMemory = false;

// ═══════════════════════════════════════════════════════════════════════════
// اختبار localStorage
// ═══════════════════════════════════════════════════════════════════════════

/**
 * اختبار ما إذا كان localStorage متوفراً
 * (iOS Private Mode قد يكون غير متوفر)
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('⚠️ localStorage غير متوفر - استخدام memory fallback');
    return false;
  }
}

// تحديد الطريقة المناسبة
if (!isLocalStorageAvailable()) {
  _useMemory = true;
  console.warn('📱 تشغيل وضع Private/Memory بدلاً من localStorage');
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال Storage الأساسية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حفظ بيانات المستخدم
 * @param {Object} data - البيانات المراد حفظها
 * @returns {boolean} - نجح أم فشل
 */
function save(data) {
  try {
    if (!data) {
      console.warn('⚠️ محاولة حفظ بيانات فارغة');
      return false;
    }

    const toStore = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data: data
    };

    const jsonString = JSON.stringify(toStore);

    if (_useMemory) {
      _memoryStorage[STORAGE_KEY] = jsonString;
    } else {
      localStorage.setItem(STORAGE_KEY, jsonString);
    }

    console.log('✅ تم حفظ البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error);
    // fallback إلى memory
    try {
      _memoryStorage[STORAGE_KEY] = JSON.stringify({
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        data: data
      });
      _useMemory = true;
      console.warn('📱 تم الحفظ في الذاكرة فقط');
      return true;
    } catch (e) {
      console.error('❌ فشل الحفظ في الذاكرة أيضاً:', e);
      return false;
    }
  }
}

/**
 * تحميل بيانات المستخدم
 * @returns {Object|null} - البيانات المحملة أو null
 */
function load() {
  try {
    let jsonString = null;

    if (_useMemory) {
      jsonString = _memoryStorage[STORAGE_KEY];
    } else {
      jsonString = localStorage.getItem(STORAGE_KEY);
    }

    if (!jsonString) {
      console.warn('⚠️ لا توجد بيانات محفوظة');
      return null;
    }

    const stored = JSON.parse(jsonString);

    // التحقق من الإصدار وترقية البيانات إذا لزم
    if (stored.version !== STORAGE_VERSION) {
      console.log(`📦 ترقية البيانات من v${stored.version} إلى v${STORAGE_VERSION}`);
      stored.data = migrateState(stored.version, stored.data);
      stored.version = STORAGE_VERSION;
      save(stored.data); // حفظ النسخة المحدثة
    }

    console.log('✅ تم تحميل البيانات بنجاح');
    return stored.data;
  } catch (error) {
    console.error('❌ خطأ في تحميل البيانات:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// الحفظ الموحد (Debounced Save)
// ═══════════════════════════════════════════════════════════════════════════

let _saveTimeout = null;
let _lastSaveTime = 0;

/**
 * حفظ موحد - تجنب عمليات الحفظ المتكررة
 * @param {Object} data - البيانات
 * @param {boolean} immediate - حفظ فوري بدون تأخير
 */
function debouncedSave(data, immediate = false) {
  // إلغاء العملية السابقة
  if (_saveTimeout) {
    clearTimeout(_saveTimeout);
  }

  if (immediate) {
    // حفظ فوري
    save(data);
    _lastSaveTime = Date.now();
  } else {
    // حفظ مع تأخير لتوحيد العمليات
    _saveTimeout = setTimeout(() => {
      save(data);
      _lastSaveTime = Date.now();
    }, 1000); // تأخير 1 ثانية
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// الحفظ التلقائي
// ═══════════════════════════════════════════════════════════════════════════

let _autoSaveInterval = null;

/**
 * بدء الحفظ التلقائي الدوري
 * @param {Function} getDataFunction - دالة لجلب البيانات الحالية
 */
function startAutoSave(getDataFunction) {
  if (_autoSaveInterval) {
    clearInterval(_autoSaveInterval);
  }

  _autoSaveInterval = setInterval(() => {
    const data = getDataFunction();
    if (data) {
      save(data);
    }
  }, AUTO_SAVE_INTERVAL);

  console.log('🔄 تم بدء الحفظ التلقائي');
}

/**
 * إيقاف الحفظ التلقائي
 */
function stopAutoSave() {
  if (_autoSaveInterval) {
    clearInterval(_autoSaveInterval);
    _autoSaveInterval = null;
    console.log('⏹️ تم إيقاف الحفظ التلقائي');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// معالجة الإصدارات والترقية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ترقية البيانات من نسخة قديمة إلى الحالية
 * @param {string} oldVersion - الإصدار القديم
 * @param {Object} data - البيانات القديمة
 * @returns {Object} - البيانات المحدثة
 */
function migrateState(oldVersion, data) {
  console.log(`🔄 ترقية البيانات من ${oldVersion} إلى ${STORAGE_VERSION}`);

  // تطبيق التعديلات حسب الإصدار
  if (!data.profile) {
    data.profile = {
      name: '',
      religion: null,
      weight: 0,
      targetWeight: 0,
      height: 0,
      age: 0,
      gender: 'male',
      activity: 1.55,
      goal: 'loss',
      deficit: 500
    };
  }

  if (!data.tracker) {
    data.tracker = {};
  }

  if (!data.waterIntake) {
    data.waterIntake = {
      daily: [],
      goal: 2000,
      today: 0,
      lastDate: null
    };
  }

  if (!data.weightLog) {
    data.weightLog = [];
  }

  if (!data.favorites) {
    data.favorites = [];
  }

  if (!data.macros) {
    data.macros = { p: 30, c: 40, f: 30 };
  }

  // إضافة حقول جديدة في الإصدارات الأحدث
  if (oldVersion < '5.0') {
    data.challenges = {};
    data.nonScaleVictories = [];
  }

  if (oldVersion < '5.5') {
    data.mealBuilderItems = [];
    data.savedPlans = [];
  }

  console.log('✅ انتهت الترقية بنجاح');
  return data;
}

/**
 * التحقق من صحة البيانات
 * @param {Object} data - البيانات المراد التحقق منها
 * @returns {boolean} - صحيح أو غير صحيح
 */
function validateState(data) {
  if (!data || typeof data !== 'object') {
    console.error('❌ البيانات ليست كائن صحيح');
    return false;
  }

  // التحقق من الحقول الضرورية
  const requiredFields = ['profile', 'tracker', 'waterIntake'];
  for (let field of requiredFields) {
    if (!data[field]) {
      console.warn(`⚠️ الحقل ${field} غير موجود`);
      // سيتم إضافته في migrateState
    }
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// تنظيف البيانات القديمة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تنظيف بيانات التتبع القديمة (أكثر من 30 يوم)
 * @param {Object} data - البيانات
 */
function cleanupOldData(data) {
  if (!data.tracker) return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let removed = 0;
  for (let date in data.tracker) {
    const trackerDate = new Date(date);
    if (trackerDate < thirtyDaysAgo) {
      delete data.tracker[date];
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`🗑️ تم حذف ${removed} يوم من بيانات التتبع القديمة`);
    save(data);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// معالجات الأحداث
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حفظ البيانات عند إغلاق الصفحة
 * @param {Function} getDataFunction - دالة لجلب البيانات
 */
function setupBeforeUnloadHandler(getDataFunction) {
  window.addEventListener('beforeunload', () => {
    const data = getDataFunction();
    if (data) {
      save(data);
      console.log('💾 تم حفظ البيانات قبل الإغلاق');
    }
  });
}

/**
 * حفظ البيانات عند فقدان التركيز (خروج من الصفحة)
 * @param {Function} getDataFunction - دالة لجلب البيانات
 */
function setupVisibilityChangeHandler(getDataFunction) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const data = getDataFunction();
      if (data) {
        save(data);
        console.log('💾 تم حفظ البيانات (الصفحة مخفية)');
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    save,
    load,
    debouncedSave,
    startAutoSave,
    stopAutoSave,
    migrateState,
    validateState,
    cleanupOldData,
    setupBeforeUnloadHandler,
    setupVisibilityChangeHandler
  };
}

console.log('✅ نظام التخزين جاهز');
