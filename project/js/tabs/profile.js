/**
 * 👤 profile.js - تبويب الملف الشخصي
 * 
 * يدير:
 * - البيانات الشخصية (الوزن، الطول، العمر، الجنس)
 * - الدين ونوع الصيام
 * - حساب BMR و TDEE
 * - الأهداف والعجز
 * - سجل الوزن
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// تهيئة الملف الشخصي
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء ملف شخصي جديد افتراضي
 * @returns {Object} - الملف الشخصي الافتراضي
 */
function createDefaultProfile() {
  return {
    // البيانات الشخصية الأساسية
    name: '',
    age: 30,
    gender: 'male', // male / female
    weight: 75, // بالكيلوجرام
    targetWeight: 70,
    height: 175, // بالسنتيمتر
    
    // البيانات الصحية الإضافية
    bodyFatPercent: null,
    bloodType: null,
    
    // الدين والصيام
    religion: null, // christian / muslim / other
    fastingType: 'partial', // full / partial / fish / vegan
    
    // النشاط والأهداف
    activity: 1.55, // معامل النشاط (1.2-1.9)
    goal: 'loss', // loss / maintain / gain
    deficit: 500, // عجز السعرات
    
    // الحسابات المحفوظة
    bmr: 0,
    tdee: 0,
    targetKcal: 0,
    
    // التفضيلات
    unit: 'kg', // kg / lbs
    language: 'ar',
    theme: 'dark',
    
    // الإحصائيات
    joinDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// تحديث البيانات الشخصية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث البيانات الشخصية وإعادة حساب BMR/TDEE
 * @param {Object} profile - الملف الشخصي
 * @param {Object} updates - التحديثات الجديدة
 * @returns {Object} - الملف الشخصي المحدث
 */
function updateProfile(profile, updates) {
  // دمج التحديثات
  const updated = { ...profile, ...updates };
  
  // إعادة حساب BMR إذا تغيرت البيانات الأساسية
  if (
    updates.weight !== undefined ||
    updates.height !== undefined ||
    updates.age !== undefined ||
    updates.gender !== undefined ||
    updates.bodyFatPercent !== undefined
  ) {
    updated.bmr = calcBMR(updated);
  }
  
  // إعادة حساب TDEE إذا تغير BMR أو معامل النشاط
  if (updated.bmr !== profile.bmr || updates.activity !== undefined) {
    updated.tdee = calcTDEE(updated.bmr, updated.activity);
  }
  
  // إعادة حساب الهدف اليومي إذا تغير TDEE أو الهدف
  if (updated.tdee !== profile.tdee || updates.goal !== undefined || updates.deficit !== undefined) {
    updated.targetKcal = calcDailyGoal(updated, updated.tdee);
  }
  
  updated.lastUpdated = new Date().toISOString();
  
  return updated;
}

// ═══════════════════════════════════════════════════════════════════════════
// عرض البيانات الشخصية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض الملف الشخصي في الواجهة
 * @param {Object} profile - الملف الشخصي
 */
function renderProfile(profile) {
  if (!profile) return;
  
  // عرض البيانات الأساسية
  setText('profileName', profile.name || 'لم تحدد الاسم');
  setVal('profileAge', profile.age);
  setVal('profileGender', profile.gender);
  setVal('profileWeight', profile.weight);
  setVal('profileHeight', profile.height);
  setText('profileTargetWeight', profile.targetWeight + ' كج');
  
  // عرض البيانات الصحية
  if (profile.bodyFatPercent) {
    setText('profileBodyFat', profile.bodyFatPercent + '%');
  }
  
  // عرض الدين والصيام
  if (profile.religion) {
    const religions = {
      'muslim': 'مسلم',
      'christian': 'مسيحي',
      'other': 'آخر'
    };
    setText('profileReligion', religions[profile.religion] || profile.religion);
  }
  
  // عرض النشاط والهدف
  setVal('profileActivity', profile.activity);
  const goals = {
    'loss': 'خسارة الوزن',
    'maintain': 'الحفاظ على الوزن',
    'gain': 'زيادة الوزن'
  };
  setText('profileGoal', goals[profile.goal] || profile.goal);
  setVal('profileDeficit', profile.deficit);
  
  // عرض الحسابات
  renderCalculations(profile);
}

/**
 * عرض حسابات BMR/TDEE/Target
 * @param {Object} profile - الملف الشخصي
 */
function renderCalculations(profile) {
  // عرض BMI
  const bmi = calcBMI(profile.weight, profile.height);
  const bmiCategory = getBMICategory(bmi);
  setText('profileBMI', `${bmi} (${bmiCategory})`);
  
  // عرض BMR
  setText('profileBMR', Math.round(profile.bmr) + ' سعر/يوم');
  
  // عرض TDEE
  setText('profileTDEE', Math.round(profile.tdee) + ' سعر/يوم');
  
  // عرض الهدف اليومي
  const goalLabel = {
    'loss': 'الهدف (خسارة)',
    'maintain': 'الهدف (حفاظ)',
    'gain': 'الهدف (زيادة)'
  }[profile.goal] || 'الهدف';
  
  setText('profileTargetKcal', `${Math.round(profile.targetKcal)} سعر/يوم`);
  setText('profileTargetKcalLabel', goalLabel);
  
  // عرض تفصيل السعرات
  const deficit = Math.round(profile.tdee - profile.targetKcal);
  if (deficit > 0) {
    setText('profileDeficitInfo', `عجز: ${deficit} سعر/يوم`);
  } else if (deficit < 0) {
    setText('profileDeficitInfo', `فائض: ${Math.abs(deficit)} سعر/يوم`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// سجل الوزن
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إضافة وزن جديد للسجل
 * @param {Object} profile - الملف الشخصي
 * @param {number} weight - الوزن بالكيلوجرام
 * @param {Date} date - التاريخ (افتراضي: اليوم)
 * @returns {Object} - الملف الشخصي المحدث
 */
function addWeightLog(profile, weight, date = new Date()) {
  if (!profile.weightLog) {
    profile.weightLog = [];
  }
  
  profile.weightLog.push({
    weight: weight,
    date: date.toISOString(),
    change: profile.weightLog.length > 0 
      ? weight - profile.weightLog[profile.weightLog.length - 1].weight 
      : 0
  });
  
  // تحديث الوزن الحالي
  profile.weight = weight;
  
  return profile;
}

/**
 * عرض سجل الوزن في الجدول
 * @param {Object} profile - الملف الشخصي
 */
function renderWeightLog(profile) {
  if (!profile.weightLog || profile.weightLog.length === 0) {
    setText('weightLogContainer', 'لا توجد سجلات وزن بعد');
    return;
  }
  
  const sorted = [...profile.weightLog].reverse();
  let html = '<table class="weight-log-table"><tr><th>التاريخ</th><th>الوزن</th><th>التغيير</th></tr>';
  
  for (let entry of sorted) {
    const date = new Date(entry.date);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const changeStr = entry.change > 0 
      ? `+${entry.change.toFixed(1)} كج ↑` 
      : entry.change < 0 
        ? `${entry.change.toFixed(1)} كج ↓` 
        : '---';
    
    html += `
      <tr>
        <td>${dateStr}</td>
        <td>${entry.weight.toFixed(1)} كج</td>
        <td class="${entry.change > 0 ? 'increase' : entry.change < 0 ? 'decrease' : ''}">${changeStr}</td>
      </tr>
    `;
  }
  
  html += '</table>';
  document.getElementById('weightLogContainer').innerHTML = html;
}

/**
 * حساب تقدم الوزن
 * @param {Object} profile - الملف الشخصي
 * @returns {Object} - {current, target, progress%, daysEstimate}
 */
function getWeightProgress(profile) {
  if (!profile.weight || !profile.targetWeight) {
    return null;
  }
  
  const current = profile.weight;
  const target = profile.targetWeight;
  const totalChange = Math.abs(target - current);
  const remaining = Math.abs(profile.weight - target);
  
  const progress = ((totalChange - remaining) / totalChange) * 100;
  
  // تقدير الأيام المتبقية (بناءً على معدل 0.5 كج/أسبوع)
  const weeklyLoss = 0.5;
  const weeksNeeded = remaining / weeklyLoss;
  const daysEstimate = Math.round(weeksNeeded * 7);
  
  return {
    current: current,
    target: target,
    totalChange: totalChange,
    remaining: remaining,
    progress: Math.round(progress),
    daysEstimate: daysEstimate
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// معلومات مرئية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض شريط تقدم الوزن
 * @param {Object} profile - الملف الشخصي
 */
function renderWeightProgress(profile) {
  const progress = getWeightProgress(profile);
  if (!progress) return;
  
  const progressBar = document.getElementById('weightProgressBar');
  if (progressBar) {
    progressBar.style.width = progress.progress + '%';
  }
  
  setText('weightProgressText', `${progress.progress}% اكتمل`);
  setText('weightProgressDetails', `
    الحالي: ${progress.current.toFixed(1)} كج
    الهدف: ${progress.target.toFixed(1)} كج
    المتبقي: ${progress.remaining.toFixed(1)} كج
    الأيام المقدرة: ${progress.daysEstimate} يوم
  `);
}

/**
 * عرض ملخص الملف الشخصي
 * @param {Object} profile - الملف الشخصي
 */
function renderProfileSummary(profile) {
  let summary = `
    <div class="profile-summary">
      <h3>${profile.name || 'المستخدم'}</h3>
      <p>العمر: ${profile.age} سنة | الجنس: ${profile.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
      <p>الوزن: ${profile.weight} كج | الطول: ${profile.height} سم</p>
      <p>BMI: ${calcBMI(profile.weight, profile.height)} (${getBMICategory(calcBMI(profile.weight, profile.height))})</p>
      <hr>
      <p>BMR: ${Math.round(profile.bmr)} سعر/يوم</p>
      <p>TDEE: ${Math.round(profile.tdee)} سعر/يوم</p>
      <p>الهدف اليومي: ${Math.round(profile.targetKcal)} سعر/يوم</p>
  `;
  
  if (profile.religion) {
    summary += `<p>الدين: ${profile.religion}</p>`;
  }
  
  summary += '</div>';
  
  document.getElementById('profileSummaryContainer').innerHTML = summary;
}

// ═══════════════════════════════════════════════════════════════════════════
// معالجات الأحداث
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حفظ التغييرات على الملف الشخصي
 * @param {Object} profile - الملف الشخصي
 */
function saveProfileChanges(profile) {
  const updates = {
    name: getStr('profileName'),
    age: parseInt(getNum('profileAge')),
    gender: document.getElementById('profileGender')?.value,
    weight: parseFloat(getNum('profileWeight')),
    height: parseInt(getNum('profileHeight')),
    targetWeight: parseFloat(getNum('profileTargetWeight')),
    activity: parseFloat(getNum('profileActivity')),
    goal: document.getElementById('profileGoal')?.value,
    deficit: parseInt(getNum('profileDeficit'))
  };
  
  const updated = updateProfile(profile, updates);
  
  // حفظ في البيانات
  S.profile = updated;
  debouncedSave(S);
  
  // إعادة عرض
  renderProfile(updated);
  
  toast('تم حفظ التغييرات بنجاح', 'success');
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createDefaultProfile,
    updateProfile,
    renderProfile,
    renderCalculations,
    addWeightLog,
    renderWeightLog,
    getWeightProgress,
    renderWeightProgress,
    renderProfileSummary,
    saveProfileChanges
  };
}

console.log('✅ تبويب الملف الشخصي جاهز');

// ═══════════════════════════════════════════════════════════════════════════
// دالة موحدة لعرض تبويب الملف الشخصي كامل
// ═══════════════════════════════════════════════════════════════════════════

function renderProfileTab() {
  const p = S.profile;
  if (!p) return;

  // ملء الفورم بالبيانات الموجودة
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('profileName', p.name);
  set('profileAge', p.age || 30);
  set('profileGender', p.gender || 'male');
  set('profileWeight', p.weight || '');
  set('profileHeight', p.height || '');
  set('profileTargetWeight', p.targetWeight || '');
  set('profileActivity', p.activity || 1.55);
  set('profileGoal', p.goal || 'loss');
  set('profileReligion', p.religion || '');
  set('profileDietProfile', p.dietProfile || '');

  // حساب وعرض الأرقام
  if (p.weight && p.height && p.age) {
    const bmi = calcBMI ? calcBMI(p.weight, p.height) : (p.weight / ((p.height/100)**2)).toFixed(1);
    const bmr = p.bmr || (typeof calcBMR === 'function' ? calcBMR(p) : 0);
    const tdee = p.tdee || (bmr * (p.activity || 1.55));
    const target = p.targetKcal || tdee;

    const tv = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    tv('profileBMIVal', bmi);
    tv('profileBMRVal', Math.round(bmr));
    tv('profileTDEEVal', Math.round(tdee));
    tv('profileTargetVal', Math.round(target));
  }

  // شريط تقدم الوزن
  const progress = getWeightProgress(p);
  if (progress) {
    const bar = document.getElementById('weightProgressBar');
    if (bar) bar.style.width = Math.min(progress.progress, 100) + '%';
    const txt = document.getElementById('weightProgressText');
    if (txt) txt.textContent = `${progress.progress}% مكتمل — متبقي ${progress.remaining.toFixed(1)} كجم (${progress.daysEstimate} يوم تقريباً)`;
  }

  // سجل الوزن
  renderWeightLog(p);
}
