/**
 * 📊 tracker.js - تبويب التتبع اليومي
 * 
 * يدير:
 * - تتبع الطعام حسب الوجبات
 * - حساب السعرات والماكرو
 * - تتبع تناول الماء
 * - ملخص اليوم
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// تهيئة التتبع اليومي
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على أو إنشاء سجل اليوم
 * @param {Object} tracker - بيانات التتبع
 * @param {string} date - التاريخ (ISO format، افتراضي: اليوم)
 * @returns {Object} - سجل اليوم
 */
function getDayRecord(tracker, date = new Date().toISOString().split('T')[0]) {
  if (!tracker[date]) {
    tracker[date] = {
      date: date,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      },
      water: 0,
      waterGoal: 2000,
      exercises: [],
      notes: ''
    };
  }
  return tracker[date];
}

/**
 * إضافة طعام للوجبة
 * @param {Object} dayRecord - سجل اليوم
 * @param {string} meal - اسم الوجبة (breakfast, lunch, dinner, snacks)
 * @param {Object} food - الطعام (مع الكمية)
 */
function addFoodToMeal(dayRecord, meal, food) {
  if (!dayRecord.meals[meal]) {
    dayRecord.meals[meal] = [];
  }
  
  dayRecord.meals[meal].push({
    ...food,
    addedAt: new Date().toISOString()
  });
}

/**
 * إزالة طعام من الوجبة
 * @param {Object} dayRecord - سجل اليوم
 * @param {string} meal - اسم الوجبة
 * @param {number} index - موقع الطعام في المصفوفة
 */
function removeFoodFromMeal(dayRecord, meal, index) {
  if (dayRecord.meals[meal]) {
    dayRecord.meals[meal].splice(index, 1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات السعرات والماكرو
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب إجمالي السعرات والماكرو لوجبة
 * @param {Array} foods - قائمة الأطعمة
 * @returns {Object} - {kcal, protein, carbs, fat}
 */
function calculateMealNutrition(foods) {
  let totals = {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };
  
  for (let food of foods) {
    const weight = food.weight || 100;
    const quantity = food.quantity || 1;
    const totalWeight = weight * quantity;
    
    // حساب بناءً على 100 جرام
    totals.kcal += (food.kcal || 0) * (totalWeight / 100);
    totals.protein += (food.p || 0) * (totalWeight / 100);
    totals.carbs += (food.c || 0) * (totalWeight / 100);
    totals.fat += (food.f || 0) * (totalWeight / 100);
    totals.fiber += (food.fiber || 0) * (totalWeight / 100);
  }
  
  return {
    kcal: Math.round(totals.kcal),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    fiber: Math.round(totals.fiber * 10) / 10
  };
}

/**
 * حساب إجمالي اليوم
 * @param {Object} dayRecord - سجل اليوم
 * @returns {Object} - مجموع السعرات والماكرو
 */
function getTodayTotals(dayRecord) {
  let totals = {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    mealsCount: 0
  };
  
  for (let meal in dayRecord.meals) {
    const foods = dayRecord.meals[meal];
    const mealTotals = calculateMealNutrition(foods);
    
    totals.kcal += mealTotals.kcal;
    totals.protein += mealTotals.protein;
    totals.carbs += mealTotals.carbs;
    totals.fat += mealTotals.fat;
    totals.fiber += mealTotals.fiber;
    totals.mealsCount += foods.length;
  }
  
  return totals;
}

// ═══════════════════════════════════════════════════════════════════════════
// تتبع الماء
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إضافة كمية ماء
 * @param {Object} dayRecord - سجل اليوم
 * @param {number} amount - الكمية بالمليمتر (افتراضي: 250)
 */
function addWater(dayRecord, amount = 250) {
  dayRecord.water += amount;
}

/**
 * الحصول على نسبة تناول الماء
 * @param {Object} dayRecord - سجل اليوم
 * @returns {number} - النسبة المئوية
 */
function getWaterPercentage(dayRecord) {
  return Math.round((dayRecord.water / dayRecord.waterGoal) * 100);
}

/**
 * التحقق من هل تم تحقيق هدف الماء
 * @param {Object} dayRecord - سجل اليوم
 * @returns {boolean}
 */
function isWaterGoalMet(dayRecord) {
  return dayRecord.water >= dayRecord.waterGoal;
}

// ═══════════════════════════════════════════════════════════════════════════
// عرض البيانات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض ملخص اليوم
 * @param {Object} dayRecord - سجل اليوم
 * @param {Object} profile - الملف الشخصي
 */
function renderTrackerSummary(dayRecord, profile) {
  const totals = getTodayTotals(dayRecord);
  const remaining = profile.targetKcal - totals.kcal;
  
  // عرض السعرات
  setText('trackerTotalKcal', totals.kcal + ' سعر');
  setText('trackerTargetKcal', profile.targetKcal + ' سعر');
  setText('trackerRemainingKcal', remaining + ' سعر');
  
  // عرض الماكرو
  setText('trackerProtein', totals.protein.toFixed(1) + 'غ بروتين');
  setText('trackerCarbs', totals.carbs.toFixed(1) + 'غ كربوهيدرات');
  setText('trackerFat', totals.fat.toFixed(1) + 'غ دهون');
  setText('trackerFiber', totals.fiber.toFixed(1) + 'غ ألياف');
  
  // عرض شريط السعرات
  const percentage = Math.round((totals.kcal / profile.targetKcal) * 100);
  const progressBar = document.getElementById('trackerProgressBar');
  if (progressBar) {
    progressBar.style.width = Math.min(percentage, 100) + '%';
  }
  
  // عرض الماء
  const waterPercent = getWaterPercentage(dayRecord);
  setText('trackerWater', dayRecord.water + 'مل');
  setText('trackerWaterGoal', dayRecord.waterGoal + 'مل');
  
  const waterBar = document.getElementById('trackerWaterBar');
  if (waterBar) {
    waterBar.style.width = Math.min(waterPercent, 100) + '%';
  }
}

/**
 * عرض الوجبات
 * @param {Object} dayRecord - سجل اليوم
 */
function renderMealSlots(dayRecord) {
  const mealNames = {
    breakfast: 'الإفطار',
    lunch: 'الغداء',
    dinner: 'العشاء',
    snacks: 'السناكس'
  };
  
  let html = '';
  
  for (let mealType in dayRecord.meals) {
    const foods = dayRecord.meals[mealType];
    const nutrition = calculateMealNutrition(foods);
    
    html += `
      <div class="meal-slot">
        <h4>${mealNames[mealType]}</h4>
        <div class="meal-info">
          <span>${nutrition.kcal} سعر</span>
          <span>P: ${nutrition.protein}غ</span>
          <span>C: ${nutrition.carbs}غ</span>
          <span>F: ${nutrition.fat}غ</span>
        </div>
        <div class="meal-items">
    `;
    
    if (foods.length === 0) {
      html += '<p>لا توجد أطعمة</p>';
    } else {
      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        html += `
          <div class="food-item">
            <span>${food.name}</span>
            <span>${food.quantity || 1} × ${food.weight}غ</span>
            <button onclick="removeFoodFromMeal(S.tracker['${dayRecord.date}'], '${mealType}', ${i}); updateTracker();">حذف</button>
          </div>
        `;
      }
    }
    
    html += `
        </div>
        <button onclick="openAddFoodModal('${mealType}');">+ إضافة طعام</button>
      </div>
    `;
  }
  
  document.getElementById('mealSlotsContainer').innerHTML = html;
}

/**
 * عرض الإحصائيات
 * @param {Object} dayRecord - سجل اليوم
 */
function renderTrackerStats(dayRecord) {
  const totals = getTodayTotals(dayRecord);
  const waterPercent = getWaterPercentage(dayRecord);
  
  let stats = `
    <div class="tracker-stats">
      <div class="stat">
        <h4>الأطعمة</h4>
        <p>${totals.mealsCount} طعام</p>
      </div>
      <div class="stat">
        <h4>السعرات</h4>
        <p>${totals.kcal} سعر</p>
      </div>
      <div class="stat">
        <h4>البروتين</h4>
        <p>${totals.protein}غ</p>
      </div>
      <div class="stat">
        <h4>الماء</h4>
        <p>${waterPercent}%</p>
      </div>
    </div>
  `;
  
  document.getElementById('trackerStatsContainer').innerHTML = stats;
}

// ═══════════════════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نسخ وجبات أمس إلى اليوم
 * @param {Object} tracker - بيانات التتبع
 */
function copyYesterdayMeals(tracker) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const yesterdayDate = yesterday.toISOString().split('T')[0];
  const todayDate = today.toISOString().split('T')[0];
  
  const yesterdayRecord = tracker[yesterdayDate];
  if (!yesterdayRecord) {
    toast('لا توجد بيانات أمس', 'warning');
    return;
  }
  
  const todayRecord = getDayRecord(tracker, todayDate);
  
  // نسخ الوجبات
  for (let meal in yesterdayRecord.meals) {
    todayRecord.meals[meal] = JSON.parse(JSON.stringify(yesterdayRecord.meals[meal]));
  }
  
  toast('تم نسخ وجبات أمس بنجاح', 'success');
}

/**
 * حفظ ملاحظات اليوم
 * @param {Object} dayRecord - سجل اليوم
 * @param {string} notes - الملاحظات
 */
function saveDayNotes(dayRecord, notes) {
  dayRecord.notes = notes;
}

/**
 * تحديث عرض التتبع
 */
function updateTracker() {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);
  
  renderTrackerSummary(dayRecord, S.profile);
  renderMealSlots(dayRecord);
  renderTrackerStats(dayRecord);
  
  // حفظ في البيانات
  debouncedSave(S);
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDayRecord,
    addFoodToMeal,
    removeFoodFromMeal,
    calculateMealNutrition,
    getTodayTotals,
    addWater,
    getWaterPercentage,
    isWaterGoalMet,
    renderTrackerSummary,
    renderMealSlots,
    renderTrackerStats,
    copyYesterdayMeals,
    saveDayNotes,
    updateTracker
  };
}

console.log('✅ تبويب التتبع اليومي جاهز');

// ═══════════════════════════════════════════════════════════════════════════
// دالة موحدة لتحديث تبويب التتبع
// ═══════════════════════════════════════════════════════════════════════════

function updateTracker() {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);
  const totals = getTodayTotals(dayRecord);
  const target = S.profile.targetKcal || 2000;
  const pct = Math.min(Math.round((totals.kcal / target) * 100), 100);

  // تحديث الأرقام
  const tv = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  tv('trackerKcal', Math.round(totals.kcal));
  tv('trackerProtein', Math.round(totals.protein));
  tv('trackerCarbs', Math.round(totals.carbs));
  tv('trackerFat', Math.round(totals.fat));
  tv('trackerWater', dayRecord.water || 0);
  tv('trackerKcalLabel', `الهدف: ${Math.round(target)} سعرة`);

  const bar = document.getElementById('trackerProgressBar');
  if (bar) bar.style.width = pct + '%';

  // عرض الوجبات
  renderMealSlots(dayRecord);
}
