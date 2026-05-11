/**
 * ⛪ christian.js - نظام الصيام المسيحي
 * 
 * يدير:
 * - صوم الأربعاء والجمعة
 * - الصيامات الكبرى (الميلاد، الرسل، العذراء، يونان)
 * - الأعياد المسيحية
 * - حساب عيد القيامة (الفصح)
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// الصيامات المسيحية الثابتة
// ═══════════════════════════════════════════════════════════════════════════

const CHRISTIAN_FASTS = {
  // صيام الأربعاء والجمعة (طول السنة)
  WEDNESDAY: { month: null, day: 3, name: 'صوم الأربعاء', dayOfWeek: 3 },
  FRIDAY: { month: null, day: 5, name: 'صوم الجمعة', dayOfWeek: 5 },

  // الصيامات الموسمية
  ADVENT: { startMonth: 11, startDay: 15, endMonth: 12, endDay: 24, name: 'صيام الميلاد' },
  NATIVITY: { startMonth: 11, startDay: 15, endMonth: 12, endDay: 24, name: 'صيام الميلاد' },
  APOSTLES: { startMonth: 5, startDay: 25, startDays: 46, name: 'صيام الرسل' },
  VIRGIN: { startMonth: 8, startDay: 1, startDays: 15, name: 'صيام العذراء' },
  JONAH: { startMonth: 2, startDays: 3, name: 'صيام يونان النبي' },

  // صيام الأسبوع الكبير (متحرك - حسب عيد الفصح)
  GREAT_LENT: { name: 'الصيام الكبير', isMoving: true }
};

const CHRISTIAN_FEASTS = {
  CHRISTMAS: { month: 12, day: 25, name: 'عيد الميلاد' },
  THEOPHANY: { month: 1, day: 6, name: 'عيد الظهور الإلهي' },
  EASTER: { name: 'عيد الفصح (القيامة)', isMoving: true },
  ASCENSION: { name: 'عيد الصعود', isMoving: true },
  PENTECOST: { name: 'عيد الخمسين (الشروق القدس)', isMoving: true },
  ASSUMPTION: { month: 8, day: 15, name: 'عيد انتقال العذراء' },
  ALL_SAINTS: { month: 11, day: 1, name: 'عيد جميع القديسين' }
};

// ═══════════════════════════════════════════════════════════════════════════
// حساب عيد الفصح (Easter - الخوارزمية)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب تاريخ عيد الفصح (Easter) لسنة معينة
 * باستخدام الخوارزمية الحسابية (Computational Ecclesiastical Calendar)
 * 
 * @param {number} year - السنة الميلادية
 * @returns {Date} - تاريخ عيد الفصح
 */
function getEasterDate(year) {
  // خوارزمية Meeus/Jones/Butcher
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * حساب تاريخ بداية الصيام الكبير (قبل 48 يوم من الفصح)
 * @param {number} year - السنة الميلادية
 * @returns {Date} - تاريخ بداية الصيام الكبير
 */
function getGreatLentStartDate(year) {
  const easter = getEasterDate(year);
  const lentStart = new Date(easter);
  lentStart.setDate(lentStart.getDate() - 48); // 48 يوم قبل الفصح
  return lentStart;
}

/**
 * حساب تاريخ الأسبوع الكبير (Holy Week - الأسبوع قبل الفصح)
 * @param {number} year - السنة الميلادية
 * @returns {Object} - {startDate, endDate}
 */
function getHolyWeekDates(year) {
  const easter = getEasterDate(year);
  const holyWeekStart = new Date(easter);
  holyWeekStart.setDate(holyWeekStart.getDate() - 7); // 7 أيام قبل الفصح

  return {
    startDate: holyWeekStart,
    endDate: easter
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// التحقق من الصيام المسيحي
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من هل هو يوم صيام مسيحي
 * 
 * الصيامات المسيحية:
 * 1. صوم الأربعاء والجمعة (طول السنة ما عدا فترات معينة)
 * 2. صيام الميلاد (15 نوفمبر - 24 ديسمبر)
 * 3. صيام الرسل (25 مايو + 46 يوم)
 * 4. صيام العذراء (1-15 أغسطس)
 * 5. صيام يونان (ثلاثة أيام قبل الصيام الكبير)
 * 6. الصيام الكبير (48 يوم قبل الفصح)
 * 
 * @param {Date} date - التاريخ
 * @returns {Object} - {isFasting, type, name, details, allowFish}
 */
function getChristianFastStatus(date = new Date()) {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }

  const dayOfWeek = date.getDay(); // 0 = الأحد، 3 = الأربعاء، 5 = الجمعة
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // ───────────────────────────────────────────────────────────────────────
  // 1. الصيام الكبير (الأولوية الأعلى)
  // ───────────────────────────────────────────────────────────────────────

  const lentStart = getGreatLentStartDate(year);
  const easter = getEasterDate(year);

  if (date >= lentStart && date < easter) {
    // نوع الصيام حسب الأسبوع
    const daysUntilEaster = Math.floor((easter - date) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEaster <= 7) {
      // الأسبوع الكبير (Holy Week) - صيام كامل
      return {
        isFasting: true,
        type: 'full',
        name: 'الأسبوع الكبير',
        details: 'صيام مفروض - بدون لحم، دواجن، ألبان، بيض، زيت',
        restrictions: ['meat', 'poultry', 'dairy', 'eggs', 'oil'],
        allowFish: false,
        isObligatory: true
      };
    } else {
      // باقي الصيام الكبير
      return {
        isFasting: true,
        type: 'partial',
        name: 'الصيام الكبير',
        details: 'صيام جزئي - بدون لحم أحمر، يسمح بالدواجن والسمك',
        restrictions: ['meat'], // فقط اللحم الأحمر
        allowFish: true,
        isObligatory: true
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // 2. صيام يونان (ثلاثة أيام قبل الصيام الكبير)
  // ───────────────────────────────────────────────────────────────────────

  const jonahStart = new Date(lentStart);
  jonahStart.setDate(jonahStart.getDate() - 3); // 3 أيام قبل الصيام الكبير

  if (date >= jonahStart && date < lentStart) {
    return {
      isFasting: true,
      type: 'full',
      name: 'صيام يونان',
      details: 'صيام مفروض - تذكر يونان والحوت',
      restrictions: ['meat', 'dairy', 'eggs', 'oil'],
      allowFish: false,
      isObligatory: true
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 3. صيام الميلاد (15 نوفمبر - 24 ديسمبر)
  // ───────────────────────────────────────────────────────────────────────

  if ((month === 11 && day >= 15) || (month === 12 && day <= 24)) {
    return {
      isFasting: true,
      type: 'partial',
      name: 'صيام الميلاد',
      details: 'صيام تحضيري - بدون لحم أحمر',
      restrictions: ['meat'],
      allowFish: true,
      isObligatory: true
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 4. صيام الرسل (25 مايو + 46 يوم)
  // ───────────────────────────────────────────────────────────────────────

  const apostlesStart = new Date(year, 4, 25); // 25 مايو (الشهر 4 = مايو)
  const apostlesEnd = new Date(apostlesStart);
  apostlesEnd.setDate(apostlesEnd.getDate() + 46);

  if (date >= apostlesStart && date <= apostlesEnd) {
    return {
      isFasting: true,
      type: 'partial',
      name: 'صيام الرسل',
      details: 'صيام مستحب - بدون لحم أحمر',
      restrictions: ['meat'],
      allowFish: true,
      isObligatory: false
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 5. صيام العذراء (1-15 أغسطس)
  // ───────────────────────────────────────────────────────────────────────

  if (month === 8 && day >= 1 && day <= 15) {
    return {
      isFasting: true,
      type: 'partial',
      name: 'صيام العذراء',
      details: 'صيام مستحب - بدون لحم أحمر',
      restrictions: ['meat'],
      allowFish: true,
      isObligatory: false
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 6. صوم الأربعاء والجمعة (طول السنة)
  // ───────────────────────────────────────────────────────────────────────

  if (dayOfWeek === 3 || dayOfWeek === 5) {
    // في فترات معينة لا يكون صوم (بعد الفصح مثلاً)
    // لكن في أغلب الوقت يكون
    if (date > easter && date < new Date(year, 4, 25)) {
      // فترة بعد الفصح - لا صيام
      return {
        isFasting: false,
        type: 'none',
        name: 'يوم عادي',
        details: 'لا صيام (فترة الفرح بعد الفصح)',
        restrictions: []
      };
    }

    return {
      isFasting: true,
      type: 'partial',
      name: dayOfWeek === 3 ? 'صوم الأربعاء' : 'صوم الجمعة',
      details: 'صوم أسبوعي مستحب',
      restrictions: ['meat'],
      allowFish: true,
      isObligatory: false
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 7. لا يوجد صيام اليوم
  // ───────────────────────────────────────────────────────────────────────

  return {
    isFasting: false,
    type: 'none',
    name: 'يوم عادي',
    details: 'لا يوجد صيام',
    restrictions: []
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على أقرب عيد مسيحي
 * @param {Date} date - التاريخ
 * @returns {Object} - {name, date, daysUntil}
 */
function getNextChristianFeast(date = new Date()) {
  const year = date.getFullYear();
  const feasts = [
    { name: 'عيد الميلاد', date: new Date(year, 11, 25) },
    { name: 'عيد الظهور الإلهي', date: new Date(year + 1, 0, 6) },
    { name: 'عيد الفصح (القيامة)', date: getEasterDate(year) },
    { name: 'عيد الصعود', date: new Date(getEasterDate(year).getTime() + 39 * 24 * 60 * 60 * 1000) },
    { name: 'عيد الخمسين', date: new Date(getEasterDate(year).getTime() + 50 * 24 * 60 * 60 * 1000) },
    { name: 'عيد انتقال العذراء', date: new Date(year, 7, 15) },
    { name: 'عيد جميع القديسين', date: new Date(year, 10, 1) }
  ];

  // البحث عن أقرب عيد
  let nextFeast = null;
  let minDays = Infinity;

  for (let feast of feasts) {
    const daysUntil = Math.ceil((feast.date - date) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil < minDays) {
      minDays = daysUntil;
      nextFeast = {
        name: feast.name,
        date: feast.date,
        daysUntil: daysUntil
      };
    }
  }

  return nextFeast;
}

/**
 * هل يسمح بأكل معين في الصيام المسيحي
 * @param {Object} fastStatus - حالة الصيام
 * @param {string} foodCategory - فئة الطعام
 * @returns {boolean}
 */
function isChristianFoodAllowed(fastStatus, foodCategory) {
  if (!fastStatus || !fastStatus.isFasting) {
    return true; // لا صيام = كل شيء مسموح
  }

  // إذا كان السمك مسموح والفئة هي سمك
  if (fastStatus.allowFish && foodCategory === 'fish') {
    return true;
  }

  // إذا كانت الفئة في قائمة المحظورات
  return !fastStatus.restrictions.includes(foodCategory);
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CHRISTIAN_FASTS,
    CHRISTIAN_FEASTS,
    getEasterDate,
    getGreatLentStartDate,
    getHolyWeekDates,
    getChristianFastStatus,
    getNextChristianFeast,
    isChristianFoodAllowed
  };
}

console.log('✅ نظام الصيام المسيحي جاهز');
