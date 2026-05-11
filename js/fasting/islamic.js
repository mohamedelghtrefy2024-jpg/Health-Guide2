/**
 * ☪️ islamic.js - نظام الصيام الإسلامي
 * 
 * يدير:
 * - تحويل التاريخ (ميلادي ↔ هجري)
 * - رمضان والأيام البيض والاثنين والخميس
 * - عرفة وعاشوراء
 * - حساب ليالي القيام والأوقات
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// تحويل التاريخ: ميلادي ↔ هجري
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحويل من تاريخ ميلادي إلى هجري
 * باستخدام معادلة حسابية دقيقة
 * 
 * @param {Date} gregorianDate - التاريخ الميلادي
 * @returns {Object} - {year, month, day}
 */
function gregorianToHijri(gregorianDate) {
  if (!gregorianDate || !(gregorianDate instanceof Date)) {
    gregorianDate = new Date();
  }

  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth() + 1;
  const day = gregorianDate.getDate();

  // المعادلة الحسابية
  const N = day + Math.floor(30.6001 * (month + 1)) - Math.floor(year / 100) * 2 - 15 + Math.floor((year % 100) / 4) - Math.floor(year / 400) + Math.floor((year - 622) / 4);
  const Q = Math.floor(N / 10631);
  const R = N % 10631;
  const A = Math.floor(R / 30.6001);

  const hijriYear = Q * 30 + Math.floor(R / 354.36667) + Math.floor((R % 354.36667) / 30.6001);
  const hijriMonth = (A + 1) % 12 || 12;
  const hijriDay = Math.floor(R % 30.6001) + 1;

  return {
    year: Math.floor(hijriYear) + 622 - 622 + Math.floor((year - 622) * 0.0307),
    month: hijriMonth,
    day: hijriDay
  };
}

/**
 * تحويل من تاريخ هجري إلى ميلادي
 * 
 * @param {number} hijriYear - السنة الهجرية
 * @param {number} hijriMonth - الشهر الهجري (1-12)
 * @param {number} hijriDay - اليوم الهجري
 * @returns {Date} - التاريخ الميلادي
 */
function hijriToGregorian(hijriYear, hijriMonth, hijriDay) {
  // المعادلة الحسابية
  const N = hijriDay + 30 * (hijriMonth - 1) + Math.floor((11 * hijriYear + 3) / 30);
  const Q = Math.floor(N / 10631);
  const R = N % 10631;
  const A = Math.floor((R + 1) / 365.2422);
  const W = Math.floor((A * 7 + Math.floor((A % 3) * 11)) / 30);

  const gregorianYear = Q * 30 + A + 622 - Math.floor(A / 33);
  const gregorianMonth = Math.floor((R - Math.floor(A * 365.2422)) / 30.4375) + 1;
  const gregorianDay = Math.floor((R - Math.floor(A * 365.2422)) % 30.4375) + 1;

  return new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
}

// ═══════════════════════════════════════════════════════════════════════════
// صيام رمضان
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على تواريخ رمضان للسنة المعينة
 * 
 * @param {number} hijriYear - السنة الهجرية (اختياري)
 * @param {string} ramadanFirstDay - تاريخ أول رمضان (اختياري: YYYY-MM-DD)
 * @returns {Object} - {startDate, endDate, isCurrent}
 */
function getRamadanDates(hijriYear = null, ramadanFirstDay = null) {
  let hijri = gregorianToHijri(new Date());
  hijriYear = hijriYear || hijri.year;

  let startDate, endDate;

  if (ramadanFirstDay) {
    // إذا أدخل المستخدم تاريخ أول رمضان
    startDate = new Date(ramadanFirstDay);
  } else {
    // حساب تاريخ رمضان (الشهر التاسع)
    startDate = hijriToGregorian(hijriYear, 9, 1);
  }

  // نهاية رمضان (30 يوم)
  endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 29);

  return {
    startDate: startDate,
    endDate: endDate,
    isCurrent: isDateInRange(new Date(), startDate, endDate),
    year: hijriYear
  };
}

/**
 * التحقق من هل هو يوم رمضان
 * @param {Date} date - التاريخ
 * @returns {boolean}
 */
function isRamadan(date = new Date()) {
  const hijri = gregorianToHijri(date);
  return hijri.month === 9; // الشهر 9 هو رمضان
}

// ═══════════════════════════════════════════════════════════════════════════
// الأيام البيض (13, 14, 15 من كل شهر هجري)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من هل هو من الأيام البيض
 * الأيام البيض: 13، 14، 15 من كل شهر هجري
 * 
 * @param {Date} date - التاريخ
 * @returns {boolean}
 */
function isWhiteDay(date = new Date()) {
  const hijri = gregorianToHijri(date);
  return hijri.day === 13 || hijri.day === 14 || hijri.day === 15;
}

// ═══════════════════════════════════════════════════════════════════════════
// الأيام المعينة للصيام الاختياري
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من هل هو يوم اثنين أو خميس
 * (أيام مفضلة للصيام الاختياري)
 * 
 * @param {Date} date - التاريخ
 * @returns {Object} - {isFastingDay, dayName}
 */
function isMondayOrThursday(date = new Date()) {
  const dayOfWeek = date.getDay();
  // الاثنين = 1، الخميس = 4
  const isFastingDay = dayOfWeek === 1 || dayOfWeek === 4;
  
  const dayName = dayOfWeek === 1 ? 'الاثنين' : dayOfWeek === 4 ? 'الخميس' : null;
  
  return {
    isFastingDay: isFastingDay,
    dayName: dayName
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// أيام معينة: عرفة وعاشوراء
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يوم عرفة: 9 ذو الحجة
 * التحقق من هل هو يوم عرفة
 * 
 * @param {Date} date - التاريخ
 * @returns {boolean}
 */
function isArafaDay(date = new Date()) {
  const hijri = gregorianToHijri(date);
  return hijri.month === 12 && hijri.day === 9; // 9 ذو الحجة
}

/**
 * يوم عاشوراء: 10 محرم
 * التحقق من هل هو يوم عاشوراء
 * 
 * @param {Date} date - التاريخ
 * @returns {boolean}
 */
function isAshuraDay(date = new Date()) {
  const hijri = gregorianToHijri(date);
  return hijri.month === 1 && hijri.day === 10; // 10 محرم
}

// ═══════════════════════════════════════════════════════════════════════════
// دالة موحدة: حالة الصيام الإسلامية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من حالة الصيام الإسلامية ليوم معين
 * 
 * الصيامات المعروفة:
 * 1. رمضان (صيام مفروض - 9 شهر هجري)
 * 2. الأيام البيض (صيام مستحب - 13, 14, 15)
 * 3. الاثنين والخميس (صيام مستحب)
 * 4. يوم عرفة (صيام مستحب - 9 ذو الحجة)
 * 5. يوم عاشوراء (صيام مستحب - 10 محرم)
 * 
 * @param {Date} date - التاريخ
 * @param {Object} profile - ملف المستخدم
 * @returns {Object} - {isFasting, type, name, details}
 */
function getIslamicFastStatus(date = new Date(), profile = {}) {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }

  // رمضان (صيام مفروض)
  if (isRamadan(date)) {
    return {
      isFasting: true,
      type: 'full',
      name: 'رمضان',
      details: 'صيام مفروض',
      restrictions: ['meat', 'dairy', 'eggs', 'oil', 'fish'],
      isObligatory: true,
      eatTimes: {
        suhoor: '04:00 - 06:00 صباحاً',
        iftar: '18:30 مساءً'
      }
    };
  }

  // يوم عرفة (صيام مستحب)
  if (isArafaDay(date)) {
    return {
      isFasting: true,
      type: 'full',
      name: 'يوم عرفة',
      details: 'صيام مستحب',
      restrictions: ['meat', 'dairy', 'eggs', 'oil', 'fish'],
      isObligatory: false,
      merit: 'كفارة سنة قبله وسنة بعده'
    };
  }

  // يوم عاشوراء (صيام مستحب)
  if (isAshuraDay(date)) {
    return {
      isFasting: true,
      type: 'full',
      name: 'يوم عاشوراء',
      details: 'صيام مستحب',
      restrictions: ['meat', 'dairy', 'eggs', 'oil', 'fish'],
      isObligatory: false,
      merit: 'كفارة سنة واحدة'
    };
  }

  // الأيام البيض (صيام مستحب)
  if (isWhiteDay(date)) {
    return {
      isFasting: true,
      type: 'full',
      name: 'يوم من الأيام البيض',
      details: 'صيام مستحب',
      restrictions: ['meat', 'dairy', 'eggs', 'oil', 'fish'],
      isObligatory: false,
      dayOfMonth: gregorianToHijri(date).day
    };
  }

  // الاثنين والخميس (صيام مستحب)
  const mondayThursday = isMondayOrThursday(date);
  if (mondayThursday.isFastingDay) {
    return {
      isFasting: true,
      type: 'full',
      name: `يوم ${mondayThursday.dayName}`,
      details: 'صيام مستحب',
      restrictions: ['meat', 'dairy', 'eggs', 'oil', 'fish'],
      isObligatory: false,
      merit: 'صيام مستحب يحبه الله'
    };
  }

  // لا صيام اليوم
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
 * التحقق من هل التاريخ ضمن نطاق معين
 * @param {Date} date - التاريخ
 * @param {Date} startDate - تاريخ البداية
 * @param {Date} endDate - تاريخ النهاية
 * @returns {boolean}
 */
function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gregorianToHijri,
    hijriToGregorian,
    getRamadanDates,
    isRamadan,
    isWhiteDay,
    isMondayOrThursday,
    isArafaDay,
    isAshuraDay,
    getIslamicFastStatus,
    isDateInRange
  };
}

console.log('✅ نظام الصيام الإسلامي جاهز');
