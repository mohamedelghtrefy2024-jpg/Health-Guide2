/**
 * 📚 library.js - تبويب مكتبة الأطعمة
 * 
 * يدير:
 * - عرض قائمة الأطعمة
 * - البحث والتصفية
 * - المفضلات
 * - الأطعمة المخصصة
 * 
 * تاريخ الإنشاء: 9 مايو 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// عرض قائمة الأطعمة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض شبكة الأطعمة
 * @param {Array} foods - قائمة الأطعمة
 * @param {Array} favorites - الأطعمة المفضلة (اختياري)
 */
function renderFoodGrid(foods, favorites = []) {
  let html = '<div class="food-grid">';
  
  for (let food of foods.slice(0, 100)) { // حد أقصى 100 صنف لكل صفحة
    const isFavorite = favorites.some(f => f.id === food.id);
    const emoji = food.emoji || guessEmoji(food.name);
    
    html += `
      <div class="food-card" onclick="openFoodModal(${JSON.stringify(food).replace(/"/g, '&quot;')})">
        <div class="food-emoji">${emoji}</div>
        <h4>${food.name}</h4>
        <p class="food-kcal">${food.kcal} سعر/100غ</p>
        <p class="food-macros">
          P: ${food.p}غ | C: ${food.c}غ | F: ${food.f}غ
        </p>
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                onclick="event.stopPropagation(); toggleFavorite(${food.id});">
          ♥️
        </button>
      </div>
    `;
  }
  
  html += '</div>';
  document.getElementById('foodGridContainer').innerHTML = html;
}

/**
 * تصفية الأطعمة حسب التصنيف
 * @param {string} category - التصنيف
 * @returns {Array} - الأطعمة المصفاة
 */
function filterByCategory(category) {
  if (!category || category === 'all') {
    return ALL_FOODS;
  }
  return ALL_FOODS.filter(f => f.cat === category);
}

/**
 * الحصول على التصنيفات الفريدة
 * @returns {Array} - قائمة التصنيفات
 */
function getCategories() {
  const categories = new Set();
  for (let food of ALL_FOODS) {
    if (food.cat) categories.add(food.cat);
  }
  return Array.from(categories).sort();
}

/**
 * عرض أزرار التصنيفات
 */
function renderCategoryFilter() {
  const categories = getCategories();
  let html = '<div class="category-filter"><button class="active" onclick="filterFoods(\'all\');">الكل</button>';
  
  for (let cat of categories) {
    html += `<button onclick="filterFoods('${cat}');">${cat}</button>`;
  }
  
  html += '</div>';
  document.getElementById('categoryFilterContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// البحث والتصفية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * البحث عن أطعمة
 * @param {string} query - كلمة البحث
 * @returns {Array} - نتائج البحث
 */
function searchFoods(query) {
  if (!query || query.trim().length === 0) {
    return ALL_FOODS;
  }
  
  const q = query.trim().toLowerCase();
  
  // بحث دقيق أولاً
  let results = ALL_FOODS.filter(f => 
    f.name.toLowerCase().includes(q)
  );
  
  // إذا لم نجد نتائج، استخدم fuzzy match
  if (results.length === 0) {
    results = ALL_FOODS.filter(f => fuzzyMatch(q, f.name) > 0.6);
  }
  
  return results.slice(0, 50); // حد أقصى 50 نتيجة
}

/**
 * تطبيق التصفية والبحث
 * @param {string} query - كلمة البحث
 * @param {string} category - التصنيف (اختياري)
 */
function filterFoods(query, category = 'all') {
  let results;
  
  if (query && query !== 'all') {
    results = searchFoods(query);
  } else {
    results = filterByCategory(category);
  }
  
  renderFoodGrid(results, S.favorites);
}

// ═══════════════════════════════════════════════════════════════════════════
// المفضلات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إضافة/إزالة طعام من المفضلات
 * @param {number} foodId - معرف الطعام
 */
function toggleFavorite(foodId) {
  const food = ALL_FOODS.find(f => f.id === foodId);
  if (!food) return;
  
  const index = S.favorites.findIndex(f => f.id === foodId);
  
  if (index > -1) {
    // إزالة من المفضلات
    S.favorites.splice(index, 1);
    toast('تم إزالة من المفضلات', 'info');
  } else {
    // إضافة للمفضلات
    S.favorites.push(food);
    toast('تم إضافة للمفضلات ♥️', 'success');
  }
  
  debouncedSave(S);
}

/**
 * عرض الأطعمة المفضلة فقط
 */
function showFavorites() {
  if (S.favorites.length === 0) {
    toast('لا توجد أطعمة مفضلة بعد', 'warning');
    return;
  }
  
  renderFoodGrid(S.favorites, S.favorites);
}

/**
 * عرض شريط المفضلات السريعة
 */
function renderFavoritesBar() {
  if (!S.favorites || S.favorites.length === 0) return;
  
  let html = '<div class="favorites-bar">';
  
  for (let food of S.favorites.slice(0, 8)) {
    const emoji = food.emoji || guessEmoji(food.name);
    html += `
      <button class="favorite-quick" onclick="addToCurrentMeal(${JSON.stringify(food).replace(/"/g, '&quot;')});">
        ${emoji}<br>${food.name}
      </button>
    `;
  }
  
  html += '</div>';
  document.getElementById('favoritesBarContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// الأطعمة المخصصة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء طعام مخصص
 * @param {Object} customFood - بيانات الطعام
 */
function addCustomFood(customFood) {
  if (!customFood.name || !customFood.kcal) {
    toast('الرجاء إدخال اسم الطعام والسعرات', 'error');
    return;
  }
  
  if (!S.customFoods) {
    S.customFoods = [];
  }
  
  const id = 9000 + S.customFoods.length; // معرفات مخصصة من 9000
  
  S.customFoods.push({
    id: id,
    name: customFood.name,
    emoji: customFood.emoji || guessEmoji(customFood.name),
    kcal: parseFloat(customFood.kcal),
    p: parseFloat(customFood.p || 0),
    c: parseFloat(customFood.c || 0),
    f: parseFloat(customFood.f || 0),
    fiber: parseFloat(customFood.fiber || 0),
    cat: customFood.cat || 'مخصص',
    source: 'custom',
    createdAt: new Date().toISOString()
  });
  
  debouncedSave(S);
  toast('تم إضافة الطعام المخصص', 'success');
}

/**
 * حذف طعام مخصص
 * @param {number} foodId - معرف الطعام
 */
function deleteCustomFood(foodId) {
  const index = S.customFoods.findIndex(f => f.id === foodId);
  if (index > -1) {
    S.customFoods.splice(index, 1);
    debouncedSave(S);
    toast('تم حذف الطعام', 'info');
  }
}

/**
 * عرض الأطعمة المخصصة
 */
function renderCustomFoods() {
  if (!S.customFoods || S.customFoods.length === 0) {
    setText('customFoodsContainer', 'لا توجد أطعمة مخصصة');
    return;
  }
  
  let html = '<div class="custom-foods-list">';
  
  for (let food of S.customFoods) {
    html += `
      <div class="custom-food-item">
        <span>${food.emoji} ${food.name}</span>
        <span>${food.kcal} سعر</span>
        <button onclick="deleteCustomFood(${food.id});">حذف</button>
      </div>
    `;
  }
  
  html += '</div>';
  document.getElementById('customFoodsContainer').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// نافذة الطعام
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة الطعام
 * @param {Object} food - الطعام
 */
function openFoodModal(food) {
  const modal = document.getElementById('foodModal');
  if (!modal) return;
  
  setText('foodModalName', food.emoji + ' ' + food.name);
  setText('foodModalKcal', food.kcal + ' سعر/100غ');
  setText('foodModalMacros', `P: ${food.p}غ | C: ${food.c}غ | F: ${food.f}غ`);
  setVal('foodQuantity', 1);
  setVal('foodWeight', food.weight || 100);
  
  // حفظ الطعام الحالي
  window.currentFood = food;
  
  openModal('foodModal');
}

/**
 * إضافة الطعام إلى الوجبة الحالية
 * @param {Object} food - الطعام
 */
function addToCurrentMeal(food) {
  if (!food || !window.currentMeal) {
    toast('الرجاء تحديد وجبة أولاً', 'warning');
    return;
  }
  
  const quantity = parseFloat(getNum('foodQuantity')) || 1;
  const weight = parseFloat(getNum('foodWeight')) || 100;
  
  const foodWithQuantity = {
    ...food,
    quantity: quantity,
    weight: weight
  };
  
  const today = new Date().toISOString().split('T')[0];
  const dayRecord = getDayRecord(S.tracker, today);
  
  addFoodToMeal(dayRecord, window.currentMeal, foodWithQuantity);
  
  updateTracker();
  closeModal('foodModal');
  toast('تم إضافة الطعام', 'success');
}

// ═══════════════════════════════════════════════════════════════════════════
// الإحصائيات والتقارير
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تصدير قائمة الأطعمة
 */
function exportFoodList() {
  const data = {
    foods: ALL_FOODS,
    customFoods: S.customFoods,
    favorites: S.favorites,
    exportDate: new Date().toISOString()
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `food-list-${new Date().getTime()}.json`;
  a.click();
}

/**
 * استيراد قائمة أطعمة
 * @param {File} file - الملف
 */
function importFoodList(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.customFoods) {
        S.customFoods = data.customFoods;
      }
      if (data.favorites) {
        S.favorites = data.favorites;
      }
      
      debouncedSave(S);
      toast('تم استيراد البيانات بنجاح', 'success');
    } catch (error) {
      toast('خطأ في استيراد الملف', 'error');
    }
  };
  
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════════════════════
// التصدير
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderFoodGrid,
    filterByCategory,
    getCategories,
    renderCategoryFilter,
    searchFoods,
    filterFoods,
    toggleFavorite,
    showFavorites,
    renderFavoritesBar,
    addCustomFood,
    deleteCustomFood,
    renderCustomFoods,
    openFoodModal,
    addToCurrentMeal,
    exportFoodList,
    importFoodList
  };
}

console.log('✅ تبويب مكتبة الأطعمة جاهز');

// ═══════════════════════════════════════════════════════════════════════════
// دوال موحدة للمكتبة
// ═══════════════════════════════════════════════════════════════════════════

function filterFoods(query) {
  const cat = window._currentCat || 'all';
  let foods = getAllFoods();
  if (query && query !== 'all') {
    foods = foods.filter(f => f.name.includes(query));
  } else if (cat !== 'all') {
    foods = foods.filter(f => f.cat === cat);
  }
  renderFoodGrid(foods.slice(0, 80), S.favorites || []);
  renderCategoryFilter(cat);
}

function searchFoods(query) {
  const results = getAllFoods().filter(f => f.name.includes(query)).slice(0, 80);
  renderFoodGrid(results, S.favorites || []);
}

function renderCategoryFilter(active = 'all') {
  const cats = [
    { id:'all', label:'الكل', icon:'🍴' },
    { id:'vegetables', label:'خضروات', icon:'🥦' },
    { id:'fruits', label:'فواكه', icon:'🍎' },
    { id:'protein', label:'بروتين', icon:'🥩' },
    { id:'grains', label:'حبوب', icon:'🌾' },
    { id:'legumes', label:'بقوليات', icon:'🫘' },
    { id:'nuts', label:'مكسرات', icon:'🥜' },
    { id:'drinks', label:'مشروبات', icon:'🥤' },
    { id:'oils', label:'زيوت', icon:'🫙' },
    { id:'spices', label:'توابل', icon:'🌿' },
  ];
  const html = cats.map(c =>
    `<button class="cat-btn ${active === c.id ? 'active' : ''}"
      onclick="window._currentCat='${c.id}'; filterFoods('all')">
      ${c.icon} ${c.label}
    </button>`
  ).join('');
  const el = document.getElementById('categoryFilterContainer');
  if (el) el.innerHTML = html;
}

function toggleFavorite(foodId) {
  if (!S.favorites) S.favorites = [];
  const idx = S.favorites.findIndex(f => f.id === foodId);
  if (idx >= 0) {
    S.favorites.splice(idx, 1);
    toast('تم الإزالة من المفضلة', 'info');
  } else {
    const food = getAllFoods().find(f => f.id === foodId);
    if (food) { S.favorites.push(food); toast('تم الإضافة للمفضلة ❤️', 'success'); }
  }
  debouncedSave(S);
  filterFoods('all');
}
