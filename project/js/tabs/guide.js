/**
 * ❓ guide.js - تبويب الدليل والمساعدة
 * 
 * يدير:
 * - شرح الميزات
 * - إرشادات الاستخدام
 * - الأسئلة الشائعة
 * - نصائح وحيل
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// محتوى الدليل
// ═══════════════════════════════════════════════════════════════════════════

const GUIDE_CONTENT = {
  gettingStarted: {
    title: 'البدء السريع',
    sections: [
      {
        heading: '1. ملء الملف الشخصي',
        content: `
          اذهب إلى تبويب "الملف الشخصي" وأدخل:
          • اسمك وسنك وجنسك
          • طولك ووزنك الحالي
          • وزنك المستهدف
          • مستوى نشاطك
          • هدفك (خسارة/حفاظ/زيادة)
          
          التطبيق سيحسب BMR و TDEE و الهدف اليومي تلقائياً.
        `
      },
      {
        heading: '2. تتبع أطعمتك',
        content: `
          اذهب إلى تبويب "التتبع":
          • اضغط على الوجبة (إفطار/غداء/عشاء/سناكس)
          • ابحث عن الطعام في المكتبة
          • أدخل الكمية والوزن
          • التطبيق يحسب السعرات والماكرو تلقائياً
        `
      },
      {
        heading: '3. المفضلات',
        content: `
          اضغط على القلب ♥️ على أي طعام لإضافته للمفضلات
          ستظهر أطعمتك المفضلة في شريط سريع للوصول السريع
        `
      }
    ]
  },
  features: {
    title: 'شرح الميزات',
    sections: [
      {
        heading: 'تتبع السعرات والماكرو',
        content: `
          ✅ تتبع دقيق للسعرات الحرارية
          ✅ حساب البروتين والكربوهيدرات والدهون
          ✅ حسابات معيارية دولية
          ✅ أطعمة محلية مصرية
        `
      },
      {
        heading: 'خطط غذائية ذكية',
        content: `
          ✅ توليد خطط تلقائية موازنة
          ✅ خطط أسبوعية منظمة
          ✅ حفظ واسترجاع الخطط
          ✅ توازن ماكرو ذكي (P:C:F)
        `
      },
      {
        heading: 'التمارين والحرق',
        content: `
          ✅ حساب حرق السعرات (MET)
          ✅ 15+ تمرين معروف
          ✅ سجل تمارين يومي
          ✅ إحصائيات أسبوعية
        `
      },
      {
        heading: 'نظام الصيام',
        content: `
          ✅ صيام إسلامي (رمضان، أيام البيض، إلخ)
          ✅ صيام مسيحي (الصيام الكبير، إلخ)
          ✅ توصيات طعام حسب الصيام
          ✅ تحويل تاريخ هجري/ميلادي
        `
      },
      {
        heading: 'التحديات والنقاط',
        content: `
          ✅ تحديات يومية
          ✅ نظام النقاط والمكافآت
          ✅ انتصارات غير متعلقة بالميزان
          ✅ متابعة التقدم
        `
      }
    ]
  },
  faq: {
    title: 'الأسئلة الشائعة',
    sections: [
      {
        heading: 'كيف أحسب السعرات الصحيحة؟',
        content: `
          التطبيق يستخدم معادلات معيارية:
          • BMR (معدل الأيض): Mifflin-St Jeor
          • TDEE: BMR × معامل النشاط
          • الهدف: TDEE ± العجز/الفائض
          
          القيم دقيقة وآمنة صحياً.
        `
      },
      {
        heading: 'ما الفرق بين الوزن والإنجازات؟',
        content: `
          NSV = Non-Scale Victories (انتصارات غير متعلقة بالميزان)
          
          مثال:
          • تحسن اللياقة البدنية
          • ملابس أصغر حجماً
          • زيادة الطاقة
          • تحسن الصحة
          
          هذه مهمة جداً وأحياناً أهم من الوزن!
        `
      },
      {
        heading: 'هل يمكنني إضافة طعام مخصص؟',
        content: `
          نعم! في تبويب "المكتبة":
          • اضغط "أطعمة مخصصة"
          • أدخل اسم الطعام
          • أدخل السعرات والماكرو
          • تم! سيظهر في مكتبتك
        `
      },
      {
        heading: 'كيف أختار وزني المستهدف؟',
        content: `
          اختر وزناً:
          • آمناً (BMI بين 18.5-25)
          • واقعياً (0.5-1 كج/أسبوع)
          • مستدام (لا تصل إلى الوزن وتعود)
          
          تحدث مع طبيبك للأفضل!
        `
      },
      {
        heading: 'كيف أتابع صيامي؟',
        content: `
          التطبيق يكتشف الصيام تلقائياً:
          • إذا اخترت ديانتك
          • يحسب أيام الصيام
          • يعطيك توصيات طعام
          
          يدعم الصيام الإسلامي والمسيحي!
        `
      }
    ]
  },
  tips: {
    title: 'نصائح وحيل',
    sections: [
      {
        heading: '💡 نصائح التتبع',
        content: `
          1. تتبع فوراً (لا تنسى)
          2. قس الأوزان بدقة
          3. استخدم المفضلات للسرعة
          4. نسخ أمس للتكرار
          5. لا تقلق من فرق صغير
        `
      },
      {
        heading: '💪 نصائح التمارين',
        content: `
          1. ابدأ تدريجياً
          2. 150 دقيقة أسبوعياً موصى بها
          3. مزج تمارين مختلفة
          4. الراحة مهمة مثل التمرين
          5. استشر متخصصاً
        `
      },
      {
        heading: '🎯 نصائح الالتزام',
        content: `
          1. ضع أهداف واقعية
          2. احتفل بكل انتصار
          3. تتبع يومي مهم
          4. اسمح لنفسك بيوم غش
          5. الاستمرار أهم من الكمال
        `
      },
      {
        heading: '📱 نصائح الاستخدام',
        content: `
          1. استخدم الوضع الليلي للراحة
          2. فعّل الإشعارات للتذكير
          3. احفظ بيانات احتياطي
          4. استخدم الخطط الأسبوعية
          5. تابع التحليلات شهرياً
        `
      }
    ]
  },
  nutrition: {
    title: 'معلومات تغذوية',
    sections: [
      {
        heading: 'BMR vs TDEE',
        content: `
          BMR = معدل الأيض الأساسي
          • السعرات التي تحرقها في الراحة
          • يعتمد على: الوزن، الطول، العمر، الجنس
          
          TDEE = إجمالي حرق الطاقة اليومي
          • BMR × معامل النشاط
          • يتضمن التمارين والحركة
        `
      },
      {
        heading: 'توزيع الماكرو الأمثل',
        content: `
          البروتين (P): 25-35%
          • بناء العضلات
          • الشعور بالشبع
          
          الكربوهيدرات (C): 40-50%
          • الطاقة
          • وظائف الدماغ
          
          الدهون (F): 20-30%
          • الهرمونات
          • امتصاص الفيتامينات
        `
      },
      {
        heading: 'سعرات الخسارة الآمنة',
        content: `
          الوتيرة الآمنة: 0.5-1 كج/أسبوع
          
          عجز 500 سعر = 0.5 كج/أسبوع
          عجز 1000 سعر = 1 كج/أسبوع
          
          لا تتجاوز 1000 سعر عجز يومياً
          (قد يؤثر على الصحة)
        `
      }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// عرض محتوى الدليل
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض قسم من الدليل
 * @param {string} sectionKey - مفتاح القسم
 */
function renderGuideSection(sectionKey) {
  const section = GUIDE_CONTENT[sectionKey];
  if (!section) return;

  let html = `<div class="guide-section"><h2>${section.title}</h2>`;

  for (let subsection of section.sections) {
    html += `
      <div class="guide-subsection">
        <h3>${subsection.heading}</h3>
        <p>${subsection.content.trim()}</p>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('guideContainer').innerHTML = html;
}

/**
 * عرض جدول المحتويات
 */
function renderGuideMenu() {
  let html = '<div class="guide-menu">';

  for (let key in GUIDE_CONTENT) {
    const section = GUIDE_CONTENT[key];
    html += `
      <button class="guide-button" onclick="renderGuideSection('${key}');">
        ${section.title}
      </button>
    `;
  }

  html += '</div>';
  document.getElementById('guideMenuContainer').innerHTML = html;
}

/**
 * البحث في الدليل
 * @param {string} query - كلمة البحث
 */
function searchGuide(query) {
  const q = query.toLowerCase();
  let results = [];

  for (let sectionKey in GUIDE_CONTENT) {
    const section = GUIDE_CONTENT[sectionKey];

    for (let subsection of section.sections) {
      const titleMatch = subsection.heading.toLowerCase().includes(q);
      const contentMatch = subsection.content.toLowerCase().includes(q);

      if (titleMatch || contentMatch) {
        results.push({
          sectionTitle: section.title,
          subsectionTitle: subsection.heading,
          content: subsection.content
        });
      }
    }
  }

  renderSearchResults(results);
}

/**
 * عرض نتائج البحث
 * @param {Array} results - النتائج
 */
function renderSearchResults(results) {
  if (results.length === 0) {
    setText('guideContainer', 'لم توجد نتائج');
    return;
  }

  let html = '<div class="search-results">';

  for (let result of results) {
    html += `
      <div class="result-item">
        <p class="section-title">${result.sectionTitle}</p>
        <h4>${result.subsectionTitle}</h4>
        <p>${result.content.substring(0, 200)}...</p>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('guideContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// عرض الدليل
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث عرض الدليل
 */
function renderGuide() {
  renderGuideMenu();
  // عرض القسم الأول افتراضياً
  renderGuideSection('gettingStarted');
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GUIDE_CONTENT,
    renderGuideSection,
    renderGuideMenu,
    searchGuide,
    renderSearchResults,
    renderGuide
  };
}

console.log('✅ تبويب الدليل جاهز');
