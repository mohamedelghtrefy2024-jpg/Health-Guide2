/**
 * 📏 food-units.js - نظام وحدات القياس
 * 
 * تحويل الأصناف إلى وحدات معيارية:
 * - piece (حبة/شريحة/رغيف)
 * - weight (وزن بالجرام)
 * - liquid (سوائل بالمليمتر)
 * - spoon (ملاعق)
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

/**
 * نظام وحدات القياس الشامل
 * @type {Object}
 * 
 * كل وحدة تحتوي على:
 * - weight: وزن الوحدة الواحدة بالجرام (أو مل للسوائل)
 * - unit: الوحدة باللغة الإنجليزية
 * - unitAr: الوحدة باللغة العربية
 * - type: نوع الوحدة (piece, weight, liquid, spoon)
 */
const FOOD_UNITS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // الخضروات الكاملة (piece)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'خيار': {
    weight: 201,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'طماطم': {
    weight: 123,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'جرجير': {
    weight: 20,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'weight'
  },
  'فلفل ألوان': {
    weight: 119,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // الفواكه (piece)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'تفاح': {
    weight: 182,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'موز': {
    weight: 118,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'برتقال': {
    weight: 131,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'جريب فروت': {
    weight: 120,
    unit: 'piece',
    unitAr: 'نصف',
    type: 'piece'
  },
  'رمان': {
    weight: 282,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'مانجو': {
    weight: 207,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'بطيخ': {
    weight: 280,
    unit: 'slice',
    unitAr: 'شريحة',
    type: 'piece'
  },
  'شمام': {
    weight: 275,
    unit: 'half',
    unitAr: 'نصف',
    type: 'piece'
  },
  'كيوي': {
    weight: 76,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'ليمون': {
    weight: 58,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'ليمون هندي': {
    weight: 64,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'توت': {
    weight: 148,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'weight'
  },
  'عنب': {
    weight: 160,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'weight'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // البروتينات (weight)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'دجاج': {
    weight: 100,
    unit: 'gram',
    unitAr: 'جم',
    type: 'weight'
  },
  'لحم بقر': {
    weight: 100,
    unit: 'gram',
    unitAr: 'جم',
    type: 'weight'
  },
  'سمك': {
    weight: 100,
    unit: 'gram',
    unitAr: 'جم',
    type: 'weight'
  },
  'بيضة': {
    weight: 50,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'جبنة': {
    weight: 30,
    unit: 'slice',
    unitAr: 'شريحة',
    type: 'piece'
  },
  'زبادي': {
    weight: 200,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'weight'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // البقوليات (weight)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'فول': {
    weight: 150,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'weight'
  },
  'عدس': {
    weight: 100,
    unit: 'gram',
    unitAr: 'جم',
    type: 'weight'
  },
  'حمص': {
    weight: 100,
    unit: 'gram',
    unitAr: 'جم',
    type: 'weight'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // الحبوب (weight)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'أرز': {
    weight: 150,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'weight'
  },
  'مكرونة': {
    weight: 60,
    unit: 'plate',
    unitAr: 'طبق',
    type: 'weight'
  },
  'خبز': {
    weight: 30,
    unit: 'slice',
    unitAr: 'شريحة',
    type: 'piece'
  },
  'شعيرية': {
    weight: 75,
    unit: 'plate',
    unitAr: 'طبق',
    type: 'weight'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // المكسرات (piece أو weight)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'لوز': {
    weight: 1.2,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'تمر': {
    weight: 7,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'زبيب': {
    weight: 5,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'جوز': {
    weight: 7,
    unit: 'piece',
    unitAr: 'نصف',
    type: 'piece'
  },
  'فستق': {
    weight: 1,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'كاجو': {
    weight: 1.3,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'صنوبر': {
    weight: 0.5,
    unit: 'piece',
    unitAr: 'حبة',
    type: 'piece'
  },
  'بذور دوار الشمس': {
    weight: 8,
    unit: 'tablespoon',
    unitAr: 'م.ك',
    type: 'spoon'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // الزيوت والدهون (spoon)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'زيت زيتون': {
    weight: 14,
    unit: 'tablespoon',
    unitAr: 'م.ك',
    type: 'spoon'
  },
  'زيت ذرة': {
    weight: 14,
    unit: 'tablespoon',
    unitAr: 'م.ك',
    type: 'spoon'
  },
  'زبدة': {
    weight: 14,
    unit: 'tablespoon',
    unitAr: 'م.ك',
    type: 'spoon'
  },
  'عسل': {
    weight: 21,
    unit: 'tablespoon',
    unitAr: 'م.ك',
    type: 'spoon'
  },
  'مايونيز': {
    weight: 15,
    unit: 'tablespoon',
    unitAr: 'م.ك',
    type: 'spoon'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // المشروبات (liquid)
  // ═══════════════════════════════════════════════════════════════════════════
  
  'ماء': {
    weight: 1,
    unit: 'ml',
    unitAr: 'مل',
    type: 'liquid'
  },
  'شاي': {
    weight: 240,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'liquid'
  },
  'قهوة': {
    weight: 240,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'liquid'
  },
  'عصير': {
    weight: 240,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'liquid'
  },
  'حليب': {
    weight: 240,
    unit: 'cup',
    unitAr: 'كوب',
    type: 'liquid'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // الافتراضي والـ Fallback
  // ═══════════════════════════════════════════════════════════════════════════
  
  _default: {
    weight: 100,
    unit: 'gram',
    unitAr: 'جم',
    type: 'weight',
    description: 'الوحدة الافتراضية لأصناف بدون وحدة محددة'
  }
};

/**
 * دالة للحصول على وحدة قياس الصنف
 * @param {Object} food - الصنف الغذائي
 * @returns {Object} - معلومات الوحدة
 */
function getFoodUnit(food) {
  if (!food || !food.name) {
    return FOOD_UNITS._default;
  }
  
  const normalized = food.name.trim();
  
  // بحث مباشر
  if (FOOD_UNITS[normalized]) {
    return FOOD_UNITS[normalized];
  }
  
  // بحث غير دقيق
  for (let key in FOOD_UNITS) {
    if (key !== '_default') {
      if (normalized.includes(key) || key.includes(normalized)) {
        return FOOD_UNITS[key];
      }
    }
  }
  
  // الافتراضي
  return FOOD_UNITS._default;
}

/**
 * تحويل كمية من صنف إلى جرام معياري
 * @param {number} quantity - الكمية
 * @param {Object} food - الصنف الغذائي
 * @returns {number} - الوزن بالجرام
 */
function convertToGrams(quantity, food) {
  const unit = getFoodUnit(food);
  
  switch (unit.type) {
    case 'piece':
    case 'spoon':
      return quantity * unit.weight;
    case 'weight':
      return quantity; // بالفعل بالجرام
    case 'liquid':
      return quantity; // بالفعل بالمليمتر (نستخدمه كجرام للسوائل)
    default:
      return quantity * unit.weight;
  }
}

/**
 * تحويل من جرام إلى الوحدة المناسبة للصنف
 * @param {number} grams - الوزن بالجرام
 * @param {Object} food - الصنف الغذائي
 * @returns {number} - الكمية بالوحدة المناسبة
 */
function convertFromGrams(grams, food) {
  const unit = getFoodUnit(food);
  
  if (unit.weight === 0) {
    return grams;
  }
  
  return grams / unit.weight;
}

/**
 * الحصول على وصف وحدة قياس
 * @param {Object} food - الصنف الغذائي
 * @returns {string} - وصف الوحدة
 */
function getUnitLabel(food) {
  const unit = getFoodUnit(food);
  return unit.unitAr || unit.unit;
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FOOD_UNITS,
    getFoodUnit,
    convertToGrams,
    convertFromGrams,
    getUnitLabel
  };
}

console.log('✅ نظام وحدات القياس جاهز');
