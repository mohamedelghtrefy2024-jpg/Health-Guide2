/**
 * 📈 insights.js - تبويب التحليلات والتقارير
 * 
 * يدير:
 * - تقارير أسبوعية وشهرية
 * - الرسوم البيانية والإحصائيات
 * - تحليل الأنماط
 * - التنبؤات
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// تقارير أسبوعية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب إحصائيات الأسبوع الماضي
 * @returns {Object} - الإحصائيات
 */
function getWeeklyStats() {
  const stats = {
    totalKcal: 0,
    totalBurn: 0,
    totalExercises: 0,
    daysLogged: 0,
    avgKcal: 0,
    avgBurn: 0,
    weightChange: 0,
    days: []
  };

  const today = new Date();
  const weights = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().split('T')[0];

    const dayRecord = S.tracker[dateStr];
    if (dayRecord) {
      const totals = getTodayTotals(dayRecord);
      const burn = getTotalBurn(dayRecord);
      const exercises = (dayRecord.exercises || []).length;

      stats.totalKcal += totals.kcal;
      stats.totalBurn += burn;
      stats.totalExercises += exercises;
      stats.daysLogged++;

      stats.days.push({
        date: dateStr,
        kcal: totals.kcal,
        burn: burn,
        exercises: exercises
      });

      if (dayRecord.weight) {
        weights.push(dayRecord.weight);
      }
    }
  }

  if (stats.daysLogged > 0) {
    stats.avgKcal = Math.round(stats.totalKcal / stats.daysLogged);
    stats.avgBurn = Math.round(stats.totalBurn / stats.daysLogged);
  }

  if (weights.length >= 2) {
    stats.weightChange = weights[0] - weights[weights.length - 1];
  }

  return stats;
}

/**
 * عرض تقرير الأسبوع
 */
function renderWeeklyReport() {
  const stats = getWeeklyStats();

  let html = `
    <div class="report-card">
      <h3>تقرير الأسبوع الماضي</h3>
      <div class="report-grid">
        <div class="stat-box">
          <h4>إجمالي السعرات</h4>
          <p class="value">${stats.totalKcal}</p>
          <p class="avg">متوسط: ${stats.avgKcal}/يوم</p>
        </div>
        <div class="stat-box">
          <h4>الحرق الكلي</h4>
          <p class="value">${stats.totalBurn}</p>
          <p class="avg">متوسط: ${stats.avgBurn}/يوم</p>
        </div>
        <div class="stat-box">
          <h4>التمارين</h4>
          <p class="value">${stats.totalExercises}</p>
          <p class="avg">أيام: ${stats.daysLogged}</p>
        </div>
        <div class="stat-box">
          <h4>تغيير الوزن</h4>
          <p class="value ${stats.weightChange > 0 ? 'negative' : 'positive'}">
            ${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)} كج
          </p>
          <p class="avg">النسبة الأسبوعية</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('weeklyReportContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// تقارير شهرية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب إحصائيات الشهر الحالي
 * @returns {Object} - الإحصائيات
 */
function getMonthlyStats() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const stats = {
    totalKcal: 0,
    totalBurn: 0,
    daysLogged: 0,
    avgKcal: 0,
    weightStart: 0,
    weightEnd: 0,
    weightChange: 0,
    maxKcal: 0,
    minKcal: 999999
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];

    const dayRecord = S.tracker[dateStr];
    if (dayRecord) {
      const totals = getTodayTotals(dayRecord);
      const burn = getTotalBurn(dayRecord);

      stats.totalKcal += totals.kcal;
      stats.totalBurn += burn;
      stats.daysLogged++;

      if (totals.kcal > stats.maxKcal) stats.maxKcal = totals.kcal;
      if (totals.kcal < stats.minKcal) stats.minKcal = totals.kcal;
    }
  }

  if (stats.daysLogged > 0) {
    stats.avgKcal = Math.round(stats.totalKcal / stats.daysLogged);
  }

  if (S.weightLog && S.weightLog.length > 0) {
    const monthWeights = S.weightLog.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });

    if (monthWeights.length > 0) {
      stats.weightStart = monthWeights[monthWeights.length - 1].weight;
      stats.weightEnd = monthWeights[0].weight;
      stats.weightChange = stats.weightStart - stats.weightEnd;
    }
  }

  return stats;
}

/**
 * عرض تقرير الشهر
 */
function renderMonthlyReport() {
  const stats = getMonthlyStats();
  const monthName = new Date().toLocaleDateString('ar', { month: 'long' });

  let html = `
    <div class="report-card">
      <h3>تقرير شهر ${monthName}</h3>
      <div class="report-grid">
        <div class="stat-box">
          <h4>إجمالي السعرات</h4>
          <p class="value">${stats.totalKcal}</p>
          <p class="avg">متوسط: ${stats.avgKcal}/يوم</p>
        </div>
        <div class="stat-box">
          <h4>نطاق السعرات</h4>
          <p class="value">${stats.minKcal} - ${stats.maxKcal}</p>
          <p class="avg">أيام مسجلة: ${stats.daysLogged}</p>
        </div>
        <div class="stat-box">
          <h4>تغيير الوزن</h4>
          <p class="value ${stats.weightChange > 0 ? 'negative' : 'positive'}">
            ${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)} كج
          </p>
          <p class="avg">من ${stats.weightStart.toFixed(1)} إلى ${stats.weightEnd.toFixed(1)}</p>
        </div>
        <div class="stat-box">
          <h4>الحرق الكلي</h4>
          <p class="value">${stats.totalBurn}</p>
          <p class="avg">متوسط: ${Math.round(stats.totalBurn / stats.daysLogged)}/يوم</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('monthlyReportContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// الرسوم البيانية والمخططات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * رسم مخطط السعرات الأسبوعي
 */
function drawWeeklyKcalChart() {
  const stats = getWeeklyStats();
  
  let html = '<div class="chart"><svg viewBox="0 0 700 300">';
  
  const maxKcal = Math.max(...stats.days.map(d => d.kcal)) || 1000;
  const barWidth = 80;
  const barSpacing = 10;

  stats.days.forEach((day, index) => {
    const x = barSpacing + (index * (barWidth + barSpacing));
    const height = (day.kcal / maxKcal) * 200;
    const y = 250 - height;

    html += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" 
            fill="var(--g1)" opacity="0.8" />
      <text x="${x + barWidth/2}" y="280" text-anchor="middle" font-size="12">
        ${index}
      </text>
      <text x="${x + barWidth/2}" y="${y - 10}" text-anchor="middle" 
            font-size="10" fill="var(--g1)">
        ${day.kcal}
      </text>
    `;
  });

  html += '</svg></div>';
  document.getElementById('weeklyChartContainer').innerHTML = html;
}

/**
 * رسم مخطط الوزن
 */
function drawWeightChart() {
  if (!S.weightLog || S.weightLog.length < 2) {
    setText('weightChartContainer', 'لا توجد بيانات وزن كافية');
    return;
  }

  const recentWeights = S.weightLog.slice(-30); // آخر 30 يوم
  const sorted = recentWeights.sort((a, b) => new Date(a.date) - new Date(b.date));

  let html = '<div class="chart"><svg viewBox="0 0 700 300">';

  const minWeight = Math.min(...sorted.map(w => w.weight));
  const maxWeight = Math.max(...sorted.map(w => w.weight));
  const range = maxWeight - minWeight || 1;

  sorted.forEach((entry, index) => {
    const x = 50 + (index * 20);
    const y = 250 - ((entry.weight - minWeight) / range) * 200;

    if (index > 0) {
      const prevEntry = sorted[index - 1];
      const prevX = 50 + ((index - 1) * 20);
      const prevY = 250 - ((prevEntry.weight - minWeight) / range) * 200;

      html += `<line x1="${prevX}" y1="${prevY}" x2="${x}" y2="${y}" 
               stroke="var(--g1)" stroke-width="2" />`;
    }

    html += `<circle cx="${x}" cy="${y}" r="3" fill="var(--g1)" />`;
  });

  html += '</svg></div>';
  document.getElementById('weightChartContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// تحليل الأنماط
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحليل أيام الأداء الجيد والضعيف
 * @returns {Object} - النتائج
 */
function analyzePerformance() {
  const stats = getWeeklyStats();
  const target = S.profile.targetKcal;
  const tolerance = target * 0.1;

  let goodDays = 0;
  let lowDays = 0;
  let highDays = 0;

  stats.days.forEach(day => {
    if (day.kcal >= target - tolerance && day.kcal <= target + tolerance) {
      goodDays++;
    } else if (day.kcal < target - tolerance) {
      lowDays++;
    } else {
      highDays++;
    }
  });

  return {
    goodDays,
    lowDays,
    highDays,
    successRate: Math.round((goodDays / stats.daysLogged) * 100)
  };
}

/**
 * عرض تحليل الأداء
 */
function renderPerformanceAnalysis() {
  const analysis = analyzePerformance();

  let html = `
    <div class="analysis-card">
      <h4>تحليل الأداء</h4>
      <p>معدل النجاح: <strong>${analysis.successRate}%</strong></p>
      <ul>
        <li>✅ أيام جيدة: ${analysis.goodDays}</li>
        <li>⬇️ أيام منخفضة: ${analysis.lowDays}</li>
        <li>⬆️ أيام عالية: ${analysis.highDays}</li>
      </ul>
    </div>
  `;

  document.getElementById('performanceAnalysisContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// التنبؤات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التنبؤ بالوزن المستهدف
 * @returns {Object} - معلومات التنبؤ
 */
function predictTargetWeightDate() {
  if (!S.weightLog || S.weightLog.length < 7) {
    return null;
  }

  // حساب معدل فقدان الوزن الأسبوعي
  const recentWeights = S.weightLog.slice(-7);
  const sorted = recentWeights.sort((a, b) => new Date(a.date) - new Date(b.date));

  const currentWeight = S.profile.weight;
  const targetWeight = S.profile.targetWeight;
  const weightToLose = currentWeight - targetWeight;

  if (weightToLose <= 0) {
    return { message: 'لقد وصلت إلى الوزن المستهدف!' };
  }

  const weeklyLoss = sorted[0].weight - sorted[sorted.length - 1].weight;
  const weeksNeeded = Math.ceil(weightToLose / (weeklyLoss / 7));
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + weeksNeeded * 7);

  return {
    currentWeight,
    targetWeight,
    weightToLose,
    weeklyLoss: (weeklyLoss / 7).toFixed(2),
    weeksNeeded,
    estimatedDate: estimatedDate.toLocaleDateString('ar')
  };
}

/**
 * عرض التنبؤ
 */
function renderPrediction() {
  const prediction = predictTargetWeightDate();

  if (!prediction) {
    setText('predictionContainer', 'لا توجد بيانات كافية للتنبؤ');
    return;
  }

  if (prediction.message) {
    setText('predictionContainer', prediction.message);
    return;
  }

  let html = `
    <div class="prediction-card">
      <h4>التنبؤ بالوزن المستهدف</h4>
      <p>الوزن الحالي: <strong>${prediction.currentWeight.toFixed(1)}</strong> كج</p>
      <p>الوزن المستهدف: <strong>${prediction.targetWeight.toFixed(1)}</strong> كج</p>
      <p>المتبقي: <strong>${prediction.weightToLose.toFixed(1)}</strong> كج</p>
      <hr>
      <p>معدل الفقدان: <strong>${prediction.weeklyLoss}</strong> كج/أسبوع</p>
      <p>الوقت المقدر: <strong>${prediction.weeksNeeded}</strong> أسبوع</p>
      <p class="highlight">📅 التاريخ المتوقع: <strong>${prediction.estimatedDate}</strong></p>
    </div>
  `;

  document.getElementById('predictionContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// تحديث الجميع
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث عرض التحليلات
 */
function renderInsights() {
  renderWeeklyReport();
  renderMonthlyReport();
  drawWeeklyKcalChart();
  drawWeightChart();
  renderPerformanceAnalysis();
  renderPrediction();
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWeeklyStats,
    renderWeeklyReport,
    getMonthlyStats,
    renderMonthlyReport,
    drawWeeklyKcalChart,
    drawWeightChart,
    analyzePerformance,
    renderPerformanceAnalysis,
    predictTargetWeightDate,
    renderPrediction,
    renderInsights
  };
}

console.log('✅ تبويب التحليلات جاهز');

// ═══════════════════════════════════════════════════════════════════════════
// دالة موحدة للتحليلات
// ═══════════════════════════════════════════════════════════════════════════

function renderInsights() {
  renderWeeklyReport();
  renderMonthlyReport();
  drawWeeklyKcalChart();
  drawWeightChart();
  renderPerformanceAnalysis();
  renderPrediction();
}
