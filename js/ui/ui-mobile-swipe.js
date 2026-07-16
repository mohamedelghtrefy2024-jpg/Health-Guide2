// ---- item 3: تنقل لمسي محسّن على الموبايل — swipe بين العقد المرتبطة مباشرة ----
let swipeStartX = null, swipeStartY = null;
const swipeCursors = {};
if(drawer){
  drawer.addEventListener('touchstart', (e)=>{
    if(!e.touches || e.touches.length!==1) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  }, { passive:true });
  drawer.addEventListener('touchend', (e)=>{
    if(swipeStartX===null || !currentNode) { swipeStartX=null; swipeStartY=null; return; }
    const t = e.changedTouches && e.changedTouches[0];
    const endX = t ? t.clientX : swipeStartX;
    const endY = t ? t.clientY : swipeStartY;
    const dx = endX - swipeStartX, dy = endY - swipeStartY;
    swipeStartX = null; swipeStartY = null;
    if(Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy)*1.5) return; // مش سحب أفقي واضح — تجاهل
    const resolvable = currentNode.connections.map(c=>findByName(c)).filter(Boolean);
    if(!resolvable.length) return;
    const sourceId = currentNode.id;
    const dir = dx < 0 ? 1 : -1;
    let idx = swipeCursors[sourceId] !== undefined ? swipeCursors[sourceId] : -1;
    idx = ((idx + dir) % resolvable.length + resolvable.length) % resolvable.length;
    swipeCursors[sourceId] = idx;
    openNode(resolvable[idx], true);
  }, { passive:true });
}

