// ---- adjacency cache (id -> Set(neighbor ids)), مبني على الروابط القابلة للحل فقط ----
let _adjacencyCache = null;
function getAdjacency(){
  if(_adjacencyCache) return _adjacencyCache;
  const adj = new Map();
  nodes.forEach(n=> adj.set(n.id, new Set()));
  nodes.forEach(n=>{
    n.connections.forEach(cname=>{
      const t = findByName(cname);
      if(t){ adj.get(n.id).add(t.id); adj.get(t.id).add(n.id); }
    });
  });
  _adjacencyCache = adj;
  return adj;
}
function invalidateAdjacencyCache(){ _adjacencyCache = null; }

// ---- item 1 & 3: العقد المشتركة بين عقدتين (common neighbors) ----
function getCommonNeighbors(idA, idB){
  const adj = getAdjacency();
  const a = adj.get(idA), b = adj.get(idB);
  if(!a || !b) return [];
  const commonIds = [...a].filter(id=> b.has(id) && id!==idA && id!==idB);
  return commonIds.map(id=> nodes.find(n=>n.id===id)).filter(Boolean);
}

// ---- item 2: أقصر مسار بين عقدتين (BFS غير موزون) ----
function shortestPath(idA, idB){
  if(idA === idB) return [idA];
  const adj = getAdjacency();
  if(!adj.has(idA) || !adj.has(idB)) return null;
  const visited = new Set([idA]);
  const prev = new Map();
  const queue = [idA];
  let qi = 0;
  while(qi < queue.length){
    const cur = queue[qi++];
    if(cur === idB) break;
    for(const nb of adj.get(cur)){
      if(!visited.has(nb)){
        visited.add(nb);
        prev.set(nb, cur);
        queue.push(nb);
      }
    }
  }
  if(!visited.has(idB)) return null;
  const path = [idB];
  let cur = idB;
  while(cur !== idA){ cur = prev.get(cur); path.push(cur); }
  path.reverse();
  return path.map(id=> nodes.find(n=>n.id===id)).filter(Boolean);
}

// ---- item 4: العقد اليتيمة (روابطها القابلة للحل ≤ حد معين) ----
function findOrphans(maxConnections){
  const adj = getAdjacency();
  return nodes.filter(n=> adj.get(n.id).size <= maxConnections);
}

// ---- item 5: Graph Metrics / Centrality (بديل عن الاعتماد على عدد الروابط الخام فقط) ----
function computeDegreeCentrality(){
  const adj = getAdjacency();
  const N = nodes.length;
  const map = new Map();
  nodes.forEach(n=> map.set(n.id, N>1 ? adj.get(n.id).size/(N-1) : 0));
  return map;
}
// Betweenness centrality (خوارزمية Brandes، O(V·E))، بتدي ترتيب "أهمية" مختلف عن مجرد عدد الاتصالات
// (عقدة ممكن يكون عندها اتصالات قليلة لكنها جسر أساسي بين تجمعين مختلفين).
function computeBetweennessCentrality(){
  const N = nodes.length;
  const idxOf = new Map(nodes.map((n,i)=>[n.id,i]));
  const adj = getAdjacency();
  const adjIdx = nodes.map(n=> [...adj.get(n.id)].map(id=> idxOf.get(id)));
  const CB = new Float64Array(N);
  for(let s=0; s<N; s++){
    const stack = [];
    const P = Array.from({length:N}, ()=>[]);
    const sigma = new Float64Array(N); sigma[s]=1;
    const d = new Int32Array(N).fill(-1); d[s]=0;
    const queue = [s]; let qi=0;
    while(qi < queue.length){
      const v = queue[qi++];
      stack.push(v);
      const neigh = adjIdx[v];
      for(let k=0;k<neigh.length;k++){
        const w = neigh[k];
        if(d[w] < 0){ queue.push(w); d[w] = d[v]+1; }
        if(d[w] === d[v]+1){ sigma[w] += sigma[v]; P[w].push(v); }
      }
    }
    const delta = new Float64Array(N);
    while(stack.length){
      const w = stack.pop();
      const preds = P[w];
      for(let k=0;k<preds.length;k++){
        const v = preds[k];
        delta[v] += (sigma[v]/sigma[w]) * (1+delta[w]);
      }
      if(w !== s) CB[w] += delta[w];
    }
  }
  const map = new Map();
  nodes.forEach((n,i)=> map.set(n.id, CB[i]/2)); // /2 لأن الجراف غير موجّه
  return map;
}

// ---- item 7: اقتراح روابط ناقصة (Jaccard Similarity عبر جيران الدرجة الثانية — اقتراح فقط، بدون إضافة تلقائية) ----
function suggestMissingLinks(maxResults){
  maxResults = maxResults || 30;
  const adj = getAdjacency();
  const scores = new Map();
  nodes.forEach(n=>{
    const neighborsA = adj.get(n.id);
    if(neighborsA.size === 0) return;
    const candidateIds = new Set();
    neighborsA.forEach(nb=>{
      adj.get(nb).forEach(cand=>{
        if(cand !== n.id && !neighborsA.has(cand)) candidateIds.add(cand);
      });
    });
    candidateIds.forEach(candId=>{
      const key = n.id < candId ? n.id+'_'+candId : candId+'_'+n.id;
      if(scores.has(key)) return;
      const neighborsB = adj.get(candId);
      let commonCount = 0;
      neighborsA.forEach(x=>{ if(neighborsB.has(x)) commonCount++; });
      if(commonCount < 2) return; // إشارة ضعيفة جدًا، تجاهلها
      const unionSize = new Set([...neighborsA, ...neighborsB]).size;
      const jaccard = unionSize>0 ? commonCount/unionSize : 0;
      scores.set(key, { aId: n.id, bId: candId, jaccard, common: commonCount });
    });
  });
  return [...scores.values()].sort((x,y)=> y.jaccard - x.jaccard || y.common - x.common).slice(0, maxResults);
}

