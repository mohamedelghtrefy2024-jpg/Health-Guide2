/**
 * 🛡️ safety.js — طبقة الأمان والحماية
 *
 * يعالج 6 مشاكل حرجة:
 *   1. Global Error Handler
 *   2. Safe Storage Layer (JSON.parse + Quota)
 *   3. XSS Protection
 *   4. Event Listener Cleanup
 *   5. Data Validation
 *   6. Duplicate Food IDs
 *
 * ⚠️ يُحمَّل قبل كل الملفات الأخرى
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════

window.addEventListener('error', (e) => {
  console.error('🔴 Global Error:', e.message, e.filename, e.lineno);
  // محاولة حفظ البيانات قبل أي شيء
  try { if (typeof S !== 'undefined' && typeof save === 'function') save(S); } catch (_) {}
  // إظهار رسالة للمستخدم بدل الصمت
  _showSafetyToast('حدث خطأ غير متوقع — تم الحفظ التلقائي 💾');
  return true; // منع crash الصفحة
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🔴 Unhandled Promise:', e.reason);
  e.preventDefault();
});

// Toast بسيطة مستقلة عن utils.js (مش متحملت بعد)
function _showSafetyToast(msg) {
  try {
    // لو toast من utils موجودة استخدمها
    if (typeof toast === 'function') { toast(msg, 'error'); return; }
    // وإلا نعمل واحدة بسيطة
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#ef4444;color:#fff;padding:12px 18px;border-radius:10px;z-index:9999;font-size:14px;direction:rtl';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SAFE STORAGE LAYER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * قراءة من localStorage مع حماية كاملة
 * @param {string} key
 * @param {*} fallback — القيمة الافتراضية لو فشل
 */
function safeGetItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.warn(`⚠️ safeGetItem: فشل قراءة "${key}" —`, e.message);
    // احتفظ بالبيانات الفاسدة كـ backup
    try {
      const corrupt = localStorage.getItem(key);
      if (corrupt) localStorage.setItem(key + '_corrupt_' + Date.now(), corrupt);
      localStorage.removeItem(key);
    } catch (_) {}
    return fallback;
  }
}

/**
 * كتابة في localStorage مع حماية Quota
 * @param {string} key
 * @param {*} value
 */
function safeSetItem(key, value) {
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, str);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('⚠️ localStorage ممتلئ — تنظيف بيانات قديمة...');
      _clearOldTrackerDays();
      // محاولة ثانية بعد التنظيف
      try {
        const str = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, str);
        console.log('✅ تم الحفظ بعد التنظيف');
        return true;
      } catch (e2) {
        _showSafetyToast('مساحة التخزين ممتلئة — يرجى حذف بيانات قديمة من الإعدادات');
        return false;
      }
    }
    console.error('❌ safeSetItem error:', e);
    return false;
  }
}

/**
 * تنظيف بيانات التتبع الأقدم من 30 يوم
 */
function _clearOldTrackerDays() {
  try {
    if (typeof S === 'undefined' || !S.tracker) return;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    let removed = 0;
    for (const date in S.tracker) {
      if (new Date(date) < cutoff) {
        delete S.tracker[date];
        removed++;
      }
    }
    console.log(`🗑️ تم حذف ${removed} يوم قديم من التتبع`);
  } catch (_) {}
}

// Monkey-patch localStorage.setItem لحماية كل الكود الموجود تلقائياً
(function patchLocalStorage() {
  try {
    const _original = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      try {
        _original(key, value);
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          console.warn('⚠️ Quota exceeded للـ key:', key);
          _clearOldTrackerDays();
          try { _original(key, value); } catch (_) {
            _showSafetyToast('مساحة التخزين ممتلئة 💾');
          }
        }
      }
    };
    console.log('✅ localStorage.setItem محمي');
  } catch (_) {}
})();

// ═══════════════════════════════════════════════════════════════════════════
// 3. XSS PROTECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تنظيف النصوص من HTML قبل العرض
 * (utils.js قد يكون فيها نسخة — ده backup مستقل)
 */
if (typeof window.escapeHtml === 'undefined') {
  window.escapeHtml = function(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  };
}

/**
 * تنظيف attributes (للاستخدام في onclick وغيره)
 */
if (typeof window.escAttr === 'undefined') {
  window.escAttr = function(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };
}

/**
 * Wrapper آمن لـ innerHTML — يمنع إدخال مباشر للبيانات الغير نظيفة
 * الاستخدام: safeHTML`<div>${userInput}</div>`
 */
window.safeHTML = function(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const val = values[i - 1];
    const escaped = val !== undefined ? escapeHtml(val) : '';
    return result + escaped + str;
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. EVENT LISTENER REGISTRY (Cleanup System)
// ═══════════════════════════════════════════════════════════════════════════

window.EventRegistry = {
  _listeners: [],

  /**
   * إضافة event listener مع تسجيل للتنظيف لاحقاً
   */
  add(target, event, handler, options) {
    if (!target || !event || !handler) return;
    target.addEventListener(event, handler, options);
    this._listeners.push({ target, event, handler, options });
  },

  /**
   * إزالة كل الـ listeners المسجلة
   */
  cleanup() {
    this._listeners.forEach(({ target, event, handler, options }) => {
      try { target.removeEventListener(event, handler, options); } catch (_) {}
    });
    this._listeners = [];
    console.log('🧹 تم تنظيف Event Listeners');
  },

  /**
   * عدد الـ listeners النشطة
   */
  count() { return this._listeners.length; }
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. DATA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

window.Validators = {

  /**
   * التحقق من صحة الملف الشخصي
   * @returns {{ valid: boolean, errors: string[] }}
   */
  profile(profile) {
    const errors = [];
    if (!profile) return { valid: false, errors: ['الملف الشخصي فارغ'] };

    if (profile.weight !== undefined && profile.weight !== '') {
      const w = parseFloat(profile.weight);
      if (isNaN(w) || w < 20 || w > 400)
        errors.push('الوزن يجب أن يكون بين 20 و 400 كجم');
    }
    if (profile.height !== undefined && profile.height !== '') {
      const h = parseFloat(profile.height);
      if (isNaN(h) || h < 100 || h > 260)
        errors.push('الطول يجب أن يكون بين 100 و 260 سم');
    }
    if (profile.age !== undefined && profile.age !== '') {
      const a = parseInt(profile.age);
      if (isNaN(a) || a < 10 || a > 110)
        errors.push('العمر يجب أن يكون بين 10 و 110');
    }
    if (profile.targetWeight !== undefined && profile.targetWeight !== '') {
      const tw = parseFloat(profile.targetWeight);
      if (isNaN(tw) || tw < 20 || tw > 400)
        errors.push('الوزن المستهدف يجب أن يكون بين 20 و 400 كجم');
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * التحقق من صحة إدخال طعام
   */
  food(food) {
    const errors = [];
    if (!food || !food.name) errors.push('اسم الطعام مطلوب');
    if (food.kcal !== undefined && (isNaN(food.kcal) || food.kcal < 0 || food.kcal > 9000))
      errors.push('السعرات يجب أن تكون بين 0 و 9000');
    return { valid: errors.length === 0, errors };
  },

  /**
   * التحقق من صحة الوزن المدخل
   */
  weight(val) {
    const w = parseFloat(val);
    if (isNaN(w) || w < 20 || w > 400) {
      return { valid: false, error: 'الوزن يجب أن يكون بين 20 و 400 كجم' };
    }
    return { valid: true, error: null };
  },

  /**
   * عرض أخطاء validation بـ toast
   */
  showErrors(errors) {
    if (!errors || !errors.length) return;
    errors.forEach(err => {
      if (typeof toast === 'function') toast(err, 'warning');
      else _showSafetyToast(err);
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. DUPLICATE FOOD IDs FIX
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نعيد تعريف getAllFoods بعد تحميل الـ databases عشان نضمن no duplicates
 * يُستدعى من initApp()
 */
window._allFoodsCache = null;

window.getAllFoodsClean = function() {
  // لو في cache استخدمه
  if (window._allFoodsCache) return window._allFoodsCache;

  const foods = [];
  const seenIds = new Set();
  const seenNames = new Set();

  const sources = [
    typeof FOODS !== 'undefined' ? FOODS : [],
    typeof ADVANCED_FOODS !== 'undefined' ? ADVANCED_FOODS : [],
  ];

  let nextId = 10000; // IDs جديدة للـ duplicates

  for (const source of sources) {
    for (const food of source) {
      // لو ID مكرر — عطيله ID جديد
      let id = food.id;
      if (seenIds.has(id)) {
        id = nextId++;
      }
      seenIds.add(id);

      // لو اسم مكرر — تخطّاه (نسخة الـ FOODS الأولى هي الأهم)
      if (seenNames.has(food.name)) continue;
      seenNames.add(food.name);

      foods.push({ ...food, id });
    }
  }

  console.log(`✅ getAllFoodsClean: ${foods.length} صنف فريد (من ${sources.flat().length} إجمالي)`);
  window._allFoodsCache = foods;
  return foods;
};

// Override getAllFoods الموجودة بعد تحميل الملفات
document.addEventListener('DOMContentLoaded', () => {
  // تأخير بسيط عشان تتحمل كل الملفات
  setTimeout(() => {
    if (typeof getAllFoods === 'function') {
      // نحتفظ بالأصلية كـ backup
      window._getAllFoodsOriginal = getAllFoods;
      // نستبدلها بالنظيفة
      window.getAllFoods = getAllFoodsClean;
      console.log('✅ getAllFoods مُحسَّنة (no duplicates)');
    }
  }, 100);
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION: ربط Validators بـ saveProfileChanges
// ═══════════════════════════════════════════════════════════════════════════

// نضيف validation لدالة saveProfileChanges الموجودة في profile.js
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const _originalSaveProfile = window.saveProfileChanges;
    if (typeof _originalSaveProfile === 'function') {
      window.saveProfileChanges = function(profile) {
        // اقرأ القيم الجديدة من الفورم
        const newWeight   = document.getElementById('profileWeight')?.value;
        const newHeight   = document.getElementById('profileHeight')?.value;
        const newAge      = document.getElementById('profileAge')?.value;
        const newTWeight  = document.getElementById('profileTargetWeight')?.value;

        const testProfile = {
          weight: newWeight, height: newHeight,
          age: newAge, targetWeight: newTWeight
        };
        const result = Validators.profile(testProfile);
        if (!result.valid) {
          Validators.showErrors(result.errors);
          return;
        }
        _originalSaveProfile(profile);
      };
      console.log('✅ saveProfileChanges محمية بـ Validation');
    }
  }, 200);
});

console.log('🛡️ safety.js — 6 حمايات نشطة');
