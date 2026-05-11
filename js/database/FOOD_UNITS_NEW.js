// ============================================================
// FOOD_UNITS — وحدات القياس الذكية لكل صنف
// ============================================================
//
// الأنواع:
//   'piece'  = يُضاف بالعدد   (حبة، شريحة، رغيف، ملعقة كبيرة)
//   'weight' = يُضاف بالجرام  (100 جم افتراضي)
//   'liquid' = يُضاف بالمليمتر
//   'spoon'  = يُضاف بالملعقة
//
// الحقول:
//   weight  = وزن/حجم الوحدة الواحدة بالجرام (أو مل للسوائل)
//   unit    = اسم الوحدة بالإنجليزي
//   unitAr  = اسم الوحدة بالعربي
//   type    = نوع الوحدة
// ============================================================

const FOOD_UNITS = {

  // ==================== خضروات (piece) ====================
  'خيار':              { weight: 201, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'طماطم':             { weight: 123, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'فلفل ألوان':        { weight: 119, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'كوسة':              { weight: 196, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'جزر':               { weight: 61,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'باذنجان':           { weight: 458, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بصل':               { weight: 150, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'ثوم':               { weight: 3,   unit: 'clove',  unitAr: 'فص',      type: 'piece' },
  'كرنب':              { weight: 908, unit: 'piece',  unitAr: 'رأس',     type: 'piece' },
  'خرشوف':             { weight: 128, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بروكلي':            { weight: 608, unit: 'piece',  unitAr: 'رأس',     type: 'piece' },
  'قرنبيط':            { weight: 840, unit: 'piece',  unitAr: 'رأس',     type: 'piece' },
  'ذرة':               { weight: 77,  unit: 'piece',  unitAr: 'كوز',     type: 'piece' },
  'فطر':               { weight: 18,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'فجل':               { weight: 4.5, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },

  // خضروات ورقية (weight)
  'خس':                { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جرجير':             { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'سبانخ':             { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'ملوخية':            { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بقدونس':            { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'نعناع':             { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'كزبرة':             { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'كراث':              { weight: 89,  unit: 'piece',  unitAr: 'ساق',     type: 'piece' },
  'كرفس':              { weight: 40,  unit: 'piece',  unitAr: 'ساق',     type: 'piece' },
  'بامية':             { weight: 7.5, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'فاصوليا خضراء':     { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بازلاء خضراء':      { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'ورق عنب':           { weight: 8,   unit: 'piece',  unitAr: 'ورقة',    type: 'piece' },
  'فلفل حار':          { weight: 14,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بطاطا':             { weight: 213, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بطاطا حلوة':        { weight: 130, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'قرع عسل':           { weight: 200, unit: 'slice',  unitAr: 'شريحة',   type: 'piece' },
  'بنجر':              { weight: 82,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'لفت':               { weight: 122, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'شمر':               { weight: 234, unit: 'piece',  unitAr: 'رأس',     type: 'piece' },

  // ==================== فواكه (piece) ====================
  'تفاح':              { weight: 182, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'موز':               { weight: 118, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'برتقال':            { weight: 131, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'مانجو':             { weight: 336, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'جوافة':             { weight: 165, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'رمان':              { weight: 282, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'كيوي':              { weight: 69,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'أفوكادو':           { weight: 150, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'تمر':               { weight: 7.1, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بلح':               { weight: 7.1, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بطيخ':              { weight: 280, unit: 'slice',  unitAr: 'شريحة',   type: 'piece' },
  'شمام':              { weight: 552, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'تين طازج':          { weight: 50,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'خوخ':               { weight: 130, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'مشمش':              { weight: 35,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'كمثرى':             { weight: 166, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'أناناس':            { weight: 905, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'ليمون':             { weight: 58,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'جريب فروت':         { weight: 246, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بابايا':            { weight: 304, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'دراق':              { weight: 150, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'برقوق':             { weight: 66,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'كاكا':              { weight: 168, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'فراولة':            { weight: 12,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'عنب':               { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'توت':               { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'زبيب':              { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },

  // ==================== بروتينات (weight) ====================
  'صدر دجاج':          { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'دجاج مشوي':         { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'دجاج مسلوق':        { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'فخذ دجاج':          { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'سمك بلطي':          { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'سمك سلمون':         { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'سمك مكريل':         { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'سمك بوري':          { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'سمك مشوي':          { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'تونة بالماء':       { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'تونة':              { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'لحم بقري':          { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'لحم ضأن':           { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'لحم مفروم':         { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'كفتة':              { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'كبدة':              { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'روبيان':            { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جمبري':             { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بيض':               { weight: 50,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بيض مسلوق':         { weight: 50,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بيضة':              { weight: 50,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بياض البيض':        { weight: 33,  unit: 'piece',  unitAr: 'بياض حبة', type: 'piece' },

  // ألبان وجبن (weight)
  'جبنة قريش':         { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جبنة بيضاء':        { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جبنة فيتا':         { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جبنة ريكوتا':       { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جبنة كوتيج':        { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جبنة موزاريلا':     { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جبنة شيدر':         { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جبنة صويا':         { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'توفو':              { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'زبادي':             { weight: 170, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'زبادي يوناني':      { weight: 170, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'زبادي لايت':        { weight: 170, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'حليب':              { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'لبن':               { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },

  // ==================== نشويات ====================
  'أرز أبيض مطبوخ':   { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'أرز بني مطبوخ':    { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'أرز بسمتي مطبوخ':  { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'أرز':               { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'مكرونة مطبوخة':    { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'مكرونة':            { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'شوفان':             { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'كينوا مطبوخة':      { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'كينوا':             { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'كسكسي مطبوخ':      { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'برغل مطبوخ':        { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'فريك مطبوخ':        { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'شعير مطبوخ':        { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'ربع رغيف بلدي':     { weight: 25,  unit: 'piece',  unitAr: 'ربع رغيف', type: 'piece' },
  'نصف رغيف بلدي':     { weight: 50,  unit: 'piece',  unitAr: 'نصف رغيف', type: 'piece' },
  'رغيف بلدي كامل':    { weight: 100, unit: 'piece',  unitAr: 'رغيف',    type: 'piece' },
  'رغيف بلدي':         { weight: 100, unit: 'piece',  unitAr: 'رغيف',    type: 'piece' },
  'شريحة خبز أسمر':   { weight: 30,  unit: 'piece',  unitAr: 'شريحة',   type: 'piece' },
  'شريحة خبز أبيض':   { weight: 30,  unit: 'piece',  unitAr: 'شريحة',   type: 'piece' },
  'خبز تورتيلا':       { weight: 45,  unit: 'piece',  unitAr: 'قرص',     type: 'piece' },
  'خبز البروتين':      { weight: 30,  unit: 'piece',  unitAr: 'شريحة',   type: 'piece' },
  'خبز الصمون':        { weight: 75,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'خبز الهمبرجر':      { weight: 70,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'رايس كيك':          { weight: 9,   unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'عيش فينو':          { weight: 60,  unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بطاطس مسلوقة':      { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بطاطس مشوية':       { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بطاطس':             { weight: 150, unit: 'g',      unitAr: 'جم',      type: 'weight' },

  // ==================== مكسرات (piece/weight) ====================
  'لوز':               { weight: 1.2, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'عين جمل':           { weight: 3.5, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'فستق':              { weight: 0.9, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'فستق حلبي':         { weight: 0.9, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'بندق':              { weight: 1.5, unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'كاجو':              { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'صنوبر':             { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'فول سوداني':        { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'جوز برازيلي':       { weight: 5,   unit: 'piece',  unitAr: 'حبة',     type: 'piece' },
  'جوز بيكان':         { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'طحينة':             { weight: 15,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'زبدة فول سوداني':   { weight: 16,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'زبدة لوز':          { weight: 16,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'بذور شيا':          { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بذور كتان':         { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بذور اليقطين':      { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بذور عباد الشمس':   { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'بذور السمسم':       { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'سمسم':              { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'كستناء':            { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },

  // ==================== زيوت وإضافات (spoon/liquid) ====================
  'زيت زيتون':         { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'زيت جوز الهند':     { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'زيت سمسم':          { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'زيت كانولا':        { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'زيت عباد الشمس':    { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'زيت أفوكادو':       { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'زيت ذرة':           { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'عسل':               { weight: 21,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'عسل نحل':           { weight: 21,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'دبس':               { weight: 20,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'خل تفاح':           { weight: 15,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'خل بلسمي':          { weight: 15,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'صلصة طماطم':        { weight: 15,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'كاتشب':             { weight: 15,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'مايونيز':           { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'مايونيز لايت':      { weight: 14,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'نوتيلا':            { weight: 15,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },
  'نوتيلا دايت':       { weight: 15,  unit: 'tbsp',   unitAr: 'م.ك',     type: 'spoon' },

  // ==================== بقوليات (weight) ====================
  'فول':               { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'فول مدمس':          { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'فول معلب':          { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'عدس':               { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'عدس أحمر':          { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'حمص':               { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'حمص مسلوق':         { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'فاصوليا حمراء':     { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'فاصوليا بيضاء':     { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'لوبيا':             { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'ترمس':              { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'فول صويا':          { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },
  'توفو صويا':         { weight: 100, unit: 'g',      unitAr: 'جم',      type: 'weight' },

  // ==================== مشروبات (liquid) ====================
  'ماء':               { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'ماء دافئ بالليمون': { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'شاي أخضر':          { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'شاي أسود':          { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'شاي':               { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'قهوة':              { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'قهوة سادة':         { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'نسكافيه':           { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'عصير برتقال':       { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'عصير تفاح':         { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'عصير مانجو':        { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'كركديه':            { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'زنجبيل مغلي':       { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'قرفة مغلية':        { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'كمون مغلي':         { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'بابونج':            { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'نعناع مغلي':        { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'حليب لوز':          { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'حليب جوز الهند':    { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },
  'بروتين شيك':        { weight: 1,   unit: 'ml',     unitAr: 'مل',      type: 'liquid' },

  // ==================== توابل (spoon) ====================
  'ملح':               { weight: 6,   unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'فلفل أسود':         { weight: 2.3, unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'كمون':              { weight: 2.1, unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'كركم':              { weight: 3,   unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'قرفة':              { weight: 2.6, unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'زنجبيل':            { weight: 1.8, unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'ثوم بودرة':         { weight: 3.1, unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'بابريكا':           { weight: 2.3, unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'حبة البركة':        { weight: 3,   unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'زعتر':              { weight: 3,   unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'ريحان':             { weight: 2,   unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
  'أوريجانو':          { weight: 2,   unit: 'tsp',    unitAr: 'م.ص',     type: 'spoon' },
};

// ============================================================
// دوال مساعدة
// ============================================================

/**
 * احصل على وحدة الصنف — يبحث بالاسم الكامل ثم بأول كلمة
 * @param {string} foodName - اسم الصنف
 * @returns {object} - بيانات الوحدة أو الافتراضي (weight/100g)
 */
function getFoodUnit(foodName) {
  if (!foodName) return { weight: 100, unit: 'g', unitAr: 'جم', type: 'weight' };

  // بحث بالاسم الكامل أولاً
  if (FOOD_UNITS[foodName]) return FOOD_UNITS[foodName];

  // بحث بأول كلمتين
  const parts = foodName.trim().split(' ');
  if (parts.length > 1) {
    const twoWords = parts.slice(0, 2).join(' ');
    if (FOOD_UNITS[twoWords]) return FOOD_UNITS[twoWords];
  }

  // بحث بأول كلمة
  const firstWord = parts[0];
  if (FOOD_UNITS[firstWord]) return FOOD_UNITS[firstWord];

  // افتراضي حسب التصنيف
  return { weight: 100, unit: 'g', unitAr: 'جم', type: 'weight' };
}

/**
 * احسب السعرات لكمية معينة
 * @param {object} food - الصنف { kcal, ... } (لكل 100 جم)
 * @param {number} quantity - الكمية (عدد حبات أو جرام أو مل)
 * @param {string} foodName - اسم الصنف لمعرفة الوحدة
 */
function calcFoodKcal(food, quantity, foodName) {
  const unit = getFoodUnit(foodName);
  const grams = quantity * unit.weight;
  return (food.kcal * grams) / 100;
}

/**
 * احصل على نص الوحدة للعرض
 * @param {string} foodName
 * @param {number} quantity
 */
function getUnitDisplay(foodName, quantity = 1) {
  const unit = getFoodUnit(foodName);
  return `${quantity} ${unit.unitAr}`;
}

if (typeof module !== 'undefined') {
  module.exports = { FOOD_UNITS, getFoodUnit, calcFoodKcal, getUnitDisplay };
}
