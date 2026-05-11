/**
 * 🔧 utils.js - دوال مساعدة عامة
 * 
 * يحتوي على:
 * - DOM utilities ($, setText, etc)
 * - UI utilities (toast, modal, confirm)
 * - Security (escapeHtml, escAttr)
 * - String utilities (fuzzyMatch, guessEmoji)
 * - Data utilities (groupBy, etc)
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// DOM UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * اختيار عنصر من الـ DOM (jQuery-like)
 * @param {string} id - معرّف العنصر
 * @returns {HTMLElement|null}
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * تعيين نص العنصر
 * @param {string} id - معرّف العنصر
 * @param {string} text - النص
 */
function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

/**
 * الحصول على نص العنصر
 * @param {string} id - معرّف العنصر
 * @returns {string}
 */
function getStr(id) {
  const el = $(id);
  return el ? el.value || el.textContent : '';
}

/**
 * الحصول على قيمة رقمية من input
 * @param {string} id - معرّف العنصر
 * @returns {number}
 */
function getNum(id) {
  const val = getStr(id);
  return isNaN(val) ? 0 : parseFloat(val);
}

/**
 * تعيين قيمة input
 * @param {string} id - معرّف العنصر
 * @param {string|number} value - القيمة
 */
function setVal(id, value) {
  const el = $(id);
  if (el) el.value = value;
}

/**
 * إخفاء/إظهار عنصر
 * @param {string} id - معرّف العنصر
 * @param {boolean} show - true لإظهار
 */
function toggleDisplay(id, show = true) {
  const el = $(id);
  if (el) el.style.display = show ? '' : 'none';
}

// ═══════════════════════════════════════════════════════════════════════════
// UI UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إظهار رسالة toast
 * @param {string} message - الرسالة
 * @param {string} type - النوع (success, error, info, warning)
 * @param {number} duration - المدة بالميلي ثانية
 */
function toast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--${type === 'error' ? 'red' : type === 'success' ? 'green' : 'g1'});
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * فتح نافذة modal
 * @param {string} modalId - معرّف النافذة
 */
function openModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
  }
}

/**
 * إغلاق نافذة modal
 * @param {string} modalId - معرّف النافذة
 */
function closeModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
  }
}

/**
 * تأكيد مخصص بدلاً من window.confirm
 * @param {string} message - الرسالة
 * @param {Function} onOk - الدالة عند الموافقة
 * @param {string} title - العنوان
 */
function customConfirm(message, onOk, title = 'تأكيد') {
  const modal = document.createElement('div');
  modal.className = 'confirm-modal';
  modal.innerHTML = `
    <div class="confirm-content">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="confirm-buttons">
        <button class="btn-cancel">إلغاء</button>
        <button class="btn-ok">موافق</button>
      </div>
    </div>
  `;
  
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('.btn-cancel').onclick = () => modal.remove();
  modal.querySelector('.btn-ok').onclick = () => {
    onOk();
    modal.remove();
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تنظيف HTML من الأكواد الخطرة (XSS Protection)
 * @param {string} text - النص
 * @returns {string} - نص نظيف
 */
function escapeHtml(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * تنظيف attribute من الأكواد الخطرة
 * @param {string} text - النص
 * @returns {string} - نص نظيف
 */
function escAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

// ═══════════════════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * بحث غير دقيق (Fuzzy Match)
 * @param {string} query - الاستعلام
 * @param {string} text - النص
 * @returns {number} - درجة التطابق (0-1)
 */
function fuzzyMatch(query, text) {
  if (!query || !text) return 0;
  
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
  // تطابق مباشر
  if (t.includes(q)) return 1;
  
  // تطابق الحروف الأولى
  let score = 0;
  let qIdx = 0;
  
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      score += 1;
      qIdx++;
    }
  }
  
  return qIdx === q.length ? score / t.length : 0;
}

/**
 * تخمين emoji للصنف
 * @param {string} foodName - اسم الصنف
 * @returns {string} - emoji مناسب
 */
function guessEmoji(foodName) {
  const name = foodName.toLowerCase();
  
  const emojiMap = {
    // الخضروات
    'خيار': '🥒',
    'طماطم': '🍅',
    'جرجير': '🥬',
    'فلفل': '🫑',
    'ذرة': '🌽',
    'جزر': '🥕',
    'بصل': '🧅',
    'ثوم': '🧄',
    'بروكلي': '🥦',
    'خس': '🥬',
    'خضار': '🥗',
    
    // الفواكه
    'تفاح': '🍎',
    'موز': '🍌',
    'برتقال': '🍊',
    'ليمون': '🍋',
    'عنب': '🍇',
    'شمام': '🍈',
    'أناناس': '🍍',
    'فراولة': '🍓',
    'رمان': '🍎',
    'مانجو': '🥭',
    'جوافة': '🍑',
    'توت': '🫐',
    'فاكهة': '🍎',
    
    // البروتينات
    'دجاج': '🍗',
    'لحم': '🥩',
    'سمك': '🐟',
    'بيض': '🥚',
    'جبنة': '🧀',
    'حليب': '🥛',
    'زبادي': '🥛',
    'بروتين': '🥩',
    
    // النشويات والحبوب
    'أرز': '🍚',
    'خبز': '🍞',
    'مكرونة': '🍝',
    'شعيرية': '🍝',
    'فول': '🫘',
    'عدس': '🫘',
    'حمص': '🫘',
    'حبوب': '🌾',
    
    // المشروبات
    'ماء': '💧',
    'قهوة': '☕',
    'شاي': '🫖',
    'عصير': '🧃',
    'لبن': '🥛',
    'مشروب': '☕',
    
    // المكسرات
    'لوز': '🫘',
    'جوز': '🥜',
    'فستق': '🥜',
    'تمر': '🫘',
    'كاجو': '🫘',
    'مكسرات': '🥜',
    
    // الدهون والزيوت
    'زيت': '🫒',
    'زبدة': '🧈',
    'دهن': '🫒',
    
    // الحلويات والسكريات
    'حلويات': '🍰',
    'كعك': '🍰',
    'شوكولاتة': '🍫',
    'حلوى': '🍭',
    'عسل': '🍯',
    
    // الأطباق
    'طبخ': '🍳',
    'طبق': '🍽️',
    'وجبة': '🍽️',
    'فول': '🫘',
    'طعام': '🍽️'
  };
  
  // بحث مباشر
  for (let key in emojiMap) {
    if (name.includes(key)) {
      return emojiMap[key];
    }
  }
  
  // emoji افتراضي
  return '🍽️';
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تجميع مصفوفة حسب خاصية معينة
 * @param {Array} arr - المصفوفة
 * @param {string} key - المفتاح
 * @returns {Object} - كائن مجمع
 */
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key] || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

/**
 * فرز مصفوفة
 * @param {Array} arr - المصفوفة
 * @param {string} key - المفتاح
 * @param {boolean} asc - ترتيب صاعد
 * @returns {Array} - مصفوفة مرتبة
 */
function sortBy(arr, key, asc = true) {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return asc ? -1 : 1;
    if (aVal > bVal) return asc ? 1 : -1;
    return 0;
  });
}

/**
 * تصفية مصفوفة
 * @param {Array} arr - المصفوفة
 * @param {Function} predicate - شرط التصفية
 * @returns {Array} - مصفوفة مفلترة
 */
function filter(arr, predicate) {
  return arr.filter(predicate);
}

// ═══════════════════════════════════════════════════════════════════════════
// NUMBER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تقريب عدد عشري
 * @param {number} num - الرقم
 * @param {number} decimals - عدد الأرقام العشرية
 * @returns {number}
 */
function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * تنسيق عدد برقم عشري مع فاصلة
 * @param {number} num - الرقم
 * @param {number} decimals - أرقام عشرية
 * @returns {string}
 */
function formatNumber(num, decimals = 2) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * تنسيق رقم بصيغة مختصرة (مثل 1.2K)
 * @param {number} num - الرقم
 * @returns {string}
 */
function formatShort(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    $,
    setText,
    getStr,
    getNum,
    setVal,
    toggleDisplay,
    toast,
    openModal,
    closeModal,
    customConfirm,
    escapeHtml,
    escAttr,
    fuzzyMatch,
    guessEmoji,
    groupBy,
    sortBy,
    filter,
    round,
    formatNumber,
    formatShort
  };
}

console.log('✅ Utility functions loaded');
