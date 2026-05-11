/**
 * 📋 planner.js - تبويب خطتي الغذائية
 * 
 * يدير:
 * - توليد خطط ذكية
 * - الخطط الأسبوعية
 * - حفظ واسترجاع الخطط
 * - تعديل الوجبات
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// توليد خطة ذكية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * توليد خطة غذائية تلقائية
 * @param {Object} profile - الملف الشخصي
 * @returns {Object} - الخطة
 */
function generateSmartPlan(profile) {
  if (!profile || !profile.targetKcal) {
    toast('الرجاء إكمال بيانات الملف الشخصي أولاً', 'warning');
    return null;
  }

  const plan = {
    id: Date.now(),
    name: `خطة ${new Date().toLocaleDateString('ar')}`,
    date: new Date().toISOString(),
    targetKcal: profile.targetKcal,
    meals: {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    },
    macros: {
      protein: Math.round(profile.targetKcal * 0.3 / 4), // 30% بروتين
      carbs: Math.round(profile.targetKcal * 0.4 / 4),   // 40% كارب
      fat: Math.round(profile.targetKcal * 0.3 / 9)      // 30% دهون
    }
  };

  // توزيع السعرات على الوجبات
  const breakfastKcal = Math.round(profile.targetKcal * 0.25); // 25%
  const lunchKcal = Math.round(profile.targetKcal * 0.35);     // 35%
  const dinnerKcal = Math.round(profile.targetKcal * 0.30);    // 30%
  const snacksKcal = Math.round(profile.targetKcal * 0.10);    // 10%

  // اختيار أطعمة موصى بها
  plan.meals.breakfast = selectFoodsForMeal(breakfastKcal, ['breakfast', 'morning']);
  plan.meals.lunch = selectFoodsForMeal(lunchKcal, ['lunch', 'main']);
  plan.meals.dinner = selectFoodsForMeal(dinnerKcal, ['dinner', 'evening']);
  plan.meals.snacks = selectFoodsForMeal(snacksKcal, ['snacks', 'light']);

  // حفظ الخطة
  if (!S.savedPlans) {
    S.savedPlans = [];
  }
  S.savedPlans.push(plan);
  debouncedSave(S);

  toast('تم توليد خطة جديدة بنجاح', 'success');
  return plan;
}

/**
 * اختيار أطعمة لوجبة معينة
 * @param {number} targetKcal - السعرات المستهدفة
 * @param {Array} tags - علامات الوجبة
 * @returns {Array} - الأطعمة المختارة
 */
function selectFoodsForMeal(targetKcal, tags) {
  const foods = [];
  let currentKcal = 0;
  const tolerance = targetKcal * 0.1; // تفاوت 10%

  // تصفية الأطعمة حسب الوزن والفئة
  const candidates = ALL_FOODS
    .filter(f => f.kcal > 0 && f.kcal < targetKcal)
    .sort(() => Math.random() - 0.5); // عشوائي للتنوع

  for (let food of candidates) {
    if (currentKcal + food.kcal <= targetKcal + tolerance) {
      foods.push({
        ...food,
        quantity: 1,
        weight: food.weight || 100
      });
      currentKcal += food.kcal;

      if (foods.length >= 3 || currentKcal >= targetKcal - tolerance) {
        break;
      }
    }
  }

  return foods;
}

// ═══════════════════════════════════════════════════════════════════════════
// الخطط الأسبوعية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * توليد خطة أسبوعية
 * @param {Object} profile - الملف الشخصي
 * @returns {Object} - الخطة الأسبوعية
 */
function generateWeeklyPlan(profile) {
  const weeklyPlan = {
    id: Date.now(),
    name: `خطة أسبوعية - الأسبوع ${Math.ceil(new Date().getDate() / 7)}`,
    startDate: new Date().toISOString(),
    days: {}
  };

  const daysOfWeek = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() + i);
    const dayKey = day.toISOString().split('T')[0];

    weeklyPlan.days[dayKey] = {
      dayName: daysOfWeek[day.getDay()],
      date: dayKey,
      plan: generateSmartPlan(profile)
    };
  }

  // حفظ الخطة
  if (!S.savedPlans) {
    S.savedPlans = [];
  }
  S.savedPlans.push(weeklyPlan);
  debouncedSave(S);

  return weeklyPlan;
}

// ═══════════════════════════════════════════════════════════════════════════
// عرض الخطط
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض الخطط المحفوظة
 */
function renderSavedPlans() {
  if (!S.savedPlans || S.savedPlans.length === 0) {
    setText('savedPlansContainer', 'لا توجد خطط محفوظة');
    return;
  }

  let html = '<div class="plans-list">';

  for (let plan of S.savedPlans) {
    const planDate = new Date(plan.date);
    const dateStr = planDate.toLocaleDateString('ar');

    html += `
      <div class="plan-card">
        <h4>${plan.name}</h4>
        <p>التاريخ: ${dateStr}</p>
        <p>الهدف: ${plan.targetKcal} سعر</p>
        <div class="plan-actions">
          <button onclick="loadPlan(${plan.id});">تحميل</button>
          <button onclick="deletePlan(${plan.id});">حذف</button>
        </div>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('savedPlansContainer').innerHTML = html;
}

/**
 * عرض خطة التفاصيل
 * @param {Object} plan - الخطة
 */
function renderPlanDetails(plan) {
  if (!plan) return;

  let html = `
    <div class="plan-details">
      <h3>${plan.name}</h3>
      <p>الهدف اليومي: ${plan.targetKcal} سعر</p>
      <div class="macros-breakdown">
        <h4>توزيع الماكرو:</h4>
        <p>بروتين: ${plan.macros.protein}غ</p>
        <p>كربوهيدرات: ${plan.macros.carbs}غ</p>
        <p>دهون: ${plan.macros.fat}غ</p>
      </div>
  `;

  const mealNames = {
    breakfast: 'الإفطار',
    lunch: 'الغداء',
    dinner: 'العشاء',
    snacks: 'السناكس'
  };

  for (let mealType in plan.meals) {
    const foods = plan.meals[mealType];
    const nutrition = calculateMealNutrition(foods);

    html += `
      <div class="meal-section">
        <h4>${mealNames[mealType]} (${nutrition.kcal} سعر)</h4>
        <ul>
    `;

    for (let food of foods) {
      html += `<li>${food.emoji || guessEmoji(food.name)} ${food.name}</li>`;
    }

    html += `
        </ul>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('planDetailsContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة الخطط
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل خطة
 * @param {number} planId - معرف الخطة
 */
function loadPlan(planId) {
  const plan = S.savedPlans.find(p => p.id === planId);
  if (!plan) {
    toast('لم تُعثر على الخطة', 'error');
    return;
  }

  // تحميل وجبات الخطة إلى اليوم
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);

  dayRecord.meals = JSON.parse(JSON.stringify(plan.meals));

  debouncedSave(S);
  toast('تم تحميل الخطة بنجاح', 'success');
  updateTracker();
}

/**
 * حذف خطة
 * @param {number} planId - معرف الخطة
 */
function deletePlan(planId) {
  const index = S.savedPlans.findIndex(p => p.id === planId);
  if (index > -1) {
    S.savedPlans.splice(index, 1);
    debouncedSave(S);
    renderSavedPlans();
    toast('تم حذف الخطة', 'info');
  }
}

/**
 * تعديل وجبة في الخطة
 * @param {Object} plan - الخطة
 * @param {string} mealType - نوع الوجبة
 * @param {number} foodIndex - موقع الطعام
 * @param {Object} newFood - الطعام الجديد
 */
function editMealFood(plan, mealType, foodIndex, newFood) {
  if (plan.meals[mealType] && plan.meals[mealType][foodIndex]) {
    plan.meals[mealType][foodIndex] = newFood;
    debouncedSave(S);
    toast('تم تحديث الوجبة', 'success');
  }
}

/**
 * إزالة طعام من وجبة الخطة
 * @param {Object} plan - الخطة
 * @param {string} mealType - نوع الوجبة
 * @param {number} foodIndex - موقع الطعام
 */
function removeMealFood(plan, mealType, foodIndex) {
  if (plan.meals[mealType]) {
    plan.meals[mealType].splice(foodIndex, 1);
    debouncedSave(S);
    toast('تم إزالة الطعام', 'info');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// تحليل الخطة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب إجمالي السعرات للخطة
 * @param {Object} plan - الخطة
 * @returns {number} - السعرات الكلية
 */
function getPlanTotalKcal(plan) {
  let total = 0;
  for (let meal in plan.meals) {
    const nutrition = calculateMealNutrition(plan.meals[meal]);
    total += nutrition.kcal;
  }
  return total;
}

/**
 * التحقق من توازن الخطة
 * @param {Object} plan - الخطة
 * @returns {Object} - معلومات التوازن
 */
function getPlanBalance(plan) {
  const totalKcal = getPlanTotalKcal(plan);
  const difference = totalKcal - plan.targetKcal;
  const percentageDiff = (difference / plan.targetKcal) * 100;

  return {
    totalKcal: totalKcal,
    targetKcal: plan.targetKcal,
    difference: difference,
    percentage: percentageDiff,
    isBalanced: Math.abs(percentageDiff) < 5 // تفاوت 5%
  };
}

/**
 * عرض تقييم الخطة
 * @param {Object} plan - الخطة
 */
function renderPlanRating(plan) {
  const balance = getPlanBalance(plan);
  let rating = '❌';

  if (balance.isBalanced) {
    rating = '✅ متوازنة تماماً';
  } else if (Math.abs(balance.percentage) < 10) {
    rating = '⚠️ قريبة من التوازن';
  }

  setText('planRating', `${rating} (${balance.totalKcal}/${balance.targetKcal} سعر)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSmartPlan,
    selectFoodsForMeal,
    generateWeeklyPlan,
    renderSavedPlans,
    renderPlanDetails,
    loadPlan,
    deletePlan,
    editMealFood,
    removeMealFood,
    getPlanTotalKcal,
    getPlanBalance,
    renderPlanRating
  };
}

console.log('✅ تبويب خطتي الغذائية جاهز');

// ═══════════════════════════════════════════════════════════════════════════
// دوال موحدة للخطط
// ═══════════════════════════════════════════════════════════════════════════

function renderSavedPlans() {
  const el = document.getElementById('savedPlansContainer');
  if (!el) return;
  if (!S.savedPlans || S.savedPlans.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <p>📋 لا توجد خطط محفوظة بعد</p>
      <p style="font-size:12px;color:#6b7280">اضغط "توليد خطة ذكية" لإنشاء خطتك الأولى</p>
    </div>`;
    return;
  }
  let html = '';
  [...S.savedPlans].reverse().forEach((plan, i) => {
    const date = new Date(plan.date).toLocaleDateString('ar');
    const meals = Object.values(plan.meals || {}).flat().length;
    html += `<div class="plan-card" onclick="showPlanDetails(${S.savedPlans.length - 1 - i})">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:600;color:#10b981">${plan.name || 'خطة غذائية'}</div>
          <div style="font-size:12px;color:#9ca3af">${date} — ${plan.targetKcal} سعرة — ${meals} صنف</div>
        </div>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deletePlan(${S.savedPlans.length - 1 - i})">🗑</button>
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

function showPlanDetails(idx) {
  const plan = S.savedPlans[idx];
  if (!plan) return;
  const mealNames = { breakfast:'🍳 الإفطار', lunch:'🍽️ الغداء', dinner:'🌙 العشاء', snacks:'🍎 السناكس' };
  let html = `<div class="card"><h3 style="color:#10b981;margin-bottom:14px">${plan.name}</h3>`;
  for (const [mealType, foods] of Object.entries(plan.meals || {})) {
    if (!foods.length) continue;
    html += `<div class="plan-meal"><div class="plan-meal-name">${mealNames[mealType]||mealType}</div>`;
    foods.forEach(f => { html += `<div style="font-size:12px;color:#d1d5db;padding:2px 0">${f.emoji||'🍴'} ${f.name} — ${f.kcal} سعرة</div>`; });
    html += `</div>`;
  }
  html += `<button class="btn btn-sm" style="margin-top:10px" onclick="applyPlanToTracker(${idx})">📊 تطبيق على التتبع</button></div>`;
  document.getElementById('planDetailsContainer').innerHTML = html;
}

function deletePlan(idx) {
  if (!confirm('حذف هذه الخطة؟')) return;
  S.savedPlans.splice(idx, 1);
  debouncedSave(S);
  renderSavedPlans();
  document.getElementById('planDetailsContainer').innerHTML = '';
  toast('تم حذف الخطة', 'info');
}

function applyPlanToTracker(idx) {
  const plan = S.savedPlans[idx];
  if (!plan) return;
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);
  for (const [mealType, foods] of Object.entries(plan.meals || {})) {
    foods.forEach(f => addFoodToMeal(dayRecord, mealType, {...f, quantity:1}));
  }
  debouncedSave(S);
  switchTab('tracker');
  toast('تم تطبيق الخطة على التتبع ✅', 'success');
}

function generateWeeklyPlan(profile) {
  toast('قريباً — الخطة الأسبوعية 📅', 'info');
}
