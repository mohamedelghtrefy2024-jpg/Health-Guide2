/**
 * 🏋️ exercises.js - تبويب التمارين والحرق
 * 
 * يدير:
 * - تسجيل التمارين
 * - حساب السعرات المحروقة
 * - سجل التمارين
 * - الإحصائيات
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// إضافة تمرين
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إضافة تمرين جديد
 * @param {Object} dayRecord - سجل اليوم
 * @param {Object} exercise - بيانات التمرين
 */
function addExercise(dayRecord, exercise) {
  if (!dayRecord.exercises) {
    dayRecord.exercises = [];
  }

  if (!exercise.name || !exercise.duration) {
    toast('الرجاء إدخال اسم التمرين والمدة', 'error');
    return;
  }

  const burn = calcExercise(exercise.name, S.profile.weight, exercise.duration);

  dayRecord.exercises.push({
    name: exercise.name,
    duration: exercise.duration,
    met: exercise.met || 5,
    burn: burn,
    time: new Date().toISOString(),
    notes: exercise.notes || ''
  });

  toast(`تم إضافة ${exercise.name} - حرق ${burn} سعر`, 'success');
}

/**
 * إزالة تمرين
 * @param {Object} dayRecord - سجل اليوم
 * @param {number} index - موقع التمرين
 */
function removeExercise(dayRecord, index) {
  if (dayRecord.exercises && dayRecord.exercises[index]) {
    const exercise = dayRecord.exercises[index];
    dayRecord.exercises.splice(index, 1);
    toast(`تم إزالة ${exercise.name}`, 'info');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات الحرق
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب إجمالي الحرق اليومي
 * @param {Object} dayRecord - سجل اليوم
 * @returns {number} - السعرات المحروقة
 */
function getTotalBurn(dayRecord) {
  if (!dayRecord.exercises) return 0;

  let total = 0;
  for (let exercise of dayRecord.exercises) {
    total += exercise.burn || 0;
  }
  return total;
}

/**
 * حساب متوسط الحرق أسبوعياً
 * @param {Object} tracker - بيانات التتبع
 * @returns {number} - المتوسط
 */
function getWeeklyAverageBurn(tracker) {
  let totalBurn = 0;
  let daysCount = 0;

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().split('T')[0];

    const dayRecord = tracker[dateStr];
    if (dayRecord) {
      totalBurn += getTotalBurn(dayRecord);
      daysCount++;
    }
  }

  return daysCount > 0 ? Math.round(totalBurn / daysCount) : 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// عرض البيانات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض قائمة التمارين اليومية
 * @param {Object} dayRecord - سجل اليوم
 */
function renderExerciseLog(dayRecord) {
  if (!dayRecord.exercises || dayRecord.exercises.length === 0) {
    setText('exerciseLogContainer', 'لا توجد تمارين اليوم');
    return;
  }

  let html = '<div class="exercise-log"><table><tr><th>التمرين</th><th>المدة</th><th>الحرق</th><th></th></tr>';

  for (let i = 0; i < dayRecord.exercises.length; i++) {
    const ex = dayRecord.exercises[i];
    html += `
      <tr>
        <td>${ex.name}</td>
        <td>${ex.duration} دقيقة</td>
        <td>${ex.burn} سعر</td>
        <td><button onclick="removeExercise(S.tracker['${dayRecord.date}'], ${i}); updateExercises();">حذف</button></td>
      </tr>
    `;
  }

  const totalBurn = getTotalBurn(dayRecord);
  html += `<tr class="total"><td colspan="2"><strong>الإجمالي</strong></td><td><strong>${totalBurn} سعر</strong></td></tr>`;
  html += '</table></div>';

  document.getElementById('exerciseLogContainer').innerHTML = html;
}

/**
 * عرض ملخص التمارين
 * @param {Object} dayRecord - سجل اليوم
 */
function renderExerciseSummary(dayRecord) {
  const totalBurn = getTotalBurn(dayRecord);
  const weeklyAvg = getWeeklyAverageBurn(S.tracker);
  const exercisesCount = dayRecord.exercises ? dayRecord.exercises.length : 0;

  let html = `
    <div class="exercise-summary">
      <div class="stat">
        <h4>التمارين اليوم</h4>
        <p>${exercisesCount}</p>
      </div>
      <div class="stat">
        <h4>الحرق اليوم</h4>
        <p>${totalBurn} سعر</p>
      </div>
      <div class="stat">
        <h4>متوسط أسبوعي</h4>
        <p>${weeklyAvg} سعر/يوم</p>
      </div>
    </div>
  `;

  document.getElementById('exerciseSummaryContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// قائمة التمارين المشهورة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض قائمة التمارين المقترحة
 */
function renderSuggestedExercises() {
  const exercises = [
    { name: 'مشي', duration: 30, met: 3.5 },
    { name: 'جري', duration: 20, met: 9.8 },
    { name: 'سباحة', duration: 30, met: 8.0 },
    { name: 'ركوب دراجة', duration: 30, met: 7.5 },
    { name: 'تمارين منزلية', duration: 20, met: 6.0 },
    { name: 'اليوجا', duration: 60, met: 2.5 },
    { name: 'كرة قدم', duration: 60, met: 8.0 },
    { name: 'رقص', duration: 30, met: 5.5 }
  ];

  let html = '<div class="suggested-exercises">';

  for (let ex of exercises) {
    const burn = calcExercise(ex.name, S.profile.weight, ex.duration);
    html += `
      <div class="exercise-card">
        <h4>${ex.name}</h4>
        <p>${ex.duration} د</p>
        <p class="burn">${burn} سعر</p>
        <button onclick="quickAddExercise('${ex.name}', ${ex.duration});">إضافة</button>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('suggestedExercisesContainer').innerHTML = html;
}

/**
 * إضافة تمرين سريعة
 * @param {string} name - اسم التمرين
 * @param {number} duration - المدة
 */
function quickAddExercise(name, duration) {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);

  addExercise(dayRecord, {
    name: name,
    duration: duration
  });

  updateExercises();
  debouncedSave(S);
}

// ═══════════════════════════════════════════════════════════════════════════
// تحليلات التمارين
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب أنواع التمارين
 * @param {Object} dayRecord - سجل اليوم
 * @returns {Object} - توزيع التمارين
 */
function getExerciseBreakdown(dayRecord) {
  const breakdown = {};

  if (dayRecord.exercises) {
    for (let ex of dayRecord.exercises) {
      if (!breakdown[ex.name]) {
        breakdown[ex.name] = 0;
      }
      breakdown[ex.name]++;
    }
  }

  return breakdown;
}

/**
 * عرض إحصائيات التمارين الأسبوعية
 */
function renderWeeklyExerciseStats() {
  let totalBurn = 0;
  let totalExercises = 0;
  let days = 0;

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().split('T')[0];

    const dayRecord = S.tracker[dateStr];
    if (dayRecord && dayRecord.exercises) {
      totalBurn += getTotalBurn(dayRecord);
      totalExercises += dayRecord.exercises.length;
      days++;
    }
  }

  let html = `
    <div class="weekly-stats">
      <h4>إحصائيات الأسبوع الماضي</h4>
      <p>التمارين الكلية: ${totalExercises}</p>
      <p>الحرق الكلي: ${totalBurn} سعر</p>
      <p>المتوسط اليومي: ${days > 0 ? Math.round(totalBurn / days) : 0} سعر</p>
    </div>
  `;

  document.getElementById('weeklyStatsContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// تحديث الواجهة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث عرض التمارين
 */
function updateExercises() {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);

  renderExerciseLog(dayRecord);
  renderExerciseSummary(dayRecord);
  renderSuggestedExercises();
  renderWeeklyExerciseStats();
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addExercise,
    removeExercise,
    getTotalBurn,
    getWeeklyAverageBurn,
    renderExerciseLog,
    renderExerciseSummary,
    renderSuggestedExercises,
    quickAddExercise,
    getExerciseBreakdown,
    renderWeeklyExerciseStats,
    updateExercises
  };
}

console.log('✅ تبويب التمارين جاهز');

// ═══════════════════════════════════════════════════════════════════════════
// دالة موحدة للتمارين
// ═══════════════════════════════════════════════════════════════════════════

function updateExercises() {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);
  const burn = getTotalBurn(dayRecord);
  const duration = (dayRecord.exercises||[]).reduce((s,e) => s + (e.duration||0), 0);

  const tv = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  tv('burnToday', Math.round(burn));
  tv('durationToday', duration);

  renderExerciseLog(dayRecord);
  renderSuggestedExercises();
  renderWeeklyExerciseStats();
}
