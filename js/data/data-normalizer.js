const CATS_ALL = ["المسار اللاهوتي","العصور القديمة","ما قبل الحداثة","الفاشية والنازية",
  "MK Ultra والتحكم العقلي","أجندة تخفيض السكان","عمليات مخابراتية",
  "حرب مناخية وتكنولوجية","عصر ترامب","فضائي / غامض","عقدة مركزية","بانتظار المحتوى"];

const CAT_COLORS = {
  "المسار اللاهوتي":"#c1483b", "العصور القديمة":"#d9a441", "ما قبل الحداثة":"#8a6fd1",
  "الفاشية والنازية":"#7a7f8c", "MK Ultra والتحكم العقلي":"#5fa8a0",
  "أجندة تخفيض السكان":"#4f8fd1", "عمليات مخابراتية":"#e0674f",
  "حرب مناخية وتكنولوجية":"#3fae6a", "عصر ترامب":"#e0b64f",
  "فضائي / غامض":"#4fd1c5", "عقدة مركزية":"#ffffff", "بانتظار المحتوى":"#4a4f5c"
};

const nodes = window.MAP_NODES || [];
const CATS = CATS_ALL.filter(c => nodes.some(n=>n.category===c));
const nameIndex = {};
nodes.forEach(n => { nameIndex[n.name.trim()] = n; });

function findByName(name){
  name = name.trim();
  if(nameIndex[name]) return nameIndex[name];
  // loose fallback: try matching by stripped parenthetical / substring
  const core = name.replace(/\s*\(.*?\)\s*/g,'').trim();
  for(const key in nameIndex){
    if(key.replace(/\s*\(.*?\)\s*/g,'').trim() === core) return nameIndex[key];
  }
  return null;
}

let activeCats = new Set(CATS);
let searchTerm = "";
let history = [];
let historyPos = -1;

