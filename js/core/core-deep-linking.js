// ---- item 2: Deep Linking (?node=<id>) ----
function updateUrlForNode(node){
  try{
    const url = new URL(window.location.href);
    url.searchParams.set('node', node.id);
    window.history.pushState({ nodeId: node.id }, '', url);
  }catch(e){ /* بيئات نادرة بدون History API — تجاهل بصمت، الميزة اختيارية */ }
}
function tryOpenNodeFromUrl(){
  const idParam = new URLSearchParams(window.location.search).get('node');
  if(!idParam) return false;
  const n = nodes.find(x=>x.id===Number(idParam));
  if(n){ openNode(n, true, { skipUrlUpdate:true }); return true; }
  return false;
}
window.addEventListener('popstate', ()=>{
  const idParam = new URLSearchParams(window.location.search).get('node');
  if(idParam){
    const n = nodes.find(x=>x.id===Number(idParam));
    if(n) openNode(n, false, { skipUrlUpdate:true });
  } else {
    closeDrawer();
  }
});

