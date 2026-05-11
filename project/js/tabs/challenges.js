/**
 * 🎯 challenges.js - تبويب التحديات والإنجازات
 * 
 * يدير:
 * - التحديات اليومية والأسبوعية
 * - متابعة الإنجازات
 * - النقاط والمكافآت
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// التحديات المعرفة
// ═══════════════════════════════════════════════════════════════════════════

const CHALLENGES = {
  dailyKcal: {
    id: 'dailyKcal',
    name: 'هدف السعرات اليومي',
    description: 'حافظ على السعرات ضمن الهدف',
    points: 10,
    icon: '🎯',
    type: 'daily',
    frequency: 'every_day'
  },
  waterIntake: {
    id: 'waterIntake',
    name: 'شرب 2 لتر ماء',
    description: 'اشرب 2000 مل ماء يومياً',
    points: 5,
    icon: '💧',
    type: 'daily',
    frequency: 'every_day'
  },
  noCheatDay: {
    id: 'noCheatDay',
    name: 'أسبوع بدون غش',
    description: 'اجتنب أيام الغش لأسبوع كامل',
    points: 50,
    icon: '🏆',
    type: 'weekly',
    frequency: 'weekly'
  },
  exercise: {
    id: 'exercise',
    name: 'تمرين يومي',
    description: 'مارس تمريناً واحداً على الأقل',
    points: 15,
    icon: '🏋️',
    type: 'daily',
    frequency: 'every_day'
  },
  weightMilestone: {
    id: 'weightMilestone',
    name: 'إنجاز الوزن',
    description: 'اصل إلى وزنك المستهدف',
    points: 100,
    icon: '⚖️',
    type: 'milestone',
    frequency: 'once'
  },
  recordNSV: {
    id: 'recordNSV',
    name: 'انتصار غير متعلق بالميزان',
    description: 'سجل إنجازاً بدون الاعتماد على الوزن',
    points: 20,
    icon: '⭐',
    type: 'daily',
    frequency: 'every_day'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// فحص التحديات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فحص ما إذا تم إكمال تحدي
 * @param {Object} dayRecord - سجل اليوم
 * @param {Object} profile - الملف الشخصي
 * @param {string} challengeId - معرف التحدي
 * @returns {boolean}
 */
function checkChallengeCompletion(dayRecord, profile, challengeId) {
  const totals = getTodayTotals(dayRecord);
  const totalBurn = getTotalBurn(dayRecord);
  const waterPercent = getWaterPercentage(dayRecord);

  switch (challengeId) {
    case 'dailyKcal':
      const tolerance = profile.targetKcal * 0.1; // ±10%
      return totals.kcal >= profile.targetKcal - tolerance &&
             totals.kcal <= profile.targetKcal + tolerance;

    case 'waterIntake':
      return waterPercent >= 100;

    case 'exercise':
      return dayRecord.exercises && dayRecord.exercises.length > 0;

    case 'recordNSV':
      return dayRecord.nonScaleVictories && dayRecord.nonScaleVictories.length > 0;

    default:
      return false;
  }
}

/**
 * تحديث حالة التحديات اليومية
 */
function updateDailyChallenges() {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);

  if (!S.challenges) {
    S.challenges = {};
  }

  for (let challengeId in CHALLENGES) {
    const challenge = CHALLENGES[challengeId];
    
    if (challenge.frequency === 'every_day' || challenge.frequency === 'weekly') {
      const completed = checkChallengeCompletion(dayRecord, S.profile, challengeId);
      
      if (!S.challenges[today]) {
        S.challenges[today] = {};
      }
      
      S.challenges[today][challengeId] = {
        completed: completed,
        completedAt: completed ? new Date().toISOString() : null,
        points: completed ? challenge.points : 0
      };
    }
  }

  debouncedSave(S);
}

// ═══════════════════════════════════════════════════════════════════════════
// انتصارات غير متعلقة بالميزان (NSV)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تسجيل انتصار جديد
 * @param {string} description - وصف الانتصار
 */
function recordNSV(description) {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);

  if (!dayRecord.nonScaleVictories) {
    dayRecord.nonScaleVictories = [];
  }

  dayRecord.nonScaleVictories.push({
    description: description,
    date: new Date().toISOString(),
    icon: guessEmoji(description)
  });

  debouncedSave(S);
  toast('✨ تم تسجيل إنجازك!', 'success');
}

/**
 * عرض قائمة الانتصارات
 * @param {Object} dayRecord - سجل اليوم
 */
function renderNSVList(dayRecord) {
  if (!dayRecord.nonScaleVictories || dayRecord.nonScaleVictories.length === 0) {
    setText('nsvListContainer', 'لم تسجل انتصارات بعد');
    return;
  }

  let html = '<div class="nsv-list">';

  for (let nsv of dayRecord.nonScaleVictories) {
    html += `
      <div class="nsv-item">
        <span class="nsv-icon">${nsv.icon}</span>
        <span class="nsv-desc">${nsv.description}</span>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('nsvListContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// أيام الغش
// ═══════════════════════════════════════════════════════════════════════════

/**
 * جدولة يوم غش
 * @param {Date} date - التاريخ
 */
function scheduleCheatDay(date) {
  if (!S.cheatDays) {
    S.cheatDays = [];
  }

  const dateStr = date.toISOString().split('T')[0];
  
  if (!S.cheatDays.includes(dateStr)) {
    S.cheatDays.push(dateStr);
    debouncedSave(S);
    toast('تم جدولة يوم الغش', 'info');
  }
}

/**
 * التحقق من هل هو يوم غش
 * @param {Date} date - التاريخ
 * @returns {boolean}
 */
function isCheatDay(date) {
  const dateStr = date.toISOString().split('T')[0];
  return S.cheatDays && S.cheatDays.includes(dateStr);
}

// ═══════════════════════════════════════════════════════════════════════════
// النقاط والمكافآت
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب النقاط اليومية
 * @param {string} date - التاريخ
 * @returns {number} - النقاط
 */
function getDayPoints(date) {
  if (!S.challenges || !S.challenges[date]) {
    return 0;
  }

  let points = 0;
  for (let challengeId in S.challenges[date]) {
    const challenge = S.challenges[date][challengeId];
    if (challenge.completed) {
      points += challenge.points;
    }
  }

  return points;
}

/**
 * حساب النقاط الأسبوعية
 * @returns {number} - النقاط
 */
function getWeeklyPoints() {
  let total = 0;
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().split('T')[0];

    total += getDayPoints(dateStr);
  }

  return total;
}

/**
 * عرض النقاط والمكافآت
 */
function renderPoints() {
  const today = new Date().toISOString().split('T')[0];
  const todayPoints = getDayPoints(today);
  const weeklyPoints = getWeeklyPoints();

  let html = `
    <div class="points-display">
      <div class="points-card">
        <h4>نقاط اليوم</h4>
        <p class="points-value">${todayPoints}</p>
      </div>
      <div class="points-card">
        <h4>نقاط الأسبوع</h4>
        <p class="points-value">${weeklyPoints}</p>
      </div>
    </div>
  `;

  document.getElementById('pointsContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// عرض التحديات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض التحديات اليومية
 */
function renderDailyChallenges() {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);
  const dayCompletion = S.challenges && S.challenges[today] ? S.challenges[today] : {};

  let html = '<div class="challenges-grid">';

  for (let challengeId in CHALLENGES) {
    const challenge = CHALLENGES[challengeId];
    
    if (challenge.frequency === 'every_day') {
      const isCompleted = dayCompletion[challengeId]?.completed || false;

      html += `
        <div class="challenge-card ${isCompleted ? 'completed' : ''}">
          <div class="challenge-icon">${challenge.icon}</div>
          <h4>${challenge.name}</h4>
          <p>${challenge.description}</p>
          <p class="points">+${challenge.points} نقطة</p>
          <div class="status ${isCompleted ? 'done' : 'pending'}">
            ${isCompleted ? '✅ مكتمل' : '⏳ قيد العمل'}
          </div>
        </div>
      `;
    }
  }

  html += '</div>';
  document.getElementById('challengesContainer').innerHTML = html;
}

/**
 * تحديث عرض التحديات
 */
function updateChallenges() {
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);

  updateDailyChallenges();
  renderDailyChallenges();
  renderNSVList(dayRecord);
  renderPoints();
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CHALLENGES,
    checkChallengeCompletion,
    updateDailyChallenges,
    recordNSV,
    renderNSVList,
    scheduleCheatDay,
    isCheatDay,
    getDayPoints,
    getWeeklyPoints,
    renderPoints,
    renderDailyChallenges,
    updateChallenges
  };
}

console.log('✅ تبويب التحديات جاهز');

// ═══════════════════════════════════════════════════════════════════════════
// دالة موحدة للتحديات
// ═══════════════════════════════════════════════════════════════════════════

function updateChallenges() {
  renderPoints();
  renderDailyChallenges();
  const today = new Date().toISOString().split('T')[0];
  renderNSVList(getDayRecord(S.tracker, today));
  const tv = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  tv('weeklyPoints', getWeeklyPoints() || 0);
  tv('totalPoints', S.totalPoints || 0);
}
