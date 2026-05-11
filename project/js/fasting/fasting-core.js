/**
 * ⛪ ☪️ fasting-core.js - نظام الصيام الأساسي
 * 
 * يدير:
 * - دوال مشتركة بين الصيام المسيحي والإسلامي
 * - تحويلات التاريخ
 * - إدارة الصيام العام
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// ثوابت الصيام
// ═══════════════════════════════════════════════════════════════════════════

const FAST_TYPES = {
  NONE: 'none',
  FULL: 'full',        // صيام كامل
  PARTIAL: 'partial',  // صيام جزئي
  FISH: 'fish',        // يسمح بالسمك فقط
  VEGAN: 'vegan'       // نباتي فقط
};

const FAST_RESTRICTIONS = {
  NONE: [],
  FULL: ['meat', 'dairy', 'eggs', 'oil', 'fish'], // منع الجميع
  PARTIAL: ['meat'], // منع اللحم فقط
  FISH: ['meat', 'dairy', 'eggs'], // منع اللحم والألبان، يسمح بالسمك
  VEGAN: ['meat', 'dairy', 'eggs', 'honey'] // منع الحيواني
};

// ═══════════════════════════════════════════════════════════════════════════
// دوال التاريخ والوقت
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على اليوم والشهر والسنة من تاريخ
 * @param {Date} date - التاريخ (افتراضي: اليوم)
 * @returns {Object} - {day, month, year}
 */
function getDateComponents(date = new Date()) {
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    dayOfWeek: date.getDay()
  };
}

/**
 * الحصول على اسم اليوم بالعربية
 * @param {number} dayOfWeek - رقم اليوم (0-6)
 * @returns {string} - اسم اليوم
 */
function getDayName(dayOfWeek) {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[dayOfWeek] || 'اليوم';
}

/**
 * الحصول على اسم الشهر بالعربية
 * @param {number} month - رقم الشهر (1-12)
 * @returns {string} - اسم الشهر
 */
function getMonthName(month) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[month - 1] || 'الشهر';
}

/**
 * فرق الأيام بين تاريخين
 * @param {Date} date1 - التاريخ الأول
 * @param {Date} date2 - التاريخ الثاني
 * @returns {number} - عدد الأيام
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
}

/**
 * معرفة إذا كان التاريخ في الماضي أو المستقبل
 * @param {Date} date - التاريخ
 * @returns {string} - 'past', 'today', 'future'
 */
function getDateRelation(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date < today) return 'past';
  if (date.getTime() === today.getTime()) return 'today';
  return 'future';
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة الصيام العام
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من هل هو يوم صيام
 * @param {Date} date - التاريخ
 * @param {Object} profile - ملف المستخدم
 * @returns {Object} - {isFasting, type, restrictions, details}
 */
function getTodayFastStatus(date = new Date(), profile = {}) {
  const religion = profile.religion || null;
  
  if (!religion) {
    return {
      isFasting: false,
      type: FAST_TYPES.NONE,
      restrictions: [],
      details: 'لم تحدد ديانتك بعد'
    };
  }

  // استدعاء الدالة المناسبة حسب الديانة
  if (religion === 'christian' || religion === 'مسيحي') {
    return getChristianFastStatus?.(date) || {
      isFasting: false,
      type: FAST_TYPES.NONE,
      restrictions: []
    };
  }

  if (religion === 'muslim' || religion === 'مسلم') {
    return getIslamicFastStatus?.(date, profile) || {
      isFasting: false,
      type: FAST_TYPES.NONE,
      restrictions: []
    };
  }

  return {
    isFasting: false,
    type: FAST_TYPES.NONE,
    restrictions: [],
    details: 'ديانة غير معروفة'
  };
}

/**
 * حساب مدة الصيام بالساعات (للصيام الجزئي)
 * @param {Object} fastStatus - حالة الصيام
 * @param {string} startTime - وقت البداية (HH:MM)
 * @param {string} endTime - وقت النهاية (HH:MM)
 * @returns {number} - عدد الساعات
 */
function getFastingDuration(fastStatus, startTime, endTime) {
  if (!fastStatus || !fastStatus.isFasting) {
    return 0;
  }

  if (!startTime || !endTime) {
    return 0;
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  let duration = endTotalMinutes - startTotalMinutes;

  // إذا كانت النهاية في اليوم التالي
  if (duration < 0) {
    duration += 24 * 60;
  }

  return duration / 60; // تحويل إلى ساعات
}

/**
 * حساب الوجبات الموصى بها أثناء الصيام
 * @param {Object} fastStatus - حالة الصيام
 * @param {Object} profile - ملف المستخدم
 * @returns {Array} - قائمة الوجبات الموصى بها
 */
function getRecommendedMeals(fastStatus, profile) {
  if (!fastStatus || !fastStatus.isFasting) {
    return [];
  }

  const restrictions = fastStatus.restrictions || [];
  const meals = [];

  // الوجبات الأساسية
  const allMeals = [
    { name: 'خضار مشكلة', category: 'vegetables', icon: '🥬' },
    { name: 'سلطة خضراء', category: 'vegetables', icon: '🥗' },
    { name: 'فواكه', category: 'fruits', icon: '🍎' },
    { name: 'أرز بدون زيت', category: 'grains', icon: '🍚' },
    { name: 'خبز', category: 'grains', icon: '🍞' },
    { name: 'ماء', category: 'drinks', icon: '💧' },
    { name: 'عصير', category: 'drinks', icon: '🧃' },
    { name: 'قهوة سادة', category: 'drinks', icon: '☕' },
    { name: 'شاي', category: 'drinks', icon: '🫖' },
    { name: 'حمص', category: 'legumes', icon: '🫘' },
    { name: 'عدس', category: 'legumes', icon: '🫘' },
    { name: 'فول بدون زيت', category: 'legumes', icon: '🫘' },
    { name: 'سمك', category: 'protein-fish', icon: '🐟' },
    { name: 'دجاج', category: 'protein-meat', icon: '🍗' },
    { name: 'بيض', category: 'protein-egg', icon: '🥚' },
    { name: 'جبنة', category: 'dairy', icon: '🧀' },
    { name: 'حليب', category: 'dairy', icon: '🥛' },
    { name: 'زيت', category: 'oils', icon: '🫒' }
  ];

  // تصفية حسب القيود
  return allMeals.filter(meal => {
    // إذا كان في القائمة السوداء
    if (restrictions.includes(meal.category)) {
      return false;
    }

    // تطبيقات خاصة
    if (restrictions.includes('oil') && meal.category === 'oils') {
      return false;
    }

    if (restrictions.includes('meat') && meal.category === 'protein-meat') {
      return false;
    }

    if (restrictions.includes('dairy') && meal.category === 'dairy') {
      return false;
    }

    if (restrictions.includes('eggs') && meal.category === 'protein-egg') {
      return false;
    }

    return true;
  });
}

/**
 * هل يسمح بأكل معين أثناء الصيام
 * @param {Object} fastStatus - حالة الصيام
 * @param {string} foodCategory - فئة الطعام
 * @returns {boolean}
 */
function isFoodAllowed(fastStatus, foodCategory) {
  if (!fastStatus || !fastStatus.isFasting) {
    return true; // لا صيام = كل شيء مسموح
  }

  const restrictions = fastStatus.restrictions || [];
  return !restrictions.includes(foodCategory);
}

// ═══════════════════════════════════════════════════════════════════════════
// إحصائيات الصيام
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب عدد أيام الصيام هذا الشهر
 * @param {Object} profile - ملف المستخدم
 * @param {number} month - رقم الشهر (اختياري)
 * @param {number} year - السنة (اختياري)
 * @returns {number} - عدد أيام الصيام
 */
function countFastingDaysInMonth(profile, month = null, year = null) {
  const now = new Date();
  month = month || now.getMonth() + 1;
  year = year || now.getFullYear();

  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const fastStatus = getTodayFastStatus(date, profile);
    if (fastStatus.isFasting) {
      count++;
    }
  }

  return count;
}

/**
 * حساب نسبة الصيام هذا الشهر
 * @param {Object} profile - ملف المستخدم
 * @returns {number} - النسبة (0-100)
 */
function getFastingPercentageThisMonth(profile) {
  const now = new Date();
  const daysInMonth = now.getDate(); // الأيام المضت هذا الشهر
  const fastingDays = countFastingDaysInMonth(profile);
  
  return daysInMonth > 0 ? Math.round((fastingDays / daysInMonth) * 100) : 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FAST_TYPES,
    FAST_RESTRICTIONS,
    getDateComponents,
    getDayName,
    getMonthName,
    daysBetween,
    getDateRelation,
    getTodayFastStatus,
    getFastingDuration,
    getRecommendedMeals,
    isFoodAllowed,
    countFastingDaysInMonth,
    getFastingPercentageThisMonth
  };
}

console.log('✅ نظام الصيام الأساسي جاهز');
