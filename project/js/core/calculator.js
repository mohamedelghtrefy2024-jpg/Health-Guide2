/**
 * 🧮 calculator.js - حسابات التغذية والأيض
 * 
 * يحسب:
 * - BMR: معدل الأيض الأساسي
 * - TDEE: الحرق اليومي الكلي
 * - Daily Goal: الهدف اليومي
 * - Exercise Burn: حرق التمارين
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// معادلات BMR (معدل الأيض الأساسي)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب BMR باستخدام معادلة Mifflin-St Jeor (الأكثر دقة)
 * 
 * الصيغة:
 * - الرجال: (10 × الوزن) + (6.25 × الطول) - (5 × العمر) + 5
 * - النساء: (10 × الوزن) + (6.25 × الطول) - (5 × العمر) - 161
 * 
 * @param {number} weight - الوزن بالكيلوجرام
 * @param {number} height - الطول بالسنتيمتر
 * @param {number} age - العمر بالسنوات
 * @param {string} gender - الجنس (male/female)
 * @returns {number} - BMR بالسعرات
 */
function calcBMRMifflin(weight, height, age, gender) {
  if (!weight || !height || !age) {
    console.warn('⚠️ بيانات ناقصة لحساب BMR');
    return 0;
  }

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);

  if (gender === 'male' || gender === 'ذكر') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  return Math.round(bmr);
}

/**
 * حساب BMR باستخدام معادلة Katch-McArdle (إذا توفرت نسبة الدهون)
 * 
 * الصيغة:
 * BMR = 370 + (21.6 × كتلة الجسم الخالية من الدهون)
 * 
 * @param {number} leanMass - كتلة الجسم الخالية من الدهون (كيلو)
 * @returns {number} - BMR بالسعرات
 */
function calcBMRKatch(leanMass) {
  if (!leanMass || leanMass <= 0) {
    console.warn('⚠️ بيانات غير صحيحة للـ Katch-McArdle');
    return 0;
  }

  return Math.round(370 + (21.6 * leanMass));
}

/**
 * دالة موحدة لحساب BMR
 * تختار أفضل طريقة حسب البيانات المتوفرة
 * 
 * @param {Object} profile - ملف المستخدم
 * @returns {number} - BMR بالسعرات
 */
function calcBMR(profile) {
  // إذا كانت نسبة الدهون متوفرة، استخدم Katch-McArdle
  if (profile.bodyFatPercent && profile.weight) {
    const leanMass = profile.weight * (1 - profile.bodyFatPercent / 100);
    return calcBMRKatch(leanMass);
  }

  // وإلا استخدم Mifflin-St Jeor (الأكثر دقة بدون نسبة دهون)
  return calcBMRMifflin(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// معاملات النشاط (Activity Levels)
// ═══════════════════════════════════════════════════════════════════════════

const ACTIVITY_LEVELS = {
  sedentary: {
    value: 1.2,
    label: 'مستقر جداً',
    description: 'تمارين قليلة أو بلا تمارين'
  },
  light: {
    value: 1.375,
    label: 'نشاط خفيف',
    description: 'تمارين 1-3 أيام بالأسبوع'
  },
  moderate: {
    value: 1.55,
    label: 'نشاط معتدل',
    description: 'تمارين 3-5 أيام بالأسبوع'
  },
  active: {
    value: 1.725,
    label: 'نشاط عالي',
    description: 'تمارين 6-7 أيام بالأسبوع'
  },
  veryActive: {
    value: 1.9,
    label: 'نشاط جداً عالي',
    description: 'تمارين مكثفة يومياً أو وظيفة بدنية'
  }
};

/**
 * حساب TDEE (إجمالي حرق الطاقة اليومي)
 * 
 * الصيغة:
 * TDEE = BMR × معامل النشاط
 * 
 * @param {number} bmr - معدل الأيض الأساسي
 * @param {number} activityLevel - معامل النشاط (1.2-1.9)
 * @returns {number} - TDEE بالسعرات
 */
function calcTDEE(bmr, activityLevel = 1.55) {
  if (!bmr || bmr <= 0) {
    console.warn('⚠️ BMR غير صحيح');
    return 0;
  }

  return Math.round(bmr * activityLevel);
}

// ═══════════════════════════════════════════════════════════════════════════
// الهدف اليومي (Daily Caloric Goal)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب الهدف اليومي من السعرات
 * 
 * حسب الهدف:
 * - خسارة الوزن: TDEE - العجز (200-1000)
 * - الحفاظ: TDEE
 * - زيادة الوزن: TDEE + الفائض (100-400)
 * 
 * مع حد أدنى آمن:
 * - الرجال: 1500 أو BMR × 1.1
 * - النساء: 1200 أو BMR × 1.1
 * 
 * @param {Object} profile - ملف المستخدم
 * @param {number} tdee - TDEE المحسوب
 * @returns {number} - الهدف اليومي بالسعرات
 */
function calcDailyGoal(profile, tdee) {
  if (!tdee || tdee <= 0) {
    console.warn('⚠️ TDEE غير صحيح');
    return 2000; // قيمة افتراضية
  }

  let goal = tdee;
  const bmr = calcBMR(profile);

  // تحديد الحد الأدنى الآمن
  const minSafeForMale = Math.max(1500, bmr * 1.1);
  const minSafeForFemale = Math.max(1200, bmr * 1.1);
  const minSafe = profile.gender === 'female' || profile.gender === 'أنثى'
    ? minSafeForFemale
    : minSafeForMale;

  // تطبيق الهدف
  switch (profile.goal) {
    case 'loss':
    case 'خسارة':
      // خسارة الوزن = TDEE - العجز
      const deficit = Math.min(profile.deficit || 500, 1000);
      goal = Math.max(tdee - deficit, minSafe);
      break;

    case 'gain':
    case 'زيادة':
      // زيادة الوزن = TDEE + الفائض
      const surplus = Math.min(profile.deficit || 300, 500);
      goal = tdee + surplus;
      break;

    case 'maintain':
    case 'حفاظ':
    default:
      // الحفاظ = TDEE
      goal = tdee;
      break;
  }

  return Math.round(goal);
}

// ═══════════════════════════════════════════════════════════════════════════
// جداول MET (Metabolic Equivalent of Task)
// ═══════════════════════════════════════════════════════════════════════════

const MET_VALUES = {
  // تمارين منخفضة الشدة
  walking: { value: 3.5, label: 'مشي عادي' },
  easyWalking: { value: 2.8, label: 'مشي خفيف' },
  housework: { value: 3.0, label: 'أعمال منزلية' },

  // تمارين متوسطة الشدة
  briskWalking: { value: 5.0, label: 'مشي سريع' },
  cycling: { value: 7.5, label: 'ركوب دراجة' },
  swimming: { value: 8.0, label: 'سباحة' },
  running: { value: 9.8, label: 'جري' },

  // تمارين عالية الشدة
  heavyRunning: { value: 12.3, label: 'جري سريع' },
  sprinting: { value: 15.0, label: 'عدو' },

  // تمارين المقاومة
  lightWeightlifting: { value: 3.0, label: 'رفع أوزان خفيفة' },
  weightlifting: { value: 6.0, label: 'رفع أوزان' },

  // تمارين أخرى
  yoga: { value: 2.5, label: 'يوغا' },
  pilates: { value: 3.5, label: 'بيلاتس' },
  dancing: { value: 5.5, label: 'رقص' },
  tennis: { value: 7.3, label: 'تنس' },
  basketball: { value: 8.0, label: 'كرة سلة' }
};

/**
 * حساب حرق التمرين باستخدام معادلة MET
 * 
 * الصيغة:
 * الحرق = MET × الوزن (بالكيلو) × المدة (بالساعات)
 * 
 * @param {string} exerciseName - اسم التمرين
 * @param {number} weight - وزن الشخص بالكيلو
 * @param {number} durationMinutes - مدة التمرين بالدقائق
 * @returns {number} - السعرات المحروقة
 */
function calcExercise(exerciseName, weight, durationMinutes) {
  if (!exerciseName || !weight || !durationMinutes) {
    console.warn('⚠️ بيانات ناقصة لحساب حرق التمرين');
    return 0;
  }

  // البحث عن قيمة MET
  let met = 5; // قيمة افتراضية معتدلة

  for (let key in MET_VALUES) {
    if (exerciseName.includes(key) || exerciseName.toLowerCase().includes(MET_VALUES[key].label)) {
      met = MET_VALUES[key].value;
      break;
    }
  }

  // الحساب
  const durationHours = durationMinutes / 60;
  const burn = met * weight * durationHours;

  return Math.round(burn);
}

/**
 * حساب حرق تمرين مخصص
 * @param {number} metValue - قيمة MET المخصصة
 * @param {number} weight - الوزن بالكيلو
 * @param {number} durationMinutes - المدة بالدقائق
 * @returns {number} - السعرات المحروقة
 */
function calcCustomExercise(metValue, weight, durationMinutes) {
  if (!metValue || !weight || !durationMinutes) {
    return 0;
  }

  const durationHours = durationMinutes / 60;
  return Math.round(metValue * weight * durationHours);
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مساعدة للحسابات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب BMI (مؤشر كتلة الجسم)
 * @param {number} weight - الوزن بالكيلو
 * @param {number} height - الطول بالسنتيمتر
 * @returns {number} - BMI
 */
function calcBMI(weight, height) {
  if (!weight || !height) return 0;
  const heightMeters = height / 100;
  return Math.round((weight / (heightMeters * heightMeters)) * 10) / 10;
}

/**
 * تصنيف BMI
 * @param {number} bmi - قيمة BMI
 * @returns {string} - التصنيف
 */
function getBMICategory(bmi) {
  if (bmi < 18.5) return 'نحيف جداً';
  if (bmi < 25) return 'وزن طبيعي';
  if (bmi < 30) return 'زيادة وزن';
  if (bmi < 35) return 'بدانة (درجة 1)';
  if (bmi < 40) return 'بدانة (درجة 2)';
  return 'بدانة (درجة 3)';
}

/**
 * حساب كتلة الجسم الخالية من الدهون
 * @param {number} weight - الوزن بالكيلو
 * @param {number} bodyFatPercent - نسبة الدهون
 * @returns {number} - كتلة الجسم الخالية من الدهون
 */
function calcLeanMass(weight, bodyFatPercent) {
  if (!weight || !bodyFatPercent) return 0;
  return weight * (1 - bodyFatPercent / 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcBMRMifflin,
    calcBMRKatch,
    calcBMR,
    calcTDEE,
    calcDailyGoal,
    calcExercise,
    calcCustomExercise,
    calcBMI,
    getBMICategory,
    calcLeanMass,
    ACTIVITY_LEVELS,
    MET_VALUES
  };
}

console.log('✅ دوال الحساب جاهزة');
